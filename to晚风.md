
---

## 栈与跑法

- **后端**：FastAPI，SQLite（SQLModel），单进程同步；无队列、无缓存。
- **前端**：单页，根目录 `index.html` + `frontend/main.js`，无构建；静态由 FastAPI 挂根目录提供。
- **跑**：`pip install -r requirements.txt`（含 `python-multipart`），`uvicorn backend.main:app --reload`，浏览器开 `http://localhost:8000`。
- **配置**：`.env` 从 `.env.example` 拷，`AI_API_BASE` / `AI_API_KEY` / `AI_MODEL` 不配则走 stub（不调真实模型）。

---

## 架构与数据流

- **请求链**：前端 `main.js` 调 `fetch` → `backend/main.py` 路由 → `services.py` 业务 + `ai_client.py` 调模型；DB 用 `db.py` 的 session。
- **前端状态**：全在 `main.js` 的 `state` 对象里（`projectId`、`nodes`、`nodePositions`、`canvas`、`activeId`、`draggingNode` 等）；无前端路由，两阶段（立项对话 / 脑图）用显式显隐 `#chat-view` 和 `#mindmap-view`。
- **脑图坐标**：画布是 4000×4000 的逻辑平面，`#canvas-inner` 用 `transform: translate(...)` 做平移；节点 `position: absolute`，`left/top` 是相对 canvas-inner 的逻辑坐标；连线 SVG 在 canvas-inner 内，用同一套逻辑坐标画，不依赖视口。目前是有点bug，刚加载的导图主题会飞到左上角，你看看能不能复现然后修掉

---

## 入口与关键函数

| 层级 | 文件 | 看点 |
| API | `backend/main.py` | 路由全在这；立项对话 `POST /api/draft`，建项目+初题 `POST /api/projects`，作答 `POST .../nodes/{id}/answer`，追问/ Tips `.../spawn`、`.../tips`、`.../tips/candidates`、`.../tips/choose`，融合 `POST .../merge`。 |
| 业务 | `backend/services.py` | `create_project`（draft → 初题 → 生成脑图节点）、`add_answer`、`spawn_child`、Tips 相关；节点树用 `parent_id`，扁平列表用 `flatten_nodes`。 |
| AI | `backend/ai_client.py` | `draft_analyze_and_reply`（立项只澄清本质）、`generate_initial_mindmap_questions`（进脑图后的初题）、`generate_mindmap`（stub 或 LLM 生成整树）、`node_answer_judge_and_followups`、`make_tips_candidates`、`merge_project_doc`；统一 `_call_llm(messages)`，无 path 上下文，只 project_idea + 当前/父节点。 |
| 前端 | `frontend/main.js` | `buildMap()` 根据 `state.nodes` + `state.nodePositions` 渲染节点和 `connector-svg`；节点 mousedown/click/contextmenu 内联绑定；画布拖拽在 `mindmapView` 上监听 mousedown（排除 node/panel/float），mousemove/mouseup 在 window；`updateConnectors()` 按 `nodePositions` 重画线，`syncCanvas()` 只改 canvas-inner 的 transform。 |

---

## 已知问题与修改点（交互），拜托大佬修一下我的屎山代码，可以用cursor或者什么ai读一下文件给你介绍一下。

1. **节点/框交互不稳**  

2. **拖拽节点时连线/框不同步**  

3. **动效与观感**  
   修稳交互后再考虑；节点 transition、连线重绘的节流可酌情加。

---

## 待办：Agent Skills

- **产品定义**：见 **DECISIONS.md** 第 9 条——预置场景模板 + 用户自导入模板，让回答更场景化、更可控。
- **落点**：  
  - 后端：新增技能/模板的存储（表或 JSON 文件均可），提供列表/选择/上传接口；在 **`ai_client.py`** 所有 `_call_llm` 的 `messages` 里，在首条或 user 前插入一条 system（或 user）携带当前选中的 Skill 说明/模板内容。  
  - 前端：顶栏或设置里加「当前 Skill」选择（及可选的上传/管理），请求里带 `skill_id` 或模板内容；后端据此注入 context。  
- **最小闭环**：预置 2～3 个模板 + 调用 AI 时固定带当前模板即可；自导入与持久化可二期。

---

## 文档与约定

- **DECISIONS.md**：产品决策记录。  
- **README.md**：面向用户的使用与启动说明。  
- **.env.example**：环境变量示例；密钥不要进库。  
- 代码注释是个人开发向，可随改随补；若动接口或状态结构，建议在 DECISIONS 或本文件补一笔，方便后面的人接。

