# 熵导图（Are you sure / MindBridge）— 产品需求文档（PRD）

> 根据当前项目已实现功能与已知设计整理，与代码行为一致。  
> 文档格式：Markdown（可据此导出为 Word/PDF）。  
> 最后整理：涵盖立项、脑图、上下文连线、超级 Agent（含智能网页搜索与质量策略）、配置、决策与规划。

---

## 一、产品概述

### 1.1 产品名称与定位

- **产品名称**：熵导图（前端标题：熵导图 · 控制信息的熵增与熵减；README 中亦称 MindBridge）
- **一句话**：用对话补全你的项目脑图——把模糊想法变成清晰的项目地图，通过立项对话与可逐项回答的脑图，最终一键融合成完整方案文档。

### 1.2 核心价值

- **先聊清「项目本质」**：AI 通过少量关键问题（如方向、类型）澄清方向，再进入脑图，避免一上来填大量表单。
- **文档即立项**：支持拖拽/上传 `.txt`、`.pdf`、`.docx` 项目书，解析为项目构想并直接进入分析流程。
- **脑图工作台**：根据构想生成结构化问题节点（含黑客松场景下的「根 + 6 板块 + 每板块问题」），用户逐项作答；支持追问、Tips、材料链接、网页搜索、共享上下文连线等。
- **一键融合**：全部答完后，将构想与问答整合成一篇可读的项目文档，并支持导出 PDF。

### 1.3 目标用户与场景

- 个人或小团队在**立项、写 BP、梳理产品思路**时，快速把「脑子里那团东西」结构化。
- 黑客松等场景下，按**预设板块（如团队、技术、风险等）**生成问题树并补全。

---

## 二、功能清单（按模块）

### 2.1 立项阶段

| 功能 | 说明 | 实现要点 |
|------|------|----------|
| 文本输入立项 | 用户在首页输入项目想法，点击开始 | 内容作为首条用户消息进入 Draft 对话 |
| 文档导入立项 | 支持拖拽或选择 `.txt`、`.pdf`、`.docx`（最大 5MB） | 后端 `/api/parse-document` 解析出正文，以全文作为项目构想直接启动立项；界面展示为「文件包」气泡 |
| 立项多轮对话（Draft） | AI 分析用户输入，决定是否继续追问（need_more） | `POST /api/draft` 创建会话，`POST /api/draft/{id}/message` 发送消息；返回 need_more、reply、title、initial_questions；本阶段只做「界定本质」，不问受众/细节 |
| 从 Draft 生成项目 | 当 need_more=false 时，用 title 与对话历史生成脑图项目 | `POST /api/projects/from-draft`；当前为「黑客松」结构：根节点 + 6 个 section 板块 + 每板块 1～2 个问题 |
| Agent Skills 选择 | 立项前可选一种 Skill，用于优化 AI 分析与问题生成 | 前端拉取 `GET /api/skills`，发 message/from-draft 时带 skill_id；后端将 skill 内容注入模型上下文；当前仅「黑客松（六分区 + 总监督）」 |

### 2.2 脑图工作台

