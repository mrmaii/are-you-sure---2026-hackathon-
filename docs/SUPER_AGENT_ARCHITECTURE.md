# 超级 Agent 架构：智能搜索与质量策略

本文档描述超级 Agent 的模块、数据流，以及「智能网页搜索 + 上下文链接」与「空返回直接跳过、保留手动兜底」的架构与实现约定。

---

## 一、超级 Agent 现有模块与流程

### 1.1 前端模块（`frontend/main.js`）

| 模块 | 作用 |
|------|------|
| `runSuperAgent()` | 入口：展开阶段多轮 + 收敛阶段多轮，直至 100% 或退出 |
| `processOneRedNode(node)` | **展开阶段**单节点：suggest → 空则 tips/candidates → 都空则抛 `no_ai_answer` 跳过；有则 POST answer + POST spawn |
| `processOneRedNodeConverge(node)` | **收敛阶段**单节点：同上取回答，只 POST answer，不 spawn |
| `spawnFromAnsweredNode(node)` | 100% 时从已答节点仅生成追问（只 POST spawn，不提交回答） |
| 中心 overlay / burst 弹窗 | 进度、本批问题、处理流程、ETA 展示 |
| `state.superAgentRunning` / `superAgentAbortRequested` | 运行中与退出请求 |

### 1.2 后端相关接口

| 接口 | 作用 |
|------|------|
| `POST .../nodes/{id}/answer/suggest` | 针对节点问题生成直接回答（已注入关联上下文 get_linked_context_for_node） |
| `POST .../nodes/{id}/tips/candidates` | 生成 2～3 条 Tips 候选（已注入关联上下文） |
| `POST .../nodes/{id}/answer` | 提交回答内容（by_ai 等） |
| `POST .../nodes/{id}/spawn` | 基于已答节点生成追问子节点 |
| `POST .../nodes/{id}/web-search` | 按节点问题 + 路径 + 项目构想搜网页，返回 results[] |

### 1.3 兜底机制现状

- **回答**：前端无兜底。suggest 与 tips/candidates 都为空时，直接抛 `no_ai_answer`，不提交、不 spawn，视为跳过。
- **追问**：后端 `spawn_followup_node` 在 AI 返回空追问时使用兜底文案「请进一步说明或补充相关细节。」创建子节点，以保证手动单次点击 spawn 不报 400。

---

## 二、目标行为

1. **超级 Agent 内加入智能网页搜索与上下文**
   - 处理每个红点节点时，可先调用现有「网页搜索」能力（`web-search`），将搜索结果摘要注入本次「回答建议 / Tips 候选」的上下文，使回答与追问不只依赖模型与已有上下文链接，还能利用实时网页信息。
   - 复用现有「上下文链接」：继续使用 `get_linked_context_for_node`，与网页摘要一起注入 suggest/tips。

2. **超级 Agent 内：返回为空不触发兜底，直接跳过**
   - 回答：保持现状——空则跳过，不提交。
   - 追问：当由超级 Agent 调用 spawn 时，若 AI 返回空追问，**不创建兜底子节点**，直接视为该节点本轮未产生追问（跳过），保证每个节点都是「有质量的」产出。

3. **实际操作（非超级 Agent）保留兜底**
   - 用户手动点击「生成追问」等操作时，spawn 仍使用兜底，避免 400，体验友好。

---

## 三、架构设计

### 3.1 数据流（展开阶段单节点）

```
[可选] 网页搜索
    → GET/POST web-search → results[]
    → 取前 1～2 条 snippet 作为 web_snippets[]
        ↓
POST answer/suggest (body: { web_snippets?: string[] })
    → 后端将 web_snippets 拼入 skill_content，再调 generate_node_answer
    → 返回 content
        ↓
若 content 为空 → POST tips/candidates (body: { web_snippets?: string[] })
    → 同上拼入 web_snippets，返回 candidates[]
    → 取首条作为 answerContent
        ↓
若仍无 answerContent → 跳过（no_ai_answer），不提交、不 spawn
        ↓
若有 answerContent → POST answer → POST spawn?allow_fallback=false
    → 若 spawn 返回 no_followup（无追问）→ 不创建节点，本节点计为「已答但未产生追问」
    → 若有追问 → 正常创建子节点
```

