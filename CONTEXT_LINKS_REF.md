# 上下文连线与上下文相关功能 — 检索汇总

本文档汇总项目中与「上下文连线」「共享上下文」「关联上下文」相关的所有实现与入口。

---

## 一、概念与数据模型

### 1.1 术语

| 术语 | 含义 |
|------|------|
| **上下文连线 / 共享上下文** | 两个节点之间建立的非父子关联；画布上显示为**粗、半透明、虚线**。 |
| **ContextLink** | 数据库表：`project_id` + `node_a_id` + `node_b_id`（存储时保证 `node_a_id < node_b_id`）。 |
| **关联上下文** | 回答/Tips 时，后端把「与该节点通过 ContextLink 关联的其它节点」的内容拼成文本，注入模型 prompt，供参考。 |

### 1.2 数据层

- **表**：`backend/models.py` — `ContextLink(project_id, node_a_id, node_b_id)`。
- **Schema**：`backend/schemas.py` — `ContextLinkOut(node_a_id, node_b_id)`、`ContextLinkCreateRequest(node_a_id, node_b_id)`；`ProjectOut` 含 `context_links: List[ContextLinkOut]`。
- **唯一性**：同一对节点在同一项目下只存一条；重复 POST 返回已有链接不报错。

---

## 二、建立连线的两种方式

### 2.1 长按节点拖到另一节点（任意两节点）

- **前端**：
  - 节点 `mousedown` 时启动 400ms 定时器 `_contextLinkTimer`；若 400ms 内未移动超过 8px，则进入「画线模式」：`state.drawingContextLink = { fromNodeId, endX, endY }`，并取消节点拖拽。
  - 若 400ms 内移动超过 8px，则 `clearTimeout(_contextLinkTimer)`，按普通节点拖拽处理。
  - `mousemove` 时若 `drawingContextLink` 存在，更新 `endX/endY` 为当前鼠标在 canvas-inner 下的坐标，用于预览线。
  - `mouseup` 时：若鼠标释放在某**节点**上（且不是 from 节点），则 `POST /api/projects/{id}/context-links`，body `{ node_a_id, node_b_id }`（前端传原始 id，后端会规范为 a&lt;b）；成功后推入 `state.contextLinks` 并 `updateConnectors()`，toast「已建立共享上下文连线」。
- **位置**：`frontend/main.js` — 约 691–702（定时器与进入画线）、1919–1927（拖拽时取消定时器）、1960–1992（mouseup 落点检测与 POST）。

### 2.2 右键「熵减方案」→「链接材料」（问题节点 ↔ 材料节点）

- **前端**：
  - 右键打开圆盘菜单，在「熵减方案」下有一块「链接材料」区域，列出当前项目下所有 `node_type === "material"` 的节点；点击某材料即调用 `linkMaterialToNode(nodeId, materialId)`。
  - `linkMaterialToNode`：`POST /api/projects/{id}/context-links`，body `{ node_a_id: nodeId, node_b_id: materialId }`，成功后更新 `state.contextLinks` 并 `updateConnectors()`，toast「已链接材料到本节点，可作上下文参考」。
- **入口**：`frontend/main.js` — 1683–1704（`linkMaterialToNode`）、1739–1745（右键 action `link-material`）；`index.html` — 约 819–836（熵减方案 → 链接材料 UI）。

---

## 三、后端 API

### 3.1 添加一条上下文连线

- **路由**：`POST /api/projects/{project_id}/context-links`
- **Body**：`ContextLinkCreateRequest` = `{ node_a_id: str, node_b_id: str }`
- **逻辑**（`backend/main.py`，约 260–293）：
  - 校验 project、node_a、node_b 存在且属于该 project；禁止 `node_a_id === node_b_id`。
  - 规范为 `(node_a_id, node_b_id) = (a, b) if a < b else (b, a)`。
  - 若已存在相同 (project_id, node_a_id, node_b_id)，直接返回已有链接；否则 `ContextLink` 插入并 commit。
- **返回**：`ContextLinkOut(node_a_id, node_b_id)`（规范后的顺序）。

### 3.2 项目详情中的 context_links

- **路由**：`GET /api/projects/{project_id}`
- **返回**：`ProjectOut` 包含 `context_links: List[ContextLinkOut]`；来自 `select(ContextLink).where(ContextLink.project_id == project_id)`，前端所有刷新项目的地方都会拿到最新 `context_links` 并写入 `state.contextLinks`。

---

## 四、关联上下文在 AI 中的使用

与某**节点**相关的「关联上下文」指：通过 ContextLink 与该节点相连的**其它节点**的内容。

### 4.1 内容规则（`backend/services.py` — `get_linked_context_for_node`）

- 查该 `project_id` 下所有 `node_a_id == node_id or node_b_id == node_id` 的 ContextLink。
- 对每条 link 取「另一侧」节点：
  - 若为 **material** 节点：取该节点下最新一条 `NodeAnswer` 的 `content`（即导入网页时的正文）；若无则用 `node.question`（存 URL 等）。
  - 若为**普通节点**：取该节点下最新一条 `NodeAnswer` 的 `content`。