| 功能 | 说明 | 实现要点 |
|------|------|----------|
| 脑图结构展示 | 根节点（芯片图标）、一级板块（文件夹）、问题节点、Tips 节点、材料节点 | 根→板块：粗直线；板块→问题：弯曲粗线；问题→追问/Tips：细线；Tips 为虚线；材料节点单独一列 |
| 节点类型 | question / section / tip / material | section 仅展示、不参与进度；tip 为信息节点不需作答；material 为导入的网页材料 |
| 节点状态与进度 | red（待答）、green（人工答完）、ai（AI 答完）；进度条按问题节点数计算完成百分比 | 仅 question 且 level>0 参与 total/green；100% 后「融合项目成果」可点 |
| 节点作答 | 选中问题节点后，在底部输入回答并提交 | `POST …/nodes/{node_id}/answer`，支持 content、by_ai；提交后生成「回答支点」子节点（人工=green 回答节点，AI=ai+tip 节点） |
| 追问（Spawn） | 在已回答的问题节点上生成新的追问子节点 | 问题节点右键「追问」→ `POST …/nodes/{id}/spawn`（可选 query `allow_fallback=true`，默认 true：无追问时用兜底文案创建子节点）；超级 Agent 内传 `allow_fallback=false` 时无追问返回 400 no_followup 且不创建节点；板块节点「在本板块下生成新问题」→ `POST …/spawn-section-question` |
| Tips | 已回答节点可生成 Tips 子节点；Tips 节点展示 2～3 条候选，用户选一条固化 | 生成：`POST …/nodes/{id}/tips`；候选：`POST …/tips/candidates`；选定：`POST …/tips/choose`（body: content） |
| 未回答节点的「参考答案」 | 未回答节点右键 Tips：拉取候选答案，可「直接作回答」或「作为 Tips」新建 Tips 节点并写入内容 | 同一 candidates 接口；前端区分并调用 answer / tips+choose |
| AI 短标题 | 问题/Tips 节点可请求 2～7 字短标题 | `POST …/nodes/{id}/title`；前端新节点展示「命名中…」再更新；轻量调用走极速模型 |
| 节点右键菜单 | 作答、追问、网页搜索、链接材料、Tips/参考答案 | 根据节点类型与状态显隐（如 section 仅「追问」、未答节点无追问等）；熵增方案 / 熵减方案圆盘子项 |
| 画布交互 | 拖拽平移、滚轮缩放、节点可拖动位置；长按节点（约 400ms）拖到另一节点建立「共享上下文」连线 | 连线存储为 context_links；画布上为粗半透明虚线；回答/Tips/追问时后端注入关联节点内容作上下文 |
| 超级 Agent | 一键自动：按 BFS 选红点，用 AI 建议回答并追问，多轮后收敛至 100%；**使用网页搜索与上下文连线增强回答**；**空返回直接跳过、不兜底** | 每节点先调网页搜索（若已配置 SEARCH_API_KEY），摘要注入 suggest/tips；关联上下文由后端自动注入；回答空则跳过不提交，追问空则 spawn 不创建兜底节点（allow_fallback=false）；手动追问保留兜底；见 4.2 节 |

### 2.3 材料与上下文（上下文连线）

| 功能 | 说明 | 实现要点 |
|------|------|----------|
| 导入材料（URL） | 画布空白处右键「导入网站」：输入 URL，后端抓取正文并创建材料节点 | `POST /api/projects/{id}/materials`（url、可选 title）；材料节点 node_type=material，画布左侧一列；正文存该节点 NodeAnswer |
| 链接材料到节点 | 问题节点右键「熵减方案」→「链接材料」中选某材料，建立与当前节点的上下文关联 | `POST /api/projects/{id}/context-links`（node_a_id, node_b_id）；回答/Tips/追问该节点时模型可参考材料内容 |
| 共享上下文连线 | 长按节点（400ms 内不移动）拖到另一节点，建立两节点间的上下文关联（非父子） | 同上 context-links；画布上为粗半透明虚线（stroke-dasharray 12 8）；存储时 node_a_id &lt; node_b_id，同对不重复插入 |
| 关联上下文注入 | 与某节点通过 ContextLink 相连的其它节点内容，在部分 AI 调用中注入 prompt | 材料节点=网页正文或 URL；普通节点=最新回答；格式【标题】+内容，总长截断 12000 字；注入到：回答建议、Tips 候选、追问 spawn |
| 网页搜索 | 节点右键「熵增·网页」：按项目构想+节点问题搜相关案例；**超级 Agent 也会按节点调用并将摘要注入回答/Tips** | `POST …/nodes/{id}/web-search`；需配置 SEARCH_API_KEY（如 Serper）；结果展示在问题浮层；回答建议/Tips 候选支持可选 body `web_snippets`，超级 Agent 将网页摘要传入以增强生成 |

**当前未实现**：删除某条上下文连线（无 DELETE 接口与前端入口）。

### 2.4 融合与导出

| 功能 | 说明 | 实现要点 |
|------|------|----------|
| 融合项目成果 | 当进度 100% 时，将全部问答按路径聚合，由 AI 生成一篇完整项目文档 | `POST /api/projects/{id}/merge`；返回 Markdown 风格 content；弹窗展示；使用项目 skill 与推理模型 |
| 导出 PDF | 融合后可在弹窗内「下载 PDF 报告」 | 前端打开打印友好页（含 marked 渲染），用户浏览器「另存为 PDF」或 Ctrl+P |

### 2.5 项目与 API 概览

