# 熵导图 — 架构说明

简要说明技术栈、目录结构、前后端职责与前端模块划分，便于维护与协作。

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端 | Python 3 + FastAPI | REST API，无 SSR |
| 数据 | SQLModel + SQLite | 默认 SQLite，可配置 DATABASE_URL |
| AI | OpenAI 兼容 API | 可选多端点轮询、429 重试 |
| 前端 | 单页 HTML + 原生 JS (ES Module) + Tailwind CSS | 无构建步骤，CDN 引入 |
| 部署 | uvicorn 挂载静态文件 | 访问根路径即前端 |

---

## 二、目录结构

```
项目根/
├── backend/           # 后端
│   ├── main.py        # FastAPI 入口、路由、静态挂载
│   ├── services.py    # 业务逻辑（立项、脑图、融合、材料等）
│   ├── schemas.py     # 请求/响应模型
│   ├── models.py      # 数据库模型
│   ├── ai_client.py   # 大模型调用（多端点、429 重试）
│   ├── db.py          # 数据库初始化与会话
│   └── skills.py      # Agent Skills 扫描与内容读取
├── frontend/          # 前端（ES Module，无构建）
│   ├── main.js        # 入口：事件绑定、立项/脑图/菜单/超级 Agent/Tips/网页搜索等逻辑
│   ├── config.js      # API_BASE、LAYOUT、CONNECTOR_MORPHOLOGY、画布与文档常量
│   ├── state.js       # 全局状态（projectId、nodes、canvas、contextLinks 等）
│   ├── dom.js         # 集中 DOM 引用（topBar、canvasInner、contextMenu 等）
│   ├── api.js         # apiJson、readFileAsBase64、uploadAndParseDocument
│   └── utils.js       # showToast、escapeHtml、getNodeShortTitle
├── skills/            # Agent Skills Markdown（黑客松等）
├── docs/              # 文档目录
│   ├── README.md      # 本目录文档索引
│   ├── ARCHITECTURE.md # 本文档
│   └── 宣传片策划.md   # 宣传片策划（待填）
├── index.html         # 单页 HTML 入口
├── PRD-产品需求文档.md
├── DECISIONS.md
├── CONTEXT_LINKS_REF.md
├── PLAN_SEARCH_AND_MULTIMODAL.md
├── requirements.txt
└── .env / .env.example
```

---

## 三、后端职责

- **main.py**：路由、参数校验、调用 services，挂载静态资源。
- **services.py**：Draft 对话、from-draft 生成项目、节点回答/追问/Tips、材料、融合、进度计算、上下文连线注入。
- **ai_client.py**：封装 LLM 调用（极速/推理模型、多端点轮询、429 重试）。
- **skills**：从 `skills/*.md` 读取内容，供立项与脑图阶段注入 system 上下文。

数据流：Draft → Project → Node/NodeAnswer/ContextLink → Merge。详见 PRD。

---

## 四、前端模块职责

- **config**：API_BASE、LAYOUT、CONNECTOR_MORPHOLOGY、画布缩放范围、ALLOWED_DOC_TYPES、SUPER_AGENT_BURST_IDS。
- **state**：projectId、draftId、nodes、contextLinks、canvas、activeId、菜单与超级 Agent 状态等。
- **dom**：集中存放 getElementById 得到的元素引用，避免散落全局。
- **api**：`apiJson`、readFileAsBase64、uploadAndParseDocument；统一走 API_BASE。
- **utils**：showToast、escapeHtml、getNodeShortTitle（简单版，供其他模块复用）。
- **main**：立项对话、脑图渲染与画布、节点作答与融合/PDF、右键菜单与空白菜单、超级 Agent、Tips、网页搜索、事件绑定与初始化；内部保留 escapeHtml/getNodeShortTitle 完整实现及业务逻辑。

前端为 ES Module，`index.html` 仅加载 `frontend/main.js`（type="module"），由 main.js import config/state/dom/api/utils。

---

## 五、配置与运行

- 环境变量见 `.env.example`；必选为 AI 相关（不配则无 AI，脑图用内置规则）。
- 启动：`uvicorn backend.main:app --reload`，浏览器访问 `http://localhost:8000`。
- 健康检查：`GET /health` → `{"status":"ok"}`。

更细的接口与行为以 **PRD** 与 **backend** 代码为准。