- 每条格式：`【{title}】\n{content}`，多段用 `\n\n---\n\n` 拼接，总长截断至 12000 字符。

### 4.2 注入到哪些接口

| 接口 | 文件位置 | 说明 |
|------|----------|------|
| **回答建议**（超级 Agent 用） | `backend/main.py` — `suggest_node_answer`（约 553–555） | 调用前 `get_linked_context_for_node`，若有则拼到 `skill_content` 前：`"\n\n关联上下文（供参考）：\n" + linked`，再调 `ai.generate_node_answer`。 |
| **Tips 候选** | `backend/main.py` — `get_tips_candidates`（约 581–583） | 同上，拼入 `skill_content` 后调 `ai.make_tips_candidates`。 |
| **追问**（spawn） | `backend/services.py` — `spawn_followup_node`（约 502–504） | 拼入 `skill_content` 后调 `ai_client.node_answer_judge_and_followups`。 |

用户在该节点**作答**时提交的是纯文本，不再次调 AI 生成内容，因此「关联上下文」不参与普通提交回答的请求；但若用户先点「参考答案」再选「直接作回答」，会走 Tips 候选或回答建议，此时会带上关联上下文。

---

## 五、前端展示与交互

### 5.1 画布上的线

- **已保存的上下文连线**：在 `renderConnectors()` 中，遍历 `state.contextLinks`，用 `nodePositions` 取两节点中心坐标，画 SVG path（直线），样式：`stroke-width: 4`、`stroke-dasharray: 12 8`、颜色 `rgba(66,133,244,0.5)`（非黑客松）或 `rgba(0,255,249,0.5)`（黑客松），class `connector-context-link`。
- **长按拖线预览**：若 `state.drawingContextLink` 存在且含 `endX/endY`，从 from 节点中心到 `(endX, endY)` 画一条虚线预览（同函数内约 805–822）。

### 5.2 刷新 context_links 的时机

所有会重新拉取 `GET /api/projects/{project_id}` 的地方都会执行 `state.contextLinks = project.context_links || ...`，例如：进入脑图、作答/追问/Tips/融合后刷新项目、超级 Agent 每轮后刷新、从项目列表进入等。见 `frontend/main.js` 中多处 `state.contextLinks = project.context_links`。

### 5.3 材料节点与「链接材料」

- 材料节点：`node_type === "material"`，由「画布空白处右键 → 导入网站」创建，放在画布左侧一列；其正文存在该节点的 `NodeAnswer` 中，通过 context-link 与问题节点关联后，在回答/Tips 时作为「关联上下文」被读取。
- 导入材料成功后的 toast 会提示：可在节点右键「熵减方案」中链接材料到节点。

---

## 六、与「上下文」相关的其他提及（非连线）

- **Agent Skills / system 上下文**：`skills/*.md` 与分区 skill 内容注入到 LLM 的 system 或 prompt，称为「技能上下文」或「场景上下文」，与 ContextLink 的「关联上下文」是两套机制；后者仅来自与当前节点有连线的其它节点内容。
- **PRD / 文档**：`PRD-产品需求文档.md`、`ENTROPY_BRAND_PLAN.md` 等中的「熵减方案」「共享上下文」等描述与上述实现一致。
- **Skills 文档**：`skills/hackathon_supervisor.md` 中的「上下文长度」指对话/回答文本长度，用于动态提问策略，与画布上的上下文连线无直接对应。

---

## 七、当前未实现的能力

- **删除连线**：后端无 `DELETE /api/projects/{id}/context-links` 或按 link id/node pair 删除的接口；前端无「取消链接」入口。若需取消某条共享上下文，需在库中直接删记录或后续加接口与按钮。

---

## 八、文件索引（上下文连线与关联上下文）

| 文件 | 相关内容 |
|------|----------|
| `backend/models.py` | `ContextLink` 表定义 |
| `backend/schemas.py` | `ContextLinkOut`、`ContextLinkCreateRequest`，`ProjectOut.context_links` |
| `backend/main.py` | `add_context_link`、`get_project` 返回 context_links、`suggest_node_answer` / `get_tips_candidates` 中调用 `get_linked_context_for_node` |
| `backend/services.py` | `get_linked_context_for_node` 实现，`spawn_followup_node` 中注入关联上下文，`create_material_node` 注释 |
| `frontend/main.js` | `state.contextLinks`、`state.drawingContextLink`、`_contextLinkTimer`；长按 400ms 进入画线、mouseup 落点 POST、`linkMaterialToNode`、`renderConnectors` 中画上下文连线与预览线、各处刷新 `context_links` |
| `index.html` | 节点右键圆盘、「熵减方案」「链接材料」UI，`#node-context-menu`、`#context-menu-materials` |
| `PRD-产品需求文档.md` | 画布交互、材料与上下文、ContextLink 术语 |

以上为当前项目中「上下文连线」及「上下文相关」内容的完整检索汇总。