收敛阶段单节点同样可带 `web_snippets` 调用 suggest/tips，空则跳过，不调用 spawn。

### 3.2 接口约定

| 接口 | 变更 |
|------|------|
| `POST .../nodes/{id}/answer/suggest` | 可选 body：`{ "web_snippets": string[] }`。后端将 web_snippets 拼入本次上下文中再生成回答。 |
| `POST .../nodes/{id}/tips/candidates` | 可选 body：`{ "web_snippets": string[] }`。同上，拼入上下文再生成候选。 |
| `POST .../nodes/{id}/spawn` | 可选 query：`allow_fallback=true|false`。默认 `true`（手动操作保留兜底）；超级 Agent 传 `false`。`false` 且 AI 无追问时返回 400 detail=`no_followup`，不创建节点。 |

### 3.3 后端逻辑

- **suggest_node_answer / get_tips_candidates**  
  若请求带 `web_snippets` 且非空，在现有 `skill_content`（含 get_linked_context_for_node 结果）基础上，追加一段「网页参考」类前缀/后缀，再调用 AI。

- **spawn_followup_node(session, project_id, node_id, *, allow_fallback=True, ...)**  
  - 当 `allow_fallback=True`：行为与现有一致，无追问时用兜底文案创建子节点。  
  - 当 `allow_fallback=False`：无追问时 `raise ValueError("no_followup")`，由路由转为 400，不创建节点。

### 3.4 前端逻辑

- **processOneRedNode**
  1. 若项目/配置允许（如后端或前端配置有搜索能力），先 `POST .../nodes/{id}/web-search`，从 `results` 取前 1～2 条 `snippet` 组成 `web_snippets`。
  2. 使用 `web_snippets` 调用 suggest，再按需调用 tips/candidates；都空则跳过。
  3. 提交 answer 后调用 `POST .../spawn?allow_fallback=false`；若响应 400 且 detail 为 `no_followup`，视为本节点未产生追问，不把该次 spawn 计为成功展开（不增加 totalExpanded 或按需统计），不报错。

- **processOneRedNodeConverge**
  同上 1～2（可选网页搜索 + 带 web_snippets 的 suggest/tips），空则跳过；不调用 spawn。

- 手动触发的 spawn（如长按拖动生成追问）  
  继续使用默认 `allow_fallback=true`（或不传，沿用后端默认），保留兜底。

---

## 四、文件与职责

| 文件 | 职责 |
|------|------|
| `docs/SUPER_AGENT_ARCHITECTURE.md` | 本文档：架构与约定 |
| `backend/schemas.py` | 可选 SuggestRequest、TipsCandidatesRequest（web_snippets） |
| `backend/main.py` | suggest/tips 接受 body 并拼 web_snippets；spawn 接受 allow_fallback 并下传 |
| `backend/services.py` | spawn_followup_node 增加 allow_fallback，False 时无追问抛 no_followup |
| `frontend/main.js` | processOneRedNode 先 web-search、带 web_snippets 调 suggest/tips、spawn 传 allow_fallback=false 并处理 no_followup |

---

## 五、质量与体验小结

- **有质量回答**：仅当 suggest 或 tips 有内容时才提交 answer；空则跳过，不写占位文案。  
- **有质量追问**：超级 Agent 下 spawn 无追问时不创建兜底节点，直接跳过。  
- **手动操作友好**：手动 spawn 保留兜底，避免 400。  
- **能力扩展**：通过 web_snippets 与现有上下文链接结合，超级 Agent 在「回答与生成问题」之外，增加「智能搜索网页」能力，且不改变现有画布与上下文链接的语义。