| 功能 | 说明 | 实现要点 |
|------|------|----------|
| 项目列表 | 获取所有项目及进度百分比 | `GET /api/projects` → ProjectListItem[] |
| 项目详情 | 获取单项目完整节点树、进度、context_links | `GET /api/projects/{id}` → ProjectOut |
| 添加上下文连线 | 建立两节点共享上下文 | `POST /api/projects/{id}/context-links`，body: { node_a_id, node_b_id } |
| 回答建议（含网页摘要） | 针对节点问题生成直接回答，可选传入网页摘要 | `POST …/nodes/{id}/answer/suggest`，可选 body: { web_snippets: string[] }，后端拼入「网页参考」后调用模型；超级 Agent 使用 |
| Tips 候选（含网页摘要） | 拉取 2～3 条 Tips 候选，可选传入网页摘要 | `POST …/nodes/{id}/tips/candidates`，可选 body: { web_snippets: string[] }；超级 Agent 使用 |
| 健康检查 | 用于确认后端可用 | `GET /health` → { status: "ok" } |
| 静态前端 | 单页应用由 FastAPI 挂载在根路径 | 访问 http://localhost:8000 即前端 |

---

## 三、非功能需求与约束

### 3.1 技术栈与部署

- **后端**：FastAPI + SQLModel（SQLite）；可选 OpenAI 兼容 API（.env：AI_API_BASE、AI_API_KEY、AI_MODEL）。
- **前端**：单页 HTML + Tailwind + 原生 JS，无构建步骤；API 基地址默认 `http://localhost:8000`。
- **启动**：`uvicorn backend.main:app --reload`，前端通过根路径访问。

### 3.2 配置项（.env）

| 配置项 | 说明 | 必填 |
|--------|------|------|
| AI_API_BASE | OpenAI 兼容接口 base URL | 不填则无 AI，脑图用内置规则 |
| AI_API_KEY | 对应 API Key | 同上 |
| AI_MODEL | 默认模型名 | 不填默认 gpt-4o-mini |
| AI_MODEL_FAST | 极速模型（短标题等轻量调用） | 不填则用 AI_MODEL |
| AI_MODEL_REASONING | 推理模型（澄清、追问、Tips、融合等） | 不填则用 AI_MODEL |
| AI_API_BASE_2 / AI_API_KEY_2 | 第二组端点，与第一组轮询，减轻 429 | 可选 |
| AI_API_BASE_3 / AI_API_KEY_3 | 第三组端点 | 可选 |
| SEARCH_API_KEY | 网页搜索（如 Serper）；未配置时 web-search 返回 hint，超级 Agent 仍运行但不注入网页摘要；配置后节点右键「网页」与超级 Agent 均会使用 | 可选 |
| DATABASE_URL | 数据库连接，默认 SQLite | 可选 |

### 3.3 文档解析限制

- 支持格式：`.txt`、`.pdf`、`.docx`。
- 单文件最大 5MB；解析后文本截断至 50000 字符。

### 3.4 安全与体验

- CORS 允许所有来源（开发/内网场景）；生产环境建议限制 origin。
- 右键菜单、拖拽等做了与系统默认行为的隔离，避免误触。

---

## 四、核心流程与关键方案

### 4.1 立项 → 脑图主流程

1. 用户输入想法或上传文档（解析为 idea_text）。
2. 创建 Draft：`POST /api/draft`（可选 mode：brief / detail / deep）。
3. 多轮对话：`POST /api/draft/{id}/message`，AI 只做「界定本质」的追问，直到返回 need_more=false 且带 title。
4. 生成项目：`POST /api/projects/from-draft`；后端用黑客松 6 分区（问题与机会、解决方案、技术实现、商业模式、团队与执行、风险与应对）+ 总监督 Skills 生成根 + 6 个 section + 每板块 1～2 个问题。

### 4.2 超级 Agent 流程

- **能力增强**：每处理一个红点节点时，（1）**网页搜索**：先调用 `POST …/nodes/{id}/web-search`（需配置 SEARCH_API_KEY），取前 1～2 条摘要作为 `web_snippets`，在调用回答建议与 Tips 候选时通过 body 传入，后端拼入「网页参考」上下文；（2）**上下文连线**：与当前节点通过 ContextLink 关联的材料/节点内容由后端在 suggest、tips/candidates、spawn 中自动注入（get_linked_context_for_node）。界面爆发弹窗会提示「每节点流程」含网页搜索与上下文连线，有连线时显示「共 X 条上下文连线将参与回答」；若未配置 SEARCH_API_KEY，首轮会 toast 提示配置后可启用网页搜索。
- **展开阶段**（多轮）：按 BFS 取红点，每批 2 个并发——（可选网页搜索 →）拉取 `answer/suggest`（可带 body `web_snippets`）→ 空则拉取 `tips/candidates`（可带 `web_snippets`）→ **都空则跳过该节点不提交**；有内容则以 by_ai=true 提交回答 → 调用 `spawn?allow_fallback=false` 生成追问，**若 AI 无追问则返回 no_followup 且不创建兜底子节点**。若无红点，消耗「从根找问题」配额（15 次）在已答节点上尝试 spawn（同样 allow_fallback=false）；用尽后若连续 3 轮仍 100% 无新追问则结束展开。
- **收敛阶段**（最多 20 轮）：剩余红点同样可带网页摘要调用 suggest/tips，**空则跳过**；只做「回答」不追问，直到完成度 100%。
- **质量策略**：超级 Agent 内「返回为空不触发兜底、直接跳过」，保证每个回答与追问均有质量；**手动操作**（如用户右键「追问」）保留兜底，spawn 默认 allow_fallback=true，无追问时仍创建兜底子节点以避免 400。
- 支持中途点击「退出」立即停止。
- 架构与接口细节见 [docs/SUPER_AGENT_ARCHITECTURE.md](docs/SUPER_AGENT_ARCHITECTURE.md)。

### 4.3 超级 Agent 触发 429 的应对方案

- **现象**：超级 Agent 短时间发起大量 LLM 请求，单端点单 Key 易触发 429。
- **方案**：（1）**多端点轮询**：支持 AI_API_BASE/KEY、AI_API_BASE_2/KEY_2、AI_API_BASE_3/KEY_3，每次调用轮询到不同端点。（2）**429 重试退避**：遇 429 等待 3s/6s 后重试，重试时轮询换端点；最多 3 次请求，仍 429 则抛出异常。
- **使用建议**：配置 2～3 组 Base+Key（可同服务商多 Key 或不同服务商各一），见 `.env.example`。

### 4.4 融合流程

- 仅当进度 100%（total === green）时允许 `POST …/merge`。
- 后端按节点树聚合每个问题节点的路径标题 + 问题 + 用户解答，拼成 sections，再调用推理模型 + 可选 skill_content 生成一篇 Markdown；返回 content，前端弹窗展示并支持导出 PDF。

---

## 五、术语与数据模型

### 5.1 术语

| 术语 | 含义 |
|------|------|
| Draft | 立项阶段的多轮对话会话；status=chatting\|ready，ready 后可生成项目 |
| Project | 一个脑图项目，含 name、idea_text、status、skill_id 等 |
| Node | 脑图节点：根(level=0)、板块(section)、问题(question)、Tips(tip)、材料(material) |
| 红点/绿点/ai | 节点 status=red 待答、green 人工答完、ai 为 AI 答完 |
| ContextLink | 两节点间的「共享上下文」关系；存储 node_a_id &lt; node_b_id，回答/Tips/追问时模型可读取关联节点内容 |
| 材料节点 | 通过 URL 导入的网页正文，以节点形式存在，可被 context-link 到问题节点 |
| 融合（Merge） | 进度 100% 后，将整棵问题树的问答聚合成一篇 AI 润色后的项目文档 |
| Agent Skills | 预置的 Markdown 技能包；黑客松为「总监督 + 6 分区」，用于约束/优化 AI 生成的问题与回答 |

### 5.2 数据模型要点

- **Draft**：id, messages(JSON), status, mode, max_questions, current_questions, project_title, initial_questions(JSON)。
- **Project**：id, name, idea_text, status, mode, max_questions, current_questions, skill_id。
- **Node**：project_id, parent_id, level, title, question, status, order_index, node_type(question\|section\|tip\|material), skill_id（分区）。
- **NodeAnswer**：node_id, content；材料节点的网页正文也存于此。
- **ContextLink**：project_id, node_a_id, node_b_id（唯一性：同项目同对节点一条）。

### 5.3 Agent Skills（黑客松）

- **总监督**：`hackathon_supervisor`，参与所有 AI 交互的上下文（与分区 Skill 叠加）。
- **6 分区**：hackathon_problem（提出问题与机会）、hackathon_solution（解决方案）、hackathon_tech（技术实现）、hackathon_business（商业模式）、hackathon_team（团队与执行）、hackathon_risk（风险与应对）；section 节点带对应 skill_id，回答/追问/Tips 时用「总监督 + 该分区 skill」合并上下文。

---

## 六、决策摘要（来自 DECISIONS.md）

1. 从 Debate 机器人转向「基于产品的追问与发散」，用思维导图承载 AI 追问。
2. 追问改为用户主动触发，避免信息过载。
3. 加入 Tips：既可附属也可作为答案，支持多条并存。
4. Agent Skills：预置场景 + 导入 Markdown，立项与脑图阶段注入 system 上下文；项目存 skill_id，后续沿用。
5. 极速模型与推理模型分离：取名用极速、内容用推理（AI_MODEL_FAST / AI_MODEL_REASONING）。
6. 超级 Agent 触发 429：多端点轮询 + 429 重试退避（见 4.3）。
7. **超级 Agent 增强**：接入智能网页搜索（web_snippets 注入 suggest/tips）与既有上下文连线；空返回直接跳过、不兜底（spawn 支持 allow_fallback，超级 Agent 传 false、手动传 true）。

---

## 七、已知限制与未实现

- **上下文连线**：无删除连线接口与前端入口。
- **网页搜索**：未配置 SEARCH_API_KEY 时接口返回 hint，不报错；超级 Agent 仍运行，仅不注入网页摘要。
- **多模态**：节点附图、融合文档内图表等为规划中（见路线图），当前未实现。

---

## 八、路线图（规划中，来自 PLAN_SEARCH_AND_MULTIMODAL.md）

在**不改变现有基础功能**的前提下，可选增强：

| 阶段 | 内容 |
|------|------|
| P0 检索接入 | 已实现：节点 web-search、超级 Agent 按节点调用并将 web_snippets 注入 answer/suggest 与 tips/candidates；关联上下文在 suggest/tips/spawn 中注入 |
| P1 检索扩展 | 立项对话、融合文档引用接入检索；可选 RAG |
| P2 多模态-节点 | Node 支持可选 image_url；「生成该节点示意图」入口 |
| P3 多模态-融合 | 融合文档支持插图/图表 |
| P4 检索+多模态 | 先检索再生成文字+图/表，并注明来源 |

---

## 九、版本与变更说明

- 本文档基于当前代码库与 DECISIONS、CONTEXT_LINKS_REF、PLAN_SEARCH_AND_MULTIMODAL、SUPER_AGENT_ARCHITECTURE 等整理，覆盖已实现功能与已知设计。
- **近期变更**：超级 Agent 接入智能网页搜索（每节点 web-search → web_snippets 注入 suggest/tips）与既有上下文连线；空返回直接跳过、不兜底（回答空不提交、追问空时 spawn 不创建兜底节点，allow_fallback 区分超级 Agent 与手动）；回答建议与 Tips 候选接口支持可选 body `web_snippets`，spawn 支持 query `allow_fallback`；爆发弹窗与 toast 提示网页搜索与上下文连线使用情况。
- 若产品名、交互文案与 README 或界面有差异，以实际界面与 API 行为为准；后续若迭代功能，建议在本 PRD 中同步更新对应章节。

---

## 十、相关文档索引

| 文档 | 说明 |
|------|------|
| [docs/README.md](docs/README.md) | 项目文档索引（PRD、决策、架构、宣传片策划等） |
| [DECISIONS.md](DECISIONS.md) | 产品与功能决策日志 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术栈、目录结构、前后端与前端模块职责 |
| [docs/SUPER_AGENT_ARCHITECTURE.md](docs/SUPER_AGENT_ARCHITECTURE.md) | 超级 Agent 架构：智能搜索、上下文连线、空跳过与 allow_fallback 策略 |
| [CONTEXT_LINKS_REF.md](CONTEXT_LINKS_REF.md) | 上下文连线实现与 API |
| [PLAN_SEARCH_AND_MULTIMODAL.md](PLAN_SEARCH_AND_MULTIMODAL.md) | 检索与多模态路线图 |
| [docs/宣传片策划.md](docs/宣传片策划.md) | 宣传片/演示视频策划（待填） |
