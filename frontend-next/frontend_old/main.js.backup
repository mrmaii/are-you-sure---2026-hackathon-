// 前端入口：立项对话 + 脑图工作台，请求本地 8000 端口
import {
  API_BASE,
  LAYOUT,
  CONNECTOR_MORPHOLOGY,
  CANVAS_SCALE_MIN,
  CANVAS_SCALE_MAX,
  ALLOWED_DOC_TYPES,
  SUPER_AGENT_BURST_IDS,
} from "./config.js";
import { state } from "./state.js";
import {
  topBar,
  projectTitleDisplay,
  progressText,
  progressFill,
  mergeBtn,
  superAgentBtn,
  superAgentBtnText,
  heroSection,
  chatHistory,
  dropZone,
  dropFileInput,
  initialInput,
  startBtn,
  chatView,
  mindmapView,
  canvasContainer,
  canvasInner,
  nodePanel,
  activeNodeName,
  nodeInput,
  nodeSubmit,
  questionFloat,
  questionFloatTitle,
  questionFloatText,
  questionFloatCard,
  toastEl,
  toastIcon,
  toastText,
  skillSelect,
  superAgentCenterOverlay,
  superAgentProgressText,
  superAgentDetail,
  superAgentEtaText,
  resultModal,
  resultContent,
  contextMenu,
  contextMenuButtons,
  webSearchPanel,
  webSearchPanelIntro,
  webSearchPanelList,
  webSearchPanelClose,
} from "./dom.js";
import { apiJson, readFileAsBase64, uploadAndParseDocument } from "./api.js";
import { showToast } from "./utils.js";

if (typeof window !== "undefined") window.showToast = showToast;

// 脑图区域：节点上右键开圆盘菜单，空白处右键开「导入材料」
if (mindmapView) {
  mindmapView.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (e.target.closest(".node")) return;
    closeNodeContextMenu();
    openBlankContextMenu(e.clientX, e.clientY);
  });
}

// 全局屏蔽外来点击反应：禁止浏览器/插件右键菜单、系统拖拽、避免误触产生第三方弹窗
// 仅在输入框/可编辑区域内保留系统菜单（便于粘贴等）
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest("input, textarea, [contenteditable=\"true\"]")) return;
  e.preventDefault();
}, true);
document.addEventListener("dragstart", (e) => e.preventDefault(), true);
document.addEventListener("selectstart", (e) => e.preventDefault(), true);

// 工具函数

function openNodeContextMenu(x, y, nodeId) {
  if (!contextMenu) return;
  closeBlankContextMenu();
  state.contextMenu.visible = true;
  state.contextMenu.nodeId = nodeId;

  const padding = 12;
  const diskRadius = 100;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = Math.max(diskRadius + padding, Math.min(vw - diskRadius - padding, x));
  const cy = Math.max(diskRadius + padding, Math.min(vh - diskRadius - padding, y));

  contextMenu.style.left = `${cx}px`;
  contextMenu.style.top = `${cy}px`;
  contextMenu.classList.remove("hidden");
  contextMenu.classList.add("menu-visible");

  const node = state.nodes.find((n) => n.id === nodeId);
  const groupIncrease = contextMenu.querySelector(".entropy-menu-group.increase");
  const groupDecrease = contextMenu.querySelector(".entropy-menu-group.decrease");
  const btnSpawn = contextMenu.querySelector('button[data-action="spawn"]');
  const spawnLabel = btnSpawn ? btnSpawn.querySelector(".submenu-label") : null;
  const btnWebSearch = contextMenu.querySelector('button[data-action="web-search"]');
  const webSearchWrap = btnWebSearch ? btnWebSearch.closest(".increase-item") : null;
  const materialsWrap = contextMenu.querySelector(".link-materials-wrap");
  const materialsContainer = document.getElementById("context-menu-materials");

  if (node && node.node_type === "section") {
    if (groupDecrease) groupDecrease.style.display = "none";
    if (groupIncrease) groupIncrease.style.display = "flex";
    if (spawnLabel) spawnLabel.textContent = "在本板块下生成新问题";
    if (btnSpawn) {
      btnSpawn.disabled = false;
      btnSpawn.classList.remove("opacity-50", "cursor-not-allowed");
    }
    if (webSearchWrap) webSearchWrap.style.display = "none";
  } else {
    if (groupDecrease) groupDecrease.style.display = "flex";
    if (groupIncrease) groupIncrease.style.display = "flex";
    if (webSearchWrap) webSearchWrap.style.display = "";
    const canSpawn = node && (node.status === "green" || node.status === "ai");
    if (btnSpawn) {
      btnSpawn.disabled = !canSpawn;
      btnSpawn.classList.toggle("opacity-50", !canSpawn);
      btnSpawn.classList.toggle("cursor-not-allowed", !canSpawn);
      btnSpawn.title = canSpawn ? "" : "请先回答该节点后再追问";
    }
    if (spawnLabel) spawnLabel.textContent = canSpawn ? "追问" : "请先回答后再追问";
  }

  if (materialsContainer && materialsWrap) {
    const materials = state.nodes.filter((n) => n.node_type === "material");
    materialsContainer.innerHTML = "";
    if (materials.length) {
      materialsWrap.style.display = "";
      materials.forEach((m) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-black/5 flex items-center gap-2 truncate";
        btn.setAttribute("role", "menuitem");
        btn.setAttribute("data-action", "link-material");
        btn.setAttribute("data-material-id", m.id);
        btn.textContent = (m.title || m.question || "材料").slice(0, 20);
        materialsContainer.appendChild(btn);
      });
    } else {
      materialsWrap.style.display = "none";
    }
  }
}

function closeNodeContextMenu() {
  if (!contextMenu) return;
  state.contextMenu.visible = false;
  state.contextMenu.nodeId = null;
  state.contextMenu.materialId = null;
  contextMenu.classList.add("hidden");
  contextMenu.classList.remove("menu-visible");
}

const blankContextMenu = document.getElementById("blank-context-menu");
function openBlankContextMenu(x, y) {
  if (!blankContextMenu) return;
  if (typeof clientToCanvasInner === "function") {
    state.blankMenuCanvasPos = clientToCanvasInner(x, y);
  }
  const padding = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = blankContextMenu.getBoundingClientRect();
  let left = x;
  let top = y;
  if (left + (rect.width || 160) + padding > vw) left = vw - (rect.width || 160) - padding;
  if (top + (rect.height || 60) + padding > vh) top = vh - (rect.height || 60) - padding;
  blankContextMenu.style.left = `${left}px`;
  blankContextMenu.style.top = `${top}px`;
  blankContextMenu.classList.remove("hidden");
}
function closeBlankContextMenu() {
  if (blankContextMenu) blankContextMenu.classList.add("hidden");
}

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `flex ${
    role === "user" ? "justify-end" : "justify-start"
  } animate-fadeInUp`;
  div.innerHTML = `<div class="${
    role === "user" ? "bg-[#4285F4] text-white" : "glass text-gray-800"
  } px-8 py-5 rounded-[32px] max-w-[80%] font-semibold text-xl shadow-xl">${text}</div>`;
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

/** 对话里显示「文件包」气泡（文件名），不把全文贴出来 */
function addFilePackMsg(filename) {
  const safeName = filename || "导入文档";
  const div = document.createElement("div");
  div.className = "flex justify-end animate-fadeInUp";
  div.innerHTML = `
    <div class="bg-[#1a73e8] text-white px-6 py-4 rounded-[24px] max-w-[80%] shadow-xl flex items-center gap-4">
      <div class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
        <i class="fas fa-file-alt text-lg"></i>
      </div>
      <div class="flex flex-col items-start min-w-0">
        <span class="text-xs font-semibold opacity-80 mb-0.5">导入项目文档</span>
        <span class="text-sm font-bold break-all">${safeName}</span>
      </div>
    </div>
  `;
  chatHistory.appendChild(div);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

/**
 * 文档解析完成：
 * - 不把全文塞进输入框
 * - 显示一个文件气泡
 * - 直接用文档内容作为立项阶段的「项目构想」发送给后端
 */
function handleParsedDocument(text, filename) {
  const idea = (text || "").trim();
  if (!idea) {
    showToast("文档内容为空，无法作为项目构想。", "red");
    return;
  }
  if (dropZone) {
    dropZone.classList.add("drop-zone-hidden");
  }
  // 直接用文档内容启动立项对话，但 UI 中只展示文件包
  startAction(idea, filename || "导入文档");
  showToast("已导入文档，将根据文档内容分析项目。", "green");
}

// 立项阶段：Draft 多轮对话

/**
 * 立项阶段入口：
 * - 若传入 overriddenContent，则用它作为发送给后端的真实内容（例如文档全文）
 * - fileDisplayName 存在时，会以「文件包」形式展示气泡；否则展示普通文本气泡
 */
async function startAction(overriddenContent, fileDisplayName) {
  const raw = overriddenContent != null ? String(overriddenContent) : initialInput.value;
  const val = raw.trim();
  if (!val) return;

  heroSection.classList.add("hero-exit");
  if (fileDisplayName) {
    addFilePackMsg(fileDisplayName);
  } else {
    addMsg("user", val);
  }
  state.dialog.push({ role: "user", text: val });
  if (overriddenContent == null) {
    initialInput.value = "";
  }
  initialInput.disabled = true;

  try {
    if (!state.draftId) {
      const { draft_id } = await apiJson("/api/draft", {
        method: "POST",
        body: JSON.stringify({}), // 模式不再用于约束数量
      });
      state.draftId = draft_id;
    }

    addMsg("system", "正在分析你的项目…");
    const res = await apiJson(`/api/draft/${state.draftId}/message`, {
      method: "POST",
      body: JSON.stringify({
        content: val,
        skill_id: state.skillId || undefined,
      }),
    });

    // 替换“正在分析”为 AI 真实回复
    chatHistory.lastElementChild?.remove();
    addMsg("system", res.reply);

    if (!res.need_more) {
      state.title = res.title || "未命名项目";
      addMsg("system", "正在生成工作台…");
      const project = await apiJson("/api/projects/from-draft", {
        method: "POST",
        body: JSON.stringify({
          draft_id: state.draftId,
          skill_id: state.skillId || undefined,
        }),
      });
      state.projectId = project.id;
      state.nodes = project.nodes;
      state.contextLinks = project.context_links || [];
      state.draftId = null;
      updateProgress(project.progress);
      await switchView();
      buildMap();
      state.nodes.filter((n) => n.level > 0).forEach((n) => ensureNodeTitle(n));
      showToast("进入 AI 引导工作台", "blue");
    } else {
      initialInput.disabled = false;
      initialInput.focus();
    }
  } catch (e) {
    console.error(e);
    initialInput.disabled = false;
    const msg = e && e.message ? e.message : "后端失败";
    const short = msg.startsWith("NETWORK:")
      ? "无法连接后端，请先启动：uvicorn backend.main:app --reload"
      : msg.length > 50
        ? msg.slice(0, 47) + "..."
        : msg;
    showToast(short, "red");
  }
}

function updateProgress(progress) {
  progressFill.style.width = `${progress.percent}%`;
  progressText.innerText = `${progress.percent}%`;

  if (progress.percent === 100) {
    mergeBtn.classList.replace("bg-gray-100", "bg-[#4285F4]");
    mergeBtn.classList.replace("text-gray-300", "text-white");
    mergeBtn.classList.replace("cursor-not-allowed", "cursor-pointer");
    mergeBtn.classList.add("shadow-blue-300", "hover:scale-105");
  }
}

async function switchView() {
  chatView.classList.add("opacity-0", "pointer-events-none");
  return new Promise((resolve) => {
    setTimeout(() => {
      chatView.classList.add("hidden");
      mindmapView.classList.remove("opacity-0", "pointer-events-none", "scale-95");
      mindmapView.classList.add("opacity-100");
      topBar.classList.remove("opacity-0", "pointer-events-none", "-translate-y-8");
      projectTitleDisplay.innerText = state.title;
      resolve();
    }, 600);
  });
}

// 连线形态与布局常量见 config.js（LAYOUT, CONNECTOR_MORPHOLOGY）

/**
 * 根据父子节点与整树结构，唯一确定一条连线的状态（形态 + 是否虚线）。
 * 规则：
 * - 根 → 板块：粗直线（主脉）
 * - 板块 → 问题：弯曲粗线
 * - 问题 → 追问 / 问题：弯曲细线
 * - 任意 → Tips 附属：弯曲细线 + 虚线
 */
function getConnectorState(parent, child, root, nodes) {
  if (!parent || !child || !root) {
    return { morphology: CONNECTOR_MORPHOLOGY.THIN_CURVED, dashed: false };
  }
  const isRoot = (n) => n && n.level === 0;
  const isSection = (n) =>
    n && (n.node_type === "section" || (root && n.parent_id === root.id && n.level === 1));
  const isTip = (n) => n && (n.node_type === "tip" || n.status === "ai");
  const isQuestion = (n) => n && n.node_type !== "tip" && !isSection(n);

  const fromRoot = isRoot(parent);
  const toSection = isSection(child);
  const toTip = isTip(child);
  const fromSection = isSection(parent);
  const toQuestion = isQuestion(child);

  if (fromRoot && toSection) {
    return { morphology: CONNECTOR_MORPHOLOGY.THICK_STRAIGHT, dashed: false };
  }
  if (fromSection && toQuestion) {
    return { morphology: CONNECTOR_MORPHOLOGY.THICK_CURVED, dashed: false };
  }
  if (toTip) {
    return { morphology: CONNECTOR_MORPHOLOGY.THIN_CURVED, dashed: true };
  }
  // 追问：问题 → 问题
  return { morphology: CONNECTOR_MORPHOLOGY.THIN_CURVED, dashed: false };
}

/** 根据形态返回描边宽度（主题在渲染时再乘系数即可） */
function getConnectorStrokeWidth(morphology, isHackathon) {
  const thick = morphology === CONNECTOR_MORPHOLOGY.THICK_STRAIGHT || morphology === CONNECTOR_MORPHOLOGY.THICK_CURVED;
  return thick ? (isHackathon ? 3.5 : 3) : (isHackathon ? 1.5 : 1.2);
}

// 计算每个节点的子树权重（1 + 所有子节点权重之和），用于布局时按权重分配角度避免重叠
function computeSubtreeWeights(nodes, getChildren) {
  const weightMap = new Map();
  function weight(n) {
    if (weightMap.has(n.id)) return weightMap.get(n.id);
    const children = getChildren(n.id);
    const w = 1 + children.reduce((sum, c) => sum + weight(c), 0);
    weightMap.set(n.id, w);
    return w;
  }
  nodes.forEach((n) => weight(n));
  return weightMap;
}

function buildMap() {
  canvasInner.innerHTML = "";
  if (!state.nodes.length) return;

  const nodes = state.nodes;
  const root = nodes.find((n) => n.level === 0 && n.node_type !== "material");
  if (!root) return;

  const pos = new Map();
  const getChildren = (pid) =>
    nodes.filter((n) => n.parent_id === pid).sort((a, b) => a.order_index - b.order_index);
  const weightMap = computeSubtreeWeights(nodes, getChildren);

  const toRad = (deg) => (deg * Math.PI) / 180;
  const cx = LAYOUT.centerX;
  const cy = LAYOUT.centerY;
  const minFan = LAYOUT.minFanAnglePerChild ?? 28;
  const maxFan = LAYOUT.maxFanAngleTotal ?? 140;

  // 根节点放在中心
  pos.set(root.id, { x: cx - LAYOUT.nodeWidthRoot / 2, y: cy - LAYOUT.nodeHeight / 2, level: 0, angle: null, width: LAYOUT.nodeWidthRoot });

  const queue = [{ node: root, depth: 0 }];
  while (queue.length) {
    const { node, depth } = queue.shift();
    const children = getChildren(node.id);
    const myPos = pos.get(node.id);
    if (!myPos) continue;

    const myCenterX = myPos.x + (myPos.width || LAYOUT.nodeWidth) / 2;
    const myCenterY = myPos.y + LAYOUT.nodeHeight / 2;

    if (depth === 0) {
      const dirs = LAYOUT.directions;
      const n = children.length;
      children.forEach((child, idx) => {
        const angle = n <= 6 ? dirs[idx % dirs.length] : 270 - (360 / n) * idx;
        const rad = toRad(angle);
        const r = LAYOUT.radiusLevel1;
        const childCenterX = cx + r * Math.cos(rad);
        const childCenterY = cy + r * Math.sin(rad);
        const w = (child.node_type === "section") ? (LAYOUT.nodeWidthSection || LAYOUT.nodeWidth) : LAYOUT.nodeWidth;
        pos.set(child.id, {
          x: childCenterX - w / 2,
          y: childCenterY - LAYOUT.nodeHeight / 2,
          level: 1,
          angle,
          width: w,
        });
        queue.push({ node: child, depth: 1 });
      });
    } else {
      const parentAngle = myPos.angle != null ? myPos.angle : 0;
      const r = LAYOUT.radiusStep;
      const n = children.length;
      const totalWeight = children.reduce((s, c) => s + (weightMap.get(c.id) || 1), 0);
      const fanTotal = Math.min(maxFan, Math.max(n * minFan, 40));
      let accAngle = parentAngle - fanTotal / 2;
      children.forEach((child) => {
        const w = weightMap.get(child.id) || 1;
        const childAngle = accAngle + (fanTotal * w) / totalWeight / 2;
        accAngle += (fanTotal * w) / totalWeight;
        const rad = toRad(childAngle);
        const childCenterX = myCenterX + r * Math.cos(rad);
        const childCenterY = myCenterY + r * Math.sin(rad);
        const nodeW = LAYOUT.nodeWidth;
        pos.set(child.id, {
          x: childCenterX - nodeW / 2,
          y: childCenterY - LAYOUT.nodeHeight / 2,
          level: node.level + 1,
          angle: childAngle,
          width: nodeW,
        });
        queue.push({ node: child, depth: depth + 1 });
      });
    }
  }

  // 材料节点（导入的网站）：放在画布左侧一列，可拖线关联上下文
  const materials = nodes.filter((n) => n.node_type === "material");
  materials.forEach((m, i) => {
    pos.set(m.id, { x: 120, y: 380 + i * 100, level: 0, angle: null, width: 180 });
  });

  // 与已保存的拖动位置合并（保留用户拖过的位置）
  nodes.forEach((n) => {
    const p = pos.get(n.id);
    if (!p) return;
    const w = p.width || LAYOUT.nodeWidth;
    const saved = state.nodePositions[n.id];
    if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
      p.x = saved.left;
      p.y = saved.top;
      if (saved.width) p.width = saved.width;
    }
    state.nodePositions[n.id] = { left: p.x, top: p.y, width: w };
  });

  // 连线层：SVG 曲线，置于最底层（z-index 0）
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "connector-svg";
  svg.setAttribute("width", "4000");
  svg.setAttribute("height", "4000");
  svg.setAttribute("viewBox", "0 0 4000 4000");
  svg.style.cssText = "position:absolute;left:0;top:0;width:4000px;height:4000px;pointer-events:none;z-index:0";
  canvasInner.appendChild(svg);
  renderConnectors(svg, nodes, pos);

  // 节点层：根=芯片+文字，一级板块=文件夹+文字，其余=问题卡片
  nodes.forEach((n) => {
    const p = pos.get(n.id);
    if (!p) return;
    const width = p.width || LAYOUT.nodeWidth;
    const div = document.createElement("div");
    div.id = `node-${n.id}`;
    const isTip = n.node_type === "tip" || n.status === "ai";
    const isMaterial = n.node_type === "material";
    const isRoot = n.level === 0;
    const root = nodes.find((r) => r.level === 0);
    const isSection = n.node_type === "section" || (n.level === 1 && root && n.parent_id === root.id);
    const title = (n.title || "").trim() || getNodeShortTitle(n);
    const levelClass = `node-level-${Math.min(3, Math.max(0, n.level || 0))}`;
    div.className = `node absolute rounded-[28px] font-black text-sm shadow-xl flex items-center justify-center cursor-pointer ${levelClass} ${
      isRoot ? "node-root p-5 gap-2 flex-col" : isSection ? "node-section p-4 gap-2 flex-col" : "p-6 text-center"
    } ${
      isMaterial ? "node-material" : isTip ? "node-tip" : (n.status === "red" ? "node-red" : "node-green")
    } ${!isTip && !isMaterial && n.status === "red" ? "pulse-node" : ""}`;
    div.style.left = `${p.x}px`;
    div.style.top = `${p.y}px`;
    div.style.width = `${width}px`;
    div.style.minHeight = `${LAYOUT.nodeHeight}px`;
    div.style.zIndex = "1";
    if (isRoot) {
      div.innerHTML = `
        <div class="flex flex-col items-center gap-1.5 text-gray-800">
          <i class="fas fa-microchip text-2xl text-[#4285F4]"></i>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500">项目</span>
          <span class="font-bold text-center leading-tight break-words">${escapeHtml(title)}</span>
        </div>`;
    } else if (isSection) {
      div.innerHTML = `
        <div class="flex flex-col items-center gap-1.5 text-gray-800">
          <i class="fas fa-folder text-2xl text-[#34A853]"></i>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500">板块</span>
          <span class="font-semibold text-center leading-tight">${escapeHtml(title)}</span>
        </div>`;
    } else if (isMaterial) {
      div.innerHTML = `
        <div class="flex flex-col items-center gap-1.5 text-gray-800 w-full">
          <i class="fas fa-link text-xl text-[#5F6368]"></i>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500">材料</span>
          <span class="font-semibold text-center leading-tight break-words line-clamp-2">${escapeHtml(title)}</span>
        </div>`;
    } else {
      div.innerHTML = escapeHtml(getNodeShortTitle(n));
    }
    div.onmousedown = (e) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      state.draggingNode = n.id;
      state.didDragThisSession = false;
      state.dragStart = {
        clientX: e.clientX,
        clientY: e.clientY,
        left: p.x,
        top: p.y,
      };
      state._contextLinkTimer = setTimeout(() => {
        state._contextLinkTimer = null;
        const pos = state.nodePositions[n.id];
        const w = (pos && pos.width) || LAYOUT.nodeWidth;
        const startX = pos ? pos.left + w / 2 : 0;
        const startY = pos ? pos.top + LAYOUT.nodeHeight / 2 : 0;
        state.drawingContextLink = { fromNodeId: state.draggingNode, endX: startX, endY: startY };
        state.draggingNode = null;
        state.dragStart = null;
        updateConnectors();
      }, 400);
    };
    div.onclick = (e) => {
      // 若本次交互是拖拽移动，就不触发选中
      if (state.didDragThisSession) {
        state.didDragThisSession = false;
        return;
      }
      selectNode(n.id);
    };
    div.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectNode(n.id, { panToCenter: false });
      openNodeContextMenu(e.clientX, e.clientY, n.id);
    };
    canvasInner.appendChild(div);
  });

  syncCanvas();
}

// 根据当前节点位置绘制连线，形态由连线状态系统决定（粗/细 × 直/曲，可选虚线）
function renderConnectors(svgEl, nodes, posMap) {
  if (!svgEl) svgEl = document.getElementById("connector-svg");
  if (!svgEl) return;
  svgEl.innerHTML = "";
  const root = nodes.find((r) => r.level === 0 && r.node_type !== "material");
  const curveOffset = 80; // 曲线弯曲程度

  nodes.forEach((n) => {
    if (!n.parent_id) return;
    const parent = nodes.find((nn) => nn.id === n.parent_id);
    if (!parent) return;
    const pPos = posMap.get(n.parent_id);
    const cPos = posMap.get(n.id);
    if (!pPos || !cPos) return;
    const pW = pPos.width || LAYOUT.nodeWidth;
    const cW = cPos.width || LAYOUT.nodeWidth;
    const sx = pPos.x + pW / 2;
    const sy = pPos.y + LAYOUT.nodeHeight / 2;
    const ex = cPos.x + cW / 2;
    const ey = cPos.y + LAYOUT.nodeHeight / 2;

    const state = getConnectorState(parent, n, root, nodes);
    const straight =
      state.morphology === CONNECTOR_MORPHOLOGY.THICK_STRAIGHT ||
      state.morphology === CONNECTOR_MORPHOLOGY.THIN_STRAIGHT;
    const d = straight
      ? `M ${sx} ${sy} L ${ex} ${ey}`
      : (() => {
          const dx = ex - sx;
          const dy = ey - sy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const perpX = (-dy / len) * curveOffset;
          const perpY = (dx / len) * curveOffset;
          const midX = (sx + ex) / 2;
          const midY = (sy + ey) / 2;
          return `M ${sx} ${sy} Q ${midX + perpX} ${midY + perpY} ${ex} ${ey}`;
        })();

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");

    const isTipChild = n.node_type === "tip" || n.status === "ai";
    const isHackathon = document.body.classList.contains("theme-hackathon");
    const stroke = isHackathon
      ? (isTipChild ? "#00d4ff" : n.status === "green" ? "#00ff88" : "#00fff9")
      : (isTipChild ? "#1E88E5" : n.status === "green" ? "#34A853" : "#EA4335");
    path.setAttribute("stroke", stroke);
    path.setAttribute("stroke-width", String(getConnectorStrokeWidth(state.morphology, isHackathon)));
    if (state.dashed) path.setAttribute("stroke-dasharray", "8 5");
    if (isHackathon) path.classList.add("connector-hackathon");
    svgEl.appendChild(path);
  });

  // 共享上下文连线：粗、半透明、虚线
  (state.contextLinks || []).forEach((link) => {
    const aPos = posMap.get(link.node_a_id);
    const bPos = posMap.get(link.node_b_id);
    if (!aPos || !bPos) return;
    const aw = aPos.width || LAYOUT.nodeWidth;
    const bw = bPos.width || LAYOUT.nodeWidth;
    const sx = aPos.x + aw / 2;
    const sy = aPos.y + LAYOUT.nodeHeight / 2;
    const ex = bPos.x + bw / 2;
    const ey = bPos.y + LAYOUT.nodeHeight / 2;
    const d = `M ${sx} ${sy} L ${ex} ${ey}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    const isHackathon = document.body.classList.contains("theme-hackathon");
    path.setAttribute("stroke", isHackathon ? "rgba(0,255,249,0.5)" : "rgba(66,133,244,0.5)");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-dasharray", "12 8");
    path.classList.add("connector-context-link");
    svgEl.appendChild(path);
  });

  // 长按拖线预览：从节点到当前鼠标
  if (state.drawingContextLink && state.drawingContextLink.endX != null) {
    const fromPos = posMap.get(state.drawingContextLink.fromNodeId);
    if (fromPos) {
      const w = fromPos.width || LAYOUT.nodeWidth;
      const sx = fromPos.x + w / 2;
      const sy = fromPos.y + LAYOUT.nodeHeight / 2;
      const ex = state.drawingContextLink.endX;
      const ey = state.drawingContextLink.endY;
      const preview = document.createElementNS("http://www.w3.org/2000/svg", "path");
      preview.setAttribute("d", `M ${sx} ${sy} L ${ex} ${ey}`);
      preview.setAttribute("fill", "none");
      preview.setAttribute("stroke", "rgba(66,133,244,0.7)");
      preview.setAttribute("stroke-width", "3");
      preview.setAttribute("stroke-dasharray", "8 6");
      preview.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(preview);
    }
  }
}

// 将屏幕坐标转为 canvas-inner 内坐标（与 nodePositions 同系）
// 与 syncCanvas 的 translate(-50%+x,-50%+y) scale(s) 对应：inner 中心 (2000,2000) 在容器 (canvas.x, canvas.y)
function clientToCanvasInner(clientX, clientY) {
  if (!canvasContainer) return { x: 0, y: 0 };
  const rect = canvasContainer.getBoundingClientRect();
  const s = state.canvas.scale;
  const x = 2000 + (clientX - rect.left - state.canvas.x) / s;
  const y = 2000 + (clientY - rect.top - state.canvas.y) / s;
  return { x, y };
}

// 根据 state.nodePositions 重算连线（拖动时调用）
function updateConnectors() {
  const posMap = new Map();
  state.nodes.forEach((n) => {
    const pos = state.nodePositions[n.id];
    if (pos) {
      const w = pos.width || (n.level === 0 ? LAYOUT.nodeWidthRoot : LAYOUT.nodeWidth);
      posMap.set(n.id, { x: pos.left, y: pos.top, width: w });
    }
  });
  renderConnectors(null, state.nodes, posMap);
}

// 黑客松：在「文件夹」板块下生成一个由该板块 Skills 指导的新问题（仅追问，无需先作答）
async function triggerSectionQuestionFromNode(nodeId) {
  if (!state.projectId) return;
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node || node.node_type !== "section") return;
  try {
    const newNode = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/spawn-section-question`,
      { method: "POST" },
    );
    try {
      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes;
      state.contextLinks = project.context_links || [];
    } catch (_) {
      state.nodes = state.nodes.concat(newNode);
    }
    buildMap();
    const added = state.nodes.find((n) => n.id === newNode.id);
    if (added) ensureNodeTitle(added);
    showToast("已在本板块下生成新问题", "blue");
  } catch (e) {
    console.error(e);
    showToast(e && e.message ? e.message : "生成失败", "red");
  }
}

// 超级 Agent：按 BFS 顺序收集「未回答的红点问题节点」（排除 section/tip）
function getRedQuestionNodesInBFSOrder(nodes, maxDepth = 4) {
  const root = nodes.find((n) => n.level === 0);
  if (!root) return [];
  const getChildren = (pid) =>
    nodes.filter((n) => n.parent_id === pid).sort((a, b) => a.order_index - b.order_index);
  const isQuestion = (n) =>
    n && n.node_type !== "section" && n.node_type !== "tip" && n.status === "red";
  const out = [];
  const queue = [{ node: root, depth: 0 }];
  while (queue.length) {
    const { node, depth } = queue.shift();
    if (depth > 0 && isQuestion(node) && node.level < maxDepth) out.push(node);
    getChildren(node.id).forEach((c) => queue.push({ node: c, depth: depth + 1 }));
  }
  return out;
}

// 已答问题节点（可从中 spawn 新追问），BFS 顺序，深度限制与红点一致
function getSpawnableQuestionNodesInBFSOrder(nodes, maxDepth = 4) {
  const root = nodes.find((n) => n.level === 0);
  if (!root) return [];
  const getChildren = (pid) =>
    nodes.filter((n) => n.parent_id === pid).sort((a, b) => a.order_index - b.order_index);
  const isSpawnable = (n) =>
    n && n.node_type !== "section" && n.node_type !== "tip" && (n.status === "green" || n.status === "ai") && n.level < maxDepth;
  const out = [];
  const queue = [{ node: root, depth: 0 }];
  while (queue.length) {
    const { node, depth } = queue.shift();
    if (depth > 0 && isSpawnable(node)) out.push(node);
    getChildren(node.id).forEach((c) => queue.push({ node: c, depth: depth + 1 }));
  }
  return out;
}

// Fisher-Yates 洗牌，打乱顺序
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 智能+随机选择本批要处理的红点：打乱顺序，并带一点「深度 + 兄弟数少优先」权重，避免总是同一侧/同一规律
function pickRedBatchForExpand(redList, batchSize) {
  if (redList.length <= batchSize) return shuffleArray(redList);
  const shuffled = shuffleArray(redList);
  const getSiblingCount = (n) => redList.filter((x) => x.parent_id === n.parent_id).length;
  const score = (n) => {
    const depth = (n.level || 0) * 0.4;
    const sib = getSiblingCount(n);
    const spread = 2 / (1 + sib);
    const rand = Math.random() * 1.5;
    return depth + spread + rand;
  };
  const scored = shuffled.map((n) => ({ n, s: score(n) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, batchSize).map((x) => x.n);
}

// 四周爆发弹窗：slot 1=左上(当前问题) 2=右上(选取/选定) 3=右下(选定答案) 4=左下(状态/已应用)
function showBurst(slot, title, content) {
  const id = SUPER_AGENT_BURST_IDS[slot - 1];
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  const titleEl = el.querySelector(".burst-title");
  const contentEl = el.querySelector(".burst-content");
  if (titleEl) titleEl.textContent = title;
  if (contentEl) {
    const raw = (content || "").slice(0, 720);
    contentEl.textContent = raw + ((content || "").length > 720 ? "…" : "");
  }
  el.classList.remove("opacity-0", "pointer-events-none");
  el.classList.add("burst-visible");
}

function updateBurst(slot, title, content) {
  showBurst(slot, title, content);
}

function hideAllBursts() {
  SUPER_AGENT_BURST_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("burst-visible");
      el.classList.add("opacity-0", "pointer-events-none");
    }
  });
}

// 中央半透明托管状态：进度、细节行、预计完成时间
function showCenterOverlay(progressPercent, etaStr, detailStr) {
  if (!superAgentCenterOverlay) return;
  if (superAgentProgressText) superAgentProgressText.textContent = `目前进度 ${Math.round(progressPercent)}%`;
  if (superAgentDetail) superAgentDetail.textContent = detailStr || "";
  if (superAgentEtaText) superAgentEtaText.textContent = etaStr || "预计约 — 后完成收敛";
  superAgentCenterOverlay.classList.remove("opacity-0");
  superAgentCenterOverlay.classList.add("opacity-100");
}

function updateCenterOverlay(progressPercent, etaStr, detailStr) {
  if (!superAgentCenterOverlay || superAgentCenterOverlay.classList.contains("opacity-0")) return;
  if (superAgentProgressText) superAgentProgressText.textContent = `目前进度 ${Math.round(progressPercent)}%`;
  if (superAgentDetail && detailStr !== undefined) superAgentDetail.textContent = detailStr || "";
  if (superAgentEtaText && etaStr != null) superAgentEtaText.textContent = etaStr;
}

function hideCenterOverlay() {
  if (!superAgentCenterOverlay) return;
  superAgentCenterOverlay.classList.add("opacity-0");
  superAgentCenterOverlay.classList.remove("opacity-100");
}

function showSuperAgentExtra() {
  const el = document.getElementById("super-agent-extra");
  if (el) {
    el.classList.remove("opacity-0");
    el.setAttribute("aria-hidden", "false");
  }
}

function hideSuperAgentExtra() {
  const el = document.getElementById("super-agent-extra");
  if (el) {
    el.classList.add("opacity-0");
    el.setAttribute("aria-hidden", "true");
  }
}

const SUPER_AGENT_MAX_ROUNDS = 10;  // 最多 10 轮
const SUPER_AGENT_BATCH_SIZE = 2;   // 每轮更新 2 个节点（减轻单点 429）
const SUPER_AGENT_MAX_DEPTH = 4;
const SUPER_AGENT_READ_MS = 400;    // 爆发弹窗短暂停留

// 超级 Agent：拉取节点网页搜索摘要（若有），用于注入 suggest/tips 上下文
async function fetchWebSnippetsForNode(nodeId) {
  const results = [];
  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/web-search`,
      { method: "POST" },
    );
    const list = res.results || [];
    for (let i = 0; i < Math.min(2, list.length); i++) {
      const r = list[i];
      const snippet = (r.snippet || "").trim() || (r.title || "").trim();
      if (snippet) results.push(snippet.slice(0, 600));
    }
  } catch (_) {}
  return results;
}

// 单节点：可选网页搜索 → suggest（+ web_snippets）→ 空则 tips/candidates → 都空则跳过；有则提交回答后 spawn(allow_fallback=false)，无追问则跳过
async function processOneRedNode(node) {
  const base = `/api/projects/${state.projectId}/nodes/${node.id}`;
  const webSnippets = await fetchWebSnippetsForNode(node.id);
  const suggestBody = webSnippets.length ? { web_snippets: webSnippets } : undefined;
  const tipsBody = webSnippets.length ? { web_snippets: webSnippets } : undefined;

  let answerContent = "";
  try {
    const suggestRes = await apiJson(`${base}/answer/suggest`, {
      method: "POST",
      body: suggestBody ? JSON.stringify(suggestBody) : undefined,
    });
    answerContent = (suggestRes.content && String(suggestRes.content).trim()) || "";
  } catch (_) {}
  if (!answerContent) {
    try {
      const candRes = await apiJson(`${base}/tips/candidates`, {
        method: "POST",
        body: tipsBody ? JSON.stringify(tipsBody) : undefined,
      });
      const cands = candRes.candidates || [];
      answerContent = (cands[0] && String(cands[0]).trim()) || "";
    } catch (_) {}
  }
  if (!answerContent) {
    throw new Error("no_ai_answer");
  }
  await apiJson(`${base}/answer`, {
    method: "POST",
    body: JSON.stringify({ content: answerContent, by_ai: true }),
  });
  try {
    const newNode = await apiJson(`${base}/spawn?allow_fallback=false`, { method: "POST" });
    return { node, newNode, ok: true, webSnippetsCount: webSnippets.length };
  } catch (e) {
    if (e && (e.message || "").toString().includes("no_followup")) {
      throw new Error("no_followup");
    }
    throw e;
  }
}

// 仅从已答节点生成追问（100% 时用，不提交回答）；超级 Agent 内不兜底，无追问则跳过
async function spawnFromAnsweredNode(node) {
  const base = `/api/projects/${state.projectId}/nodes/${node.id}`;
  try {
    await apiJson(`${base}/spawn?allow_fallback=false`, { method: "POST" });
    return { node, ok: true };
  } catch (e) {
    if (e && (e.message || "").toString().includes("no_followup")) {
      throw new Error("no_followup");
    }
    throw e;
  }
}

// 收敛阶段：可选网页搜索 → suggest/tips（带 web_snippets），无则跳过
async function processOneRedNodeConverge(node) {
  const base = `/api/projects/${state.projectId}/nodes/${node.id}`;
  const webSnippets = await fetchWebSnippetsForNode(node.id);
  const suggestBody = webSnippets.length ? { web_snippets: webSnippets } : undefined;
  const tipsBody = webSnippets.length ? { web_snippets: webSnippets } : undefined;

  let answerContent = "";
  try {
    const suggestRes = await apiJson(`${base}/answer/suggest`, {
      method: "POST",
      body: suggestBody ? JSON.stringify(suggestBody) : undefined,
    });
    answerContent = (suggestRes.content && String(suggestRes.content).trim()) || "";
  } catch (_) {}
  if (!answerContent) {
    try {
      const candRes = await apiJson(`${base}/tips/candidates`, {
        method: "POST",
        body: tipsBody ? JSON.stringify(tipsBody) : undefined,
      });
      const cands = candRes.candidates || [];
      answerContent = (cands[0] && String(cands[0]).trim()) || "";
    } catch (_) {}
  }
  if (!answerContent) {
    throw new Error("no_ai_answer");
  }
  await apiJson(`${base}/answer`, {
    method: "POST",
    body: JSON.stringify({ content: answerContent, by_ai: true }),
  });
  return { node, ok: true };
}

async function runSuperAgent() {
  if (!state.projectId || state.superAgentRunning) return;
  state.superAgentRunning = true;
  if (superAgentBtn) {
    superAgentBtn.disabled = true;
    if (superAgentBtnText) superAgentBtnText.textContent = "爆发中…";
  }
  let totalExpanded = 0;
  let roundStartMs = 0;
  let consecutive100Rounds = 0;   // 用尽 15 次机会后，连续几轮 100% 无新追问则自动退
  const ROOTWARD_QUOTA = 15;      // 从根节点找问题的提问机会，用尽后才开始计连续 3 轮退出
  let rootwardQuotaRemaining = ROOTWARD_QUOTA;
  state.superAgentAbortRequested = false;
  showSuperAgentExtra();
  try {
    showCenterOverlay(0, "预计约 1–2 分钟后完成收敛", "阶段：展开（回答 + 追问），随后自动收敛至 100%");
    for (let round = 0; round < SUPER_AGENT_MAX_ROUNDS; round++) {
      if (state.superAgentAbortRequested) {
        showToast("已退出托管", "blue");
        break;
      }
      roundStartMs = roundStartMs || Date.now();
      const redList = getRedQuestionNodesInBFSOrder(state.nodes, SUPER_AGENT_MAX_DEPTH);
      // 无红点时：先消耗「从根节点找问题」的 15 次机会，用尽后再计连续 3 轮退出
      if (redList.length === 0) {
        if (rootwardQuotaRemaining <= 0) {
          consecutive100Rounds += 1;
          if (consecutive100Rounds >= 3) {
            updateCenterOverlay(100, "已相当完善，自动进入收敛", "15 次从根找问题已用尽且连续 3 轮无新追问，结束展开");
            showToast("已连续 3 轮处于 100% 无新追问，视为相当完善，自动进入收敛", "green");
            hideAllBursts();
            await new Promise((r) => setTimeout(r, 600));
            break;
          }
        }
        // 从根节点往外（BFS 序）选已答节点，本批最多用掉剩余配额
        const spawnableList = getSpawnableQuestionNodesInBFSOrder(state.nodes, SUPER_AGENT_MAX_DEPTH);
        const batchSize = Math.min(SUPER_AGENT_BATCH_SIZE, Math.max(0, rootwardQuotaRemaining));
        const spawnBatch = spawnableList.length > 0 && batchSize > 0
          ? spawnableList.slice(0, batchSize)
          : [];
        if (spawnBatch.length > 0) {
          rootwardQuotaRemaining -= spawnBatch.length;
          updateCenterOverlay(
            ((round + 0.5) / SUPER_AGENT_MAX_ROUNDS) * 100,
            "从根节点找问题",
            `第 ${round + 1}/${SUPER_AGENT_MAX_ROUNDS} 轮 · 本批 ${spawnBatch.length} 次尝试（剩余从根提问机会 ${rootwardQuotaRemaining}/${ROOTWARD_QUOTA}）`,
          );
          showBurst(1, "追加追问", "当前已 100%，从根节点往外尝试生成追问以多创造分支\n仅当模型返回专业追问时新增");
          const spawnResults = await Promise.allSettled(spawnBatch.map((n) => spawnFromAnsweredNode(n)));
          const spawnOk = spawnResults.filter((r) => r.status === "fulfilled" && r.value && r.value.ok).length;
          const spawnNoFollowup = spawnResults.filter((r) => r.status === "rejected" && r.reason && (r.reason.message || "").includes("no_followup")).length;
          totalExpanded += spawnOk;
          if (spawnOk > 0) consecutive100Rounds = 0;
          if (spawnNoFollowup > 0) {
            showToast(`本批 ${spawnNoFollowup} 次从根追问未产生新问题已跳过`, "blue");
          }
          const project = await apiJson(`/api/projects/${state.projectId}`);
          state.nodes = project.nodes || state.nodes;
          state.contextLinks = project.context_links || state.contextLinks;
          if (project.progress) updateProgress(project.progress);
          buildMap();
          updateCenterOverlay(
            ((round + 1) / SUPER_AGENT_MAX_ROUNDS) * 100,
            spawnOk > 0 ? "已新增追问，继续展开" : "本轮无新追问，继续",
            `第 ${round + 1}/${SUPER_AGENT_MAX_ROUNDS} 轮 · 从已答节点新增 ${spawnOk}/${spawnBatch.length}（剩余机会 ${rootwardQuotaRemaining}）`,
          );
        } else {
          if (rootwardQuotaRemaining <= 0) {
            updateCenterOverlay(
              ((round + 1) / SUPER_AGENT_MAX_ROUNDS) * 100,
              "即将进入收敛",
              `第 ${round + 1}/${SUPER_AGENT_MAX_ROUNDS} 轮 · 15 次机会已用尽（${consecutive100Rounds}/3 轮无新追问将退出）`,
            );
          } else {
            updateCenterOverlay(
              ((round + 1) / SUPER_AGENT_MAX_ROUNDS) * 100,
              "即将进入收敛",
              `第 ${round + 1}/${SUPER_AGENT_MAX_ROUNDS} 轮 · 暂无可追问节点（剩余从根机会 ${rootwardQuotaRemaining}）`,
            );
          }
        }
        hideAllBursts();
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      consecutive100Rounds = 0;
      const progressPercent = ((round + 0.5) / SUPER_AGENT_MAX_ROUNDS) * 100;
      const remainingRounds = SUPER_AGENT_MAX_ROUNDS - round - 1;
      let etaStr = "预计约 — 后完成收敛";
      if (round > 0 && roundStartMs) {
        const elapsed = (Date.now() - roundStartMs) / 1000;
        const avgPerRound = elapsed / round;
        const secLeft = Math.max(0, Math.round(remainingRounds * avgPerRound));
        etaStr = secLeft > 0 ? `预计约 ${secLeft} 秒后完成收敛` : "即将完成收敛";
      }
      const batch = pickRedBatchForExpand(redList, SUPER_AGENT_BATCH_SIZE);
      updateCenterOverlay(progressPercent, etaStr, `第 ${round + 1} / ${SUPER_AGENT_MAX_ROUNDS} 轮 · 本批 ${batch.length} 个节点（智能打乱顺序）`);
      hideAllBursts();

      const batchDetailLines = batch.map((n, i) => {
        const q = (n.question || "").trim();
        return `${i + 1}. ${q.slice(0, 52)}${q.length > 52 ? "…" : ""}`;
      });
      const batchDetail = `本批共 ${batch.length} 个节点，同时执行：\n\n${batchDetailLines.join("\n")}`;
      const contextLinksCount = (state.contextLinks || []).length;
      const stepDetail = [
        "每节点流程（已启用）：",
        "· 网页搜索：按问题搜相关网页，摘要注入回答（需配置 SEARCH_API_KEY）",
        "· 上下文连线：与当前节点连线的材料/节点内容由后端自动注入",
        "· 拉取参考答案 → 提交 AI 回答 → 生成追问子节点",
      ].join("\n");
      const roundDetail = `第 ${round + 1} / ${SUPER_AGENT_MAX_ROUNDS} 轮展开\n本批处理 ${batch.length} 个红点\n累计已新增 ${totalExpanded} 个节点${contextLinksCount > 0 ? `\n当前项目共 ${contextLinksCount} 条上下文连线将参与回答` : ""}`;

      showBurst(1, "并发展开", batchDetail);
      showBurst(2, "本批问题", batchDetailLines.join("\n"));
      showBurst(3, "处理流程", stepDetail);
      showBurst(4, "本轮进度", roundDetail);
      await new Promise((r) => setTimeout(r, SUPER_AGENT_READ_MS));

      const results = await Promise.allSettled(
        batch.map((node) => processOneRedNode(node)),
      );
      const ok = results.filter((r) => r.status === "fulfilled" && r.value && r.value.ok).length;
      totalExpanded += ok;
      const totalWebSnippets = results
        .filter((r) => r.status === "fulfilled" && r.value && r.value.webSnippetsCount != null)
        .reduce((sum, r) => sum + (r.value.webSnippetsCount || 0), 0);
      if (round === 0 && totalWebSnippets === 0 && batch.length > 0) {
        showToast("提示：在 .env 中配置 SEARCH_API_KEY（如 Serper）可让超级 Agent 使用网页搜索增强回答", "blue");
      } else if (totalWebSnippets > 0) {
        showToast(`本批已使用网页搜索：共注入 ${totalWebSnippets} 条摘要参与回答`, "green");
      }
      const noAi = results.filter((r) => r.status === "rejected" && r.reason && (r.reason.message || "").includes("no_ai_answer")).length;
      const noFollowup = results.filter((r) => r.status === "rejected" && r.reason && (r.reason.message || "").includes("no_followup")).length;
      if (noAi > 0) {
        showToast(`本批 ${noAi} 个节点未获取到 AI 回答（建议回答与 Tips 均为空）已跳过，请检查是否已配置 API 或网络`, "blue");
      }
      if (noFollowup > 0) {
        showToast(`本批 ${noFollowup} 个节点未产生新追问已跳过（仅保留有质量回答）`, "blue");
      }
      if (results.some((r) => r.status === "rejected" && (!r.reason || !(r.reason.message || "").includes("no_ai_answer") && !(r.reason.message || "").includes("no_followup")))) {
        console.warn("super agent batch partial fail:", results.map((r) => (r.status === "rejected" ? r.reason : null)));
      }

      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes || state.nodes;
      state.contextLinks = project.context_links || state.contextLinks;
      if (project.progress) updateProgress(project.progress);
      buildMap();

      const progressDone = ((round + 1) / SUPER_AGENT_MAX_ROUNDS) * 100;
      const remainingRoundsAfter = SUPER_AGENT_MAX_ROUNDS - round - 2;
      let etaStrAfter = "即将完成收敛";
      if (roundStartMs && round >= 0) {
        const elapsed = (Date.now() - roundStartMs) / 1000;
        const avgPerRound = elapsed / (round + 1);
        const secLeft = Math.max(0, Math.round(remainingRoundsAfter * avgPerRound));
        etaStrAfter = secLeft > 0 ? `预计约 ${secLeft} 秒后完成收敛` : "即将完成收敛";
      }
      const detailLine = totalWebSnippets > 0
        ? `本批完成：${ok}/${batch.length} 个 · 累计新节点 ${totalExpanded} · 已注入 ${totalWebSnippets} 条网页摘要`
        : `本批完成：${ok}/${batch.length} 个 · 累计新节点 ${totalExpanded}`;
      updateCenterOverlay(progressDone, etaStrAfter, detailLine);

      const failCount = batch.length - ok;
      updateBurst(1, "本轮完成", `成功 ${ok} 个，${failCount ? `失败 ${failCount} 个` : "全部成功"}\n\n新生成的追问子节点已挂载到对应父节点下，可在导图中查看。`);
      updateBurst(3, "已应用", `已写入 AI 回答并生成追问子节点\n本批 ${ok} 个节点已完成上述流程`);
      updateBurst(4, "本轮进度", `第 ${round + 1} / ${SUPER_AGENT_MAX_ROUNDS} 轮完成\n累计已展开 ${totalExpanded} 个新节点`);
      await new Promise((r) => setTimeout(r, 350));
    }
    hideAllBursts();

    // 收敛阶段：剩余红点全部答完，完成度冲到 100%
    let project = await apiJson(`/api/projects/${state.projectId}`);
    state.nodes = project.nodes || state.nodes;
    state.contextLinks = project.context_links || state.contextLinks;
    const phaseTitleEl = document.getElementById("super-agent-phase-title");
    if (phaseTitleEl) phaseTitleEl.textContent = "AI 托管收敛中";
    let convergeRounds = 0;
    const MAX_CONVERGE_ROUNDS = 20;
    while (convergeRounds < MAX_CONVERGE_ROUNDS) {
      if (state.superAgentAbortRequested) {
        showToast("已退出托管", "blue");
        break;
      }
      const redAll = getRedQuestionNodesInBFSOrder(state.nodes, 99);
      if (redAll.length === 0) {
        updateCenterOverlay(100, "已完成收敛，完成度 100%", "所有问题节点已作答，可点击「融合项目成果」生成报告");
        await new Promise((r) => setTimeout(r, 800));
        break;
      }
      const pct = project.progress ? project.progress.percent : 0;
      const batch = shuffleArray(redAll).slice(0, SUPER_AGENT_BATCH_SIZE);
      const roundsLeft = Math.ceil(redAll.length / SUPER_AGENT_BATCH_SIZE);
      updateCenterOverlay(
        pct,
        `剩余 ${redAll.length} 个待答，约 ${roundsLeft} 轮内达到 100%`,
        `收敛第 ${convergeRounds + 1} 批 · 本批回答 ${batch.length} 个节点（只答不追问）`,
      );
      showBurst(1, "收敛本批", batch.map((n, i) => `${i + 1}. ${((n.question || "").trim().slice(0, 50))}${(n.question || "").trim().length > 50 ? "…" : ""}`).join("\n"));
      showBurst(2, "处理方式", "仅提交 AI 回答，不再生成追问\n完成度将逐步升至 100%");
      showBurst(3, "状态", `本批 ${batch.length} 个节点并发回答中…`);
      showBurst(4, "进度", `完成度 ${pct}% · 剩余 ${redAll.length} 个`);
      const convergeResults = await Promise.allSettled(batch.map((node) => processOneRedNodeConverge(node)));
      const convergeNoAi = convergeResults.filter((r) => r.status === "rejected" && r.reason && (r.reason.message || "").includes("no_ai_answer")).length;
      if (convergeNoAi > 0) {
        showToast(`收敛阶段 ${convergeNoAi} 个节点未获取到 AI 回答已跳过`, "blue");
      }
      project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes || state.nodes;
      state.contextLinks = project.context_links || state.contextLinks;
      if (project.progress) {
        updateProgress(project.progress);
        const newPct = project.progress.percent;
        updateCenterOverlay(newPct, newPct >= 100 ? "已完成收敛，完成度 100%" : `完成度 ${newPct}% · 剩余 ${getRedQuestionNodesInBFSOrder(state.nodes, 99).length} 个`);
        updateBurst(1, "本批完成", `已回答 ${batch.length} 个节点`);
        updateBurst(3, "状态", "已写入回答，完成度已更新");
        updateBurst(4, "进度", `完成度 ${newPct}%`);
      }
      buildMap();
      convergeRounds += 1;
    }

    hideCenterOverlay();
    const projectFinal = await apiJson(`/api/projects/${state.projectId}`);
    state.nodes = projectFinal.nodes || state.nodes;
    state.contextLinks = projectFinal.context_links || state.contextLinks;
    if (projectFinal.progress) updateProgress(projectFinal.progress);
    buildMap();
    if (totalExpanded > 0 || (projectFinal.progress && projectFinal.progress.percent >= 100)) {
      showToast(projectFinal.progress && projectFinal.progress.percent >= 100 ? "展开与收敛已完成，完成度 100%" : `爆发完成，共展开 ${totalExpanded} 个分支`, "green");
    }
  } catch (e) {
    console.error(e);
    hideAllBursts();
    hideCenterOverlay();
    showToast("超级 Agent 执行出错：" + (e.message || "请稍后重试"), "red");
  } finally {
    hideAllBursts();
    hideCenterOverlay();
    hideSuperAgentExtra();
    state.superAgentAbortRequested = false;
    const phaseTitleEl = document.getElementById("super-agent-phase-title");
    if (phaseTitleEl) phaseTitleEl.textContent = "AI 托管发散中";
    state.superAgentRunning = false;
    if (superAgentBtn) {
      superAgentBtn.disabled = false;
      if (superAgentBtnText) superAgentBtnText.textContent = "超级 Agent";
    }
  }
}

// 基于已回答节点生成新问题：长按并拖动该节点触发
async function triggerSpawnFromNode(nodeId) {
  if (!state.projectId) return;
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  // 仅允许在“已作答过”的节点上新增追问：如果当前节点没有回答，后端会返回错误
  const pos = state.nodePositions[nodeId];

  try {
    const newNode = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/spawn`,
      { method: "POST" },
    );

    // 刷新项目，获取完整节点树
    try {
      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes;
      state.contextLinks = project.context_links || [];
    } catch (_) {
      state.nodes = state.nodes.concat(newNode);
    }
    buildMap();
    const added = state.nodes.find((n) => n.id === newNode.id);
    if (added) ensureNodeTitle(added);
    showToast("已为该节点生成一个新的追问问题", "blue");
  } catch (e) {
    console.error(e);
    let msg = e && e.message ? e.message : "生成新问题失败";
    if (msg.includes("no_answer")) msg = "请先回答该节点后再追问。";
    if (msg.includes("no_followup")) msg = "追问生成失败（可能为接口暂时异常），请稍后重试。";
    showToast(msg, "red");
  }
}

// 基于当前节点生成一个 Tips 信息节点（蓝色，不需要作答，通常用于“已回答”节点的补充）
async function triggerTipsFromNode(nodeId) {
  if (!state.projectId) return;
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  try {
    const newNode = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/tips`,
      { method: "POST" },
    );

    // 刷新项目，获取完整节点树
    try {
      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes;
      state.contextLinks = project.context_links || [];
    } catch (_) {
      state.nodes = state.nodes.concat(newNode);
    }
    buildMap();
    const added = state.nodes.find((n) => n.id === newNode.id);
    if (added) {
      ensureNodeTitle(added);
      // 新建 Tips 后自动选中该节点，不移动画布聚焦
      setTimeout(() => selectNode(added.id, { panToCenter: false }), 0);
    }
    showToast("已为该节点生成一个 Tips 信息节点", "blue");
  } catch (e) {
    console.error(e);
    let msg = e && e.message ? e.message : "生成 Tips 失败";
    if (msg.includes("no_answer")) msg = "请先回答该节点后再生成 Tips。";
    showToast(msg, "red");
  }
}

// 为 Tips 节点加载 2~3 条候选 Tips 文本
async function loadTipsCandidates(node) {
  if (!state.projectId || !node || node.node_type !== "tip") return;
  state.tipsLoading[node.id] = true;
  renderTipsCandidates(node);
  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${node.id}/tips/candidates`,
      { method: "POST" },
    );
    state.tipsCandidates[node.id] = res.candidates || [];
  } catch (e) {
    console.error(e);
    showToast("获取 Tips 候选失败", "red");
    state.tipsCandidates[node.id] = [];
  } finally {
    state.tipsLoading[node.id] = false;
    renderTipsCandidates(node);
  }
}

// 在问题详情框中渲染 Tips 候选卡片
function renderTipsCandidates(node) {
  if (!questionFloatText || !node || node.node_type !== "tip") return;
  if (state.activeId !== node.id) return;

  // 容器使用单列大卡片布局，占据下半屏宽度
  questionFloatText.innerHTML = "";
  questionFloatText.className =
    "grid grid-cols-1 gap-4 text-sm leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar pr-1";

  if (state.tipsLoading[node.id]) {
    const loading = document.createElement("div");
    loading.className = "col-span-full text-sm text-gray-400";
    loading.textContent = "正在为你生成 Tips…";
    questionFloatText.appendChild(loading);
    return;
  }

  const cands = state.tipsCandidates[node.id] || [];
  if (!cands.length) {
    const empty = document.createElement("div");
    empty.className = "col-span-full text-sm text-gray-400";
    empty.textContent = "暂无可用 Tips，请稍后再试。";
    questionFloatText.appendChild(empty);
    return;
  }

  cands.forEach((content, idx) => {
    const card = document.createElement("div");
    card.className =
      "px-5 py-4 rounded-2xl bg-white/90 border border-blue-100 text-gray-900 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col gap-2";

    const title = document.createElement("div");
    title.className = "text-xs font-black text-blue-600 uppercase tracking-wider";
    title.textContent = `TIPS ${idx + 1}`;

    const body = document.createElement("div");
    body.className = "text-sm leading-relaxed line-clamp-4";
    body.textContent = content;

    card.appendChild(title);
    card.appendChild(body);

    card.onclick = () => chooseTip(node.id, content);
    questionFloatText.appendChild(card);
  });
}

// 选择一条 Tips 固化到 Tips 节点上
async function chooseTip(nodeId, content) {
  if (!state.projectId) return;
  const trimmed = (content || "").trim();
  if (!trimmed) return;

  try {
    const node = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/tips/choose`,
      {
        method: "POST",
        body: JSON.stringify({ content: trimmed }),
      },
    );

    // 优先从后端刷新整棵树，确保新 Tips 节点或内容立刻可见
    try {
      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes || state.nodes;
      state.contextLinks = project.context_links || state.contextLinks;
    } catch (_) {
      // 退路：仅在本地更新该节点
      state.nodes = state.nodes.map((n) => (n.id === node.id ? { ...n, ...node } : n));
    }

    state.tipsCandidates[nodeId] = [];
    buildMap();

    const updated = state.nodes.find((n) => n.id === nodeId);
    if (updated) {
      ensureNodeTitle(updated);
      // 重新选中以刷新问题详情框，不移动画布
      setTimeout(() => selectNode(updated.id, { panToCenter: false }), 0);
    }
    showToast("已应用选中的 Tips", "blue");
  } catch (e) {
    console.error(e);
    showToast("应用 Tips 失败", "red");
    throw e;
  }
}

// 为“未回答的问题”生成可选择的候选答案（可作为 Tips 或直接作为回答）
async function generateAnswerCandidatesForQuestion(node) {
  if (!state.projectId || !node) return;
  const nodeId = node.id;

  state.tipsLoading[nodeId] = true;
  if (questionFloatText) {
    questionFloatText.className =
      "grid grid-cols-1 gap-4 text-sm leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar pr-1";
    questionFloatText.innerHTML =
      '<div class="col-span-full flex items-center justify-center gap-3 py-8 text-sm text-gray-400"><span class="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>正在为你生成参考答案…</div>';
  }

  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/tips/candidates`,
      { method: "POST" },
    );
    const cands = res.candidates || [];
    if (!cands.length) {
      if (questionFloatText) {
        questionFloatText.innerHTML =
          '<div class="col-span-full text-sm text-gray-400">暂时没有合适的参考答案，请稍后再试。</div>';
      }
      return;
    }

    if (!questionFloatText) return;
    questionFloatText.innerHTML = "";

    cands.forEach((content, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className =
        "candidate-answer-card p-5 rounded-2xl bg-white/90 border border-blue-100 text-sm text-gray-900 flex flex-col gap-3";

      const titleRow = document.createElement("div");
      titleRow.className = "flex items-center justify-between gap-2";

      const title = document.createElement("div");
      title.className = "text-xs font-black text-blue-600 uppercase tracking-wider";
      title.textContent = `候选答案 ${idx + 1}`;

      const btnRow = document.createElement("div");
      btnRow.className = "flex items-center gap-2";

      const tipBtn = document.createElement("button");
      tipBtn.className =
        "px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100";
      tipBtn.textContent = "作为 Tips";
      tipBtn.onclick = () => createTipFromQuestion(nodeId, content);

      const answerBtn = document.createElement("button");
      answerBtn.className =
        "px-3 py-1 rounded-full text-[10px] font-semibold bg-[#34A853]/10 text-[#34A853] hover:bg-[#34A853]/20";
      answerBtn.textContent = "直接作回答";
      answerBtn.onclick = () => applyTipAsAnswer(nodeId, content);

      btnRow.appendChild(tipBtn);
      btnRow.appendChild(answerBtn);

      titleRow.appendChild(title);
      titleRow.appendChild(btnRow);

      const textDiv = document.createElement("div");
      textDiv.className = "candidate-answer-card-content leading-relaxed text-sm text-gray-900";
      textDiv.textContent = content;

      wrapper.appendChild(titleRow);
      wrapper.appendChild(textDiv);

      questionFloatText.appendChild(wrapper);
    });
  } catch (e) {
    console.error(e);
    if (questionFloatText) {
      questionFloatText.innerHTML =
        '<div class="col-span-full text-sm text-red-500">生成参考答案时出错，请稍后重试。</div>';
    }
  } finally {
    state.tipsLoading[nodeId] = false;
  }
}

// 从问题节点创建一个 Tips 子节点
async function createTipFromQuestion(nodeId, content) {
  if (!state.projectId) return;
  const trimmed = (content || "").trim();
  if (!trimmed) return;

  let newNode;
  try {
    newNode = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/tips`,
      {
        method: "POST",
      },
    );
  } catch (e) {
    console.error(e);
    showToast("创建 Tips 节点失败", "red");
    return;
  }

  if (!newNode || !newNode.id) {
    showToast("创建 Tips 节点失败：返回数据异常", "red");
    return;
  }

  // 先刷新树，让新 Tips 节点立刻出现在脑图上
  try {
    const project = await apiJson(`/api/projects/${state.projectId}`);
    state.nodes = project.nodes || state.nodes;
    state.contextLinks = project.context_links || state.contextLinks;
    buildMap();
  } catch (_) {}

  // 再调用 chooseTip 把选中的文案固化到该 Tips 节点
  try {
    await chooseTip(newNode.id, trimmed);
  } catch (e) {
    console.error(e);
    showToast("Tips 节点已创建，但应用内容失败，请点击该节点重试", "red");
  }
}

// 将 AI 提示直接作为当前问题的回答（标记为 AI 回答，纯蓝）
async function applyTipAsAnswer(nodeId, content) {
  if (!state.projectId) return;
  const trimmed = (content || "").trim();
  if (!trimmed) return;

  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/answer`,
      {
        method: "POST",
        body: JSON.stringify({ content: trimmed, by_ai: true }),
      },
    );

    // 尝试更新进度与整棵树，保证颜色与新增节点立刻可见
    if (res.projectProgress) {
      updateProgress(res.projectProgress);
    }

    try {
      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes || state.nodes;
      state.contextLinks = project.context_links || state.contextLinks;
    } catch (_) {
      // 退路：仅更新当前节点
      const updatedNode = res.updatedNode || res.node || res;
      if (updatedNode && updatedNode.id) {
        state.nodes = state.nodes.map((n) =>
          n.id === updatedNode.id ? { ...n, ...updatedNode } : n
        );
      }
    }

    buildMap();
    setTimeout(() => selectNode(nodeId, { panToCenter: false }), 0);
    showToast("已将 AI 提示作为回答应用到该问题", "blue");
  } catch (e) {
    console.error(e);
    showToast("应用 AI 回答失败", "red");
  }
}

// 右侧网页搜索面板：显示 / 关闭
function showWebSearchPanel() {
  if (!webSearchPanel) return;
  webSearchPanel.classList.remove("opacity-0", "pointer-events-none", "translate-x-4");
  webSearchPanel.classList.add("pointer-events-auto");
  webSearchPanel.setAttribute("aria-hidden", "false");
}
function closeWebSearchPanel() {
  if (!webSearchPanel) return;
  webSearchPanel.classList.add("opacity-0", "pointer-events-none", "translate-x-4");
  webSearchPanel.classList.remove("pointer-events-auto");
  webSearchPanel.setAttribute("aria-hidden", "true");
}

// 熵增·网页：按节点搜最相关例子；在右侧面板展示（一句话介绍 + 2～3 条网站选择 + 导入并链接）
async function triggerWebSearchForNode(nodeId) {
  if (!state.projectId) return;
  closeNodeContextMenu();
  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${nodeId}/web-search`,
      { method: "POST" },
    );
    const results = res.results || [];
    if (!results.length) {
      showToast(res.hint || "未搜到相关网页", "blue");
      return;
    }
    state.webSearchForNodeId = nodeId;
    const node = state.nodes.find((n) => n.id === nodeId);
    const questionText = (node && (node.question || node.title || "").trim()) || "当前问题";
    const introText = `针对「${questionText.slice(0, 28)}${questionText.length > 28 ? "…" : ""}」可参考以下网站，点击任意一项即创建网站节点并链接到本节点。`;
    if (webSearchPanelIntro) webSearchPanelIntro.textContent = introText;
    if (webSearchPanelList) {
      webSearchPanelList.innerHTML = "";
      const showResults = results.slice(0, 3);
      showResults.forEach((r, i) => {
        const card = document.createElement("div");
        card.setAttribute("data-web-search-url", r.url || "");
        card.setAttribute("data-web-search-title", (r.title || "").slice(0, 200));
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.className = "px-4 py-3 rounded-2xl bg-white/95 border border-purple-200/80 text-gray-900 flex flex-col gap-2 min-w-0 overflow-hidden cursor-pointer hover:bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-200";
        const title = document.createElement("div");
        title.className = "font-semibold text-purple-800 text-sm break-words";
        title.textContent = (r.title || "").trim() || `网站 ${i + 1}`;
        const snippet = document.createElement("div");
        snippet.className = "text-xs text-gray-600 leading-relaxed line-clamp-3 break-words overflow-hidden min-w-0";
        const rawSnippet = (r.snippet || "").trim();
        snippet.textContent = rawSnippet.slice(0, 200) + (rawSnippet.length > 200 ? "…" : "");
        card.appendChild(title);
        card.appendChild(snippet);
        webSearchPanelList.appendChild(card);
      });
    }
    showWebSearchPanel();
    showToast(`已找到相关网站，点击任意一项即可创建并链接`, "blue");
  } catch (e) {
    console.error(e);
    showToast(e && e.message ? e.message : "搜索失败", "red");
  }
}

// 网页搜索结果浮层内点击「作为材料导入并链接到本节点」时调用
async function importWebSearchResultAsMaterialAndLink(url, title, currentNodeId) {
  if (!state.projectId || !currentNodeId || !url) return;
  try {
    const material = await apiJson(`/api/projects/${state.projectId}/materials`, {
      method: "POST",
      body: JSON.stringify({ url: url.trim(), title: (title || "").trim() || undefined }),
    });
    await apiJson(`/api/projects/${state.projectId}/context-links`, {
      method: "POST",
      body: JSON.stringify({ node_a_id: currentNodeId, node_b_id: material.id }),
    });
    const project = await apiJson(`/api/projects/${state.projectId}`);
    state.nodes = project.nodes || state.nodes;
    state.contextLinks = project.context_links || state.contextLinks;
    // 将新材料节点放在当前操作节点右侧附近，便于看到连线
    const curPos = state.nodePositions[currentNodeId];
    const materialW = 180;
    const gap = 50;
    if (curPos && typeof curPos.left === "number" && typeof curPos.top === "number") {
      const curW = curPos.width || LAYOUT.nodeWidth;
      state.nodePositions[material.id] = {
        left: curPos.left + curW + gap,
        top: curPos.top,
        width: materialW,
      };
    }
    buildMap();
    updateConnectors();
    closeWebSearchPanel();
    showToast("已导入为材料节点并链接到本节点，回答时将参考该网页内容", "green");
  } catch (e) {
    console.error(e);
    showToast(e && e.message ? e.message : "导入或链接失败", "red");
  }
}

// 链接材料到当前节点（建立共享上下文）
async function linkMaterialToNode(nodeId, materialId) {
  if (!state.projectId) return;
  try {
    await apiJson(`/api/projects/${state.projectId}/context-links`, {
      method: "POST",
      body: JSON.stringify({ node_a_id: nodeId, node_b_id: materialId }),
    });
    const a = nodeId < materialId ? nodeId : materialId;
    const b = nodeId < materialId ? materialId : nodeId;
    state.contextLinks = state.contextLinks || [];
    if (!state.contextLinks.some((l) => l.node_a_id === a && l.node_b_id === b)) {
      state.contextLinks.push({ node_a_id: a, node_b_id: b });
    }
    updateConnectors();
    showToast("已链接材料到本节点，可作上下文参考", "blue");
  } catch (e) {
    console.error(e);
    showToast(e && e.message ? e.message : "链接失败", "red");
  }
}

// ---- 右键菜单操作 ----

function handleContextMenuClick(action) {
  const nodeId = state.contextMenu.nodeId;
  if (!nodeId) {
    closeNodeContextMenu();
    return;
  }
  const node = state.nodes.find((n) => n.id === nodeId);
  if (!node) {
    closeNodeContextMenu();
    return;
  }
  selectNode(nodeId);

  if (action === "answer") {
    // 根节点与已完成的节点不支持作答
    if (node.level === 0) {
      showToast("根节点用于统领整体主题，不需要直接作答。", "blue");
    } else if (node.status === "green" || node.status === "ai") {
      showToast("该节点已完成作答，如需补充请使用 Tips。", "blue");
    } else {
      // 显式进入作答模式
      enterAnswerModeForNode(node);
    }
  } else if (action === "spawn") {
    if (node.node_type === "section") {
      triggerSectionQuestionFromNode(nodeId);
    } else if (node.status !== "green" && node.status !== "ai") {
      showToast("请先回答该节点后再追问。", "blue");
    } else {
      triggerSpawnFromNode(nodeId);
    }
  } else if (action === "web-search") {
    triggerWebSearchForNode(nodeId);
  } else if (action === "link-material") {
    const materialId = state.contextMenu.materialId;
    if (materialId && state.projectId) {
      linkMaterialToNode(nodeId, materialId);
    }
    closeNodeContextMenu();
    return;
  } else if (action === "tips") {
    // 右键 Tips：根据是否已回答来决定行为
    if (node.status === "green" || node.status === "ai") {
      // 已回答：生成补充说明的 Tips 子节点
      triggerTipsFromNode(nodeId);
    } else {
      // 未回答：补充说明 / 参考答案候选
      generateAnswerCandidatesForQuestion(node);
    }
  }

  closeNodeContextMenu();
}

// 底部加号按钮已废除，追问与 Tips 功能统一通过右键菜单触发

function escapeHtml(s) {
  if (s == null) return "";
  const t = String(s);
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 每个问题的 2～7 字标题：正在请求 AI 时显示「命名中…」，否则用已有标题或问题前 7 字 */
function getNodeShortTitle(node) {
  if (state.fetchingTitle && state.fetchingTitle[node.id]) return "命名中…";
  const t = (node.title || "").trim();
  if (t && !/^疑问\s*\d+$/.test(t) && !/^追问\s*\d+$/.test(t)) return t;
  const q = (node.question || "").trim();
  return q ? q.replace(/[？?。！!，,、\s]+$/, "").slice(0, 7) : (t || "节点");
}

/** 为节点请求 AI 短标题：根节点与板块节点不请求 */
async function ensureNodeTitle(node) {
  if (!state.projectId || !node || node.level === 0) return;
  if (node.node_type === "section") return;
  if (state.titled[node.id]) return;
  if (state.fetchingTitle[node.id]) return;

  state.fetchingTitle = state.fetchingTitle || {};
  state.fetchingTitle[node.id] = true;

  const nodeEl = document.getElementById(`node-${node.id}`);
  if (nodeEl) nodeEl.textContent = "命名中…";
  if (questionFloatTitle && state.activeId === node.id) questionFloatTitle.textContent = "命名中…";
  if (activeNodeName && state.activeId === node.id) activeNodeName.innerText = "命名中…";

  const fallback = (node.question || "").trim().replace(/[？?。！!，,、\s]+$/, "").slice(0, 7) || "节点";

  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${node.id}/title`,
      { method: "POST" },
    );
    const newTitle = (res.title || "").trim() || fallback;
    state.nodes = state.nodes.map((n) => (n.id === node.id ? { ...n, title: newTitle } : n));
    state.titled = state.titled || {};
    state.titled[node.id] = true;
    if (nodeEl && node.node_type !== "section" && node.level !== 0) nodeEl.textContent = newTitle;
    if (questionFloatTitle && state.activeId === node.id) questionFloatTitle.textContent = newTitle;
    if (activeNodeName && state.activeId === node.id) activeNodeName.innerText = newTitle;
  } catch (e) {
    console.error(e);
    if (nodeEl) nodeEl.textContent = fallback;
    if (questionFloatTitle && state.activeId === node.id) questionFloatTitle.textContent = fallback;
    if (activeNodeName && state.activeId === node.id) activeNodeName.innerText = fallback;
  } finally {
    delete state.fetchingTitle[node.id];
  }
}

function selectNode(id, options = {}) {
  const { panToCenter = true, ensureTitle = true } = options;
  const node = state.nodes.find((n) => n.id === id);
  if (!node) return;
  state.activeId = id;
  document.querySelectorAll(".node").forEach((el) => el.classList.remove("node-active"));
  const el = document.getElementById(`node-${id}`);
  if (el) el.classList.add("node-active");

  const isTip = node.node_type === "tip";

  // 问题详情框在作答框正上方显示
  if (questionFloat && questionFloatTitle && questionFloatText) {
    const shortTitle = getNodeShortTitle(node);
    questionFloatTitle.textContent = shortTitle;
    // 显示时整条问题浮层可交互（可点击、可滚动），否则子元素 pointer-events-none 会导致点击穿透到画布
    questionFloat.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");
    questionFloat.classList.add("pointer-events-auto");
    if (questionFloatCard) {
      questionFloatCard.classList.remove("pointer-events-none");
      questionFloatCard.classList.add("pointer-events-auto");
    }

    if (node.node_type === "section") {
      questionFloatText.className = "text-white/80 font-medium text-sm leading-relaxed";
      questionFloatText.textContent = `本板块：${node.title || "本板块"}。请选择下方具体问题作答。`;
      if (nodePanel) {
        nodePanel.classList.add("translate-y-32", "opacity-0", "pointer-events-none");
        nodePanel.classList.remove("pointer-events-auto");
      }
    } else if (isTip && node.question === "信息待选择") {
      renderTipsCandidates(node);
      if (!state.tipsCandidates[node.id] && !state.tipsLoading[node.id]) {
        loadTipsCandidates(node);
      }
    } else {
      questionFloatText.className =
        "text-gray-900 font-medium text-sm leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar pr-1";
      questionFloatText.textContent = node.question || "请简要回答。";
    }
  }

  // 仅左键选中时画布平移到中心；右键打开菜单时不跟随
  const pos = canvasInner.querySelector(`#node-${id}`);
  if (panToCenter && pos) {
    const rect = pos.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = window.innerWidth / 2 - centerX;
    const dy = window.innerHeight / 2 - centerY;
    state.canvas.x += dx;
    state.canvas.y += dy;
    syncCanvas();
  }

  // 问题节点：选中时触发 AI 起短标题；超级 Agent 运行中不请求起名，保证发散节奏
  if (!isTip && ensureTitle && !state.superAgentRunning) {
    ensureNodeTitle(node);
  }
}

// 画布拖拽（空白处拖动）；节点本身可单独拖动
// 使用整个脑图区作为拖拽热点，避免下半区域难以拖动的问题
mindmapView.addEventListener("mousedown", (e) => {
  // 只处理左键
  if (e.button !== 0) return;
  // 点击在节点、作答面板、问题浮层或右键菜单上时，不触发画布拖拽
  if (
    e.target.closest(".node") ||
    e.target.closest("#node-panel") ||
    e.target.closest("#question-float-card") ||
    e.target.closest("#node-context-menu")
  ) {
    return;
  }
  closeNodeContextMenu();
  state.isDragging = true;
  state.mouse = { x: e.clientX, y: e.clientY };
  canvasInner.style.transition = "none";
  // 拖动画布时，自动收起当前问题描述浮窗
  if (questionFloat) {
    questionFloat.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
    questionFloat.classList.remove("pointer-events-auto");
    if (questionFloatCard) {
      questionFloatCard.classList.add("pointer-events-none");
      questionFloatCard.classList.remove("pointer-events-auto");
    }
  }
});
window.onmousemove = (e) => {
  // 长按拖线中：更新预览线终点
  if (state.drawingContextLink) {
    const pt = clientToCanvasInner(e.clientX, e.clientY);
    state.drawingContextLink.endX = pt.x;
    state.drawingContextLink.endY = pt.y;
    updateConnectors();
    return;
  }
  // 拖动单个节点：若长按计时未到且移动超过阈值则取消长按
  if (state.draggingNode) {
    if (state._contextLinkTimer && state.dragStart) {
      const dx = e.clientX - state.dragStart.clientX;
      const dy = e.clientY - state.dragStart.clientY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        clearTimeout(state._contextLinkTimer);
        state._contextLinkTimer = null;
      }
    }
    const id = state.draggingNode;
    const start = state.dragStart;
    if (!start) return;
    const left = start.left + (e.clientX - start.clientX);
    const top = start.top + (e.clientY - start.clientY);
    const pos = state.nodePositions[id];
    if (pos) {
      pos.left = left;
      pos.top = top;
      if (Math.abs(e.clientX - start.clientX) > 2 || Math.abs(e.clientY - start.clientY) > 2) {
        state.didDragThisSession = true;
      }
    }
    const el = document.getElementById(`node-${id}`);
    if (el) {
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }
    updateConnectors();
    return;
  }
  if (!state.isDragging) return;
  if (state.contextMenu.visible) {
    closeNodeContextMenu();
  }
  const dx = e.clientX - state.mouse.x;
  const dy = e.clientY - state.mouse.y;
  state.canvas.x += dx;
  state.canvas.y += dy;
  syncCanvas();
  state.mouse = { x: e.clientX, y: e.clientY };
};
window.onmouseup = (e) => {
  if (state.drawingContextLink) {
    const fromId = state.drawingContextLink.fromNodeId;
    let toId = null;
    const cx = e && e.clientX != null ? e.clientX : 0;
    const cy = e && e.clientY != null ? e.clientY : 0;
    state.nodes.forEach((node) => {
      if (node.id === fromId) return;
      const el = document.getElementById(`node-${node.id}`);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) toId = node.id;
    });
    if (toId && state.projectId) {
      (async () => {
        try {
          await apiJson(`/api/projects/${state.projectId}/context-links`, {
            method: "POST",
            body: JSON.stringify({ node_a_id: fromId, node_b_id: toId }),
          });
          state.contextLinks = state.contextLinks || [];
          state.contextLinks.push({ node_a_id: fromId < toId ? fromId : toId, node_b_id: fromId < toId ? toId : fromId });
          updateConnectors();
          showToast("已建立共享上下文连线", "blue");
        } catch (err) {
          console.error(err);
          showToast(err && err.message ? err.message : "建立连线失败", "red");
        }
      })();
    }
    state.drawingContextLink = null;
    updateConnectors();
  }
  if (state._contextLinkTimer) {
    clearTimeout(state._contextLinkTimer);
    state._contextLinkTimer = null;
  }
  if (state.draggingNode) {
    state.dragStart = null;
    state.draggingNode = null;
  }
  state.isDragging = false;
  canvasInner.style.transition = "transform 0.6s cubic-bezier(0.2, 0, 0.2, 1)";
};

// 滚轮缩放导图：脑图可见时，在 document 捕获阶段拦截 wheel，避免被其他元素吞掉
document.addEventListener(
  "wheel",
  (e) => {
    if (!mindmapView || !canvasInner) return;
    const mindmapVisible =
      !mindmapView.classList.contains("opacity-0") &&
      !mindmapView.classList.contains("pointer-events-none");
    if (!mindmapVisible) return;
    if (e.target.closest("textarea") || e.target.closest("select") || e.target.closest("#question-float-card")) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -1 : 1;
    const factor = 1 + delta * 0.12;
    canvasInner.style.transition = "none";
    setCanvasScale(state.canvas.scale * factor);
    clearTimeout(canvasInner._zoomEnd);
    canvasInner._zoomEnd = setTimeout(() => {
      canvasInner.style.transition = "transform 0.6s cubic-bezier(0.2, 0, 0.2, 1)";
    }, 150);
  },
  { passive: false, capture: true }
);

window.addEventListener("click", (e) => {
  if (contextMenu && !contextMenu.classList.contains("hidden") && (!e.target.closest || !e.target.closest("#node-context-menu"))) {
    closeNodeContextMenu();
  }
  if (blankContextMenu && !blankContextMenu.classList.contains("hidden") && (!e.target.closest || !e.target.closest("#blank-context-menu"))) {
    closeBlankContextMenu();
  }
  if (webSearchPanel && !webSearchPanel.classList.contains("pointer-events-none") && (!e.target.closest || !e.target.closest("#web-search-panel"))) {
    closeWebSearchPanel();
  }
});

// 绑定右键菜单按钮点击（委托，支持动态添加的「链接材料」）
if (contextMenu) {
  contextMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    e.stopPropagation();
    const action = btn.getAttribute("data-action");
    if (action === "link-material") state.contextMenu.materialId = btn.getAttribute("data-material-id");
    if (action) handleContextMenuClick(action);
  });
}

// 右侧网页搜索面板：点击整张卡片即创建节点并链接 + 关闭按钮
if (webSearchPanel) {
  webSearchPanel.addEventListener("click", (e) => {
    if (e.target.id === "web-search-panel-close" || e.target.closest("#web-search-panel-close")) {
      closeWebSearchPanel();
      return;
    }
    const card = e.target.closest("[data-web-search-url]");
    if (!card || !state.webSearchForNodeId) return;
    e.stopPropagation();
    const url = card.getAttribute("data-web-search-url");
    const title = card.getAttribute("data-web-search-title") || "";
    if (url) importWebSearchResultAsMaterialAndLink(url, title, state.webSearchForNodeId);
  });
  webSearchPanel.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest("[data-web-search-url]");
    if (!card || !state.webSearchForNodeId) return;
    e.preventDefault();
    const url = card.getAttribute("data-web-search-url");
    const title = card.getAttribute("data-web-search-title") || "";
    if (url) importWebSearchResultAsMaterialAndLink(url, title, state.webSearchForNodeId);
  });
}
if (webSearchPanelClose) {
  webSearchPanelClose.addEventListener("click", () => closeWebSearchPanel());
}

// 空白右键·导入材料
document.getElementById("blank-menu-import-material")?.addEventListener("click", async () => {
  closeBlankContextMenu();
  const url = window.prompt("输入网页链接或材料 URL：");
  if (!url || !url.trim()) return;
  if (!state.projectId) {
    showToast("请先进入项目", "red");
    return;
  }
  const title = window.prompt("材料标题（可选，直接回车则用 URL）：", url.slice(0, 50));
  try {
    const created = await apiJson(`/api/projects/${state.projectId}/materials`, {
      method: "POST",
      body: JSON.stringify({ url: url.trim(), title: title != null ? title.trim() : null }),
    });
    if (state.blankMenuCanvasPos && created && created.id) {
      const pt = state.blankMenuCanvasPos;
      const w = 180;
      state.nodePositions[created.id] = {
        left: pt.x - w / 2,
        top: pt.y - LAYOUT.nodeHeight / 2,
        width: w,
      };
    }
    const project = await apiJson(`/api/projects/${state.projectId}`);
    state.nodes = project.nodes || state.nodes;
    state.contextLinks = project.context_links || state.contextLinks;
    buildMap();
    showToast("已导入材料，可在节点右键「熵减方案」中链接材料到节点", "blue");
  } catch (e) {
    console.error(e);
    showToast(e && e.message ? e.message : "导入失败", "red");
  }
});

function syncCanvas() {
  const s = state.canvas.scale;
  canvasInner.style.transform = `translate(calc(-50% + ${state.canvas.x}px), calc(-50% + ${state.canvas.y}px)) scale(${s})`;
}

function setCanvasScale(newScale) {
  state.canvas.scale = Math.max(CANVAS_SCALE_MIN, Math.min(CANVAS_SCALE_MAX, newScale));
  syncCanvas();
}

// ----------- 节点作答 & 调用后端 -----------

async function submitAnswer() {
  const id = state.activeId;
  if (!id || !state.projectId) return;
  const node = state.nodes.find((n) => n.id === id);
  if (!node) return;
  const val = nodeInput.value.trim();
  if (!val) return;

  try {
    const res = await apiJson(
      `/api/projects/${state.projectId}/nodes/${id}/answer`,
      {
        method: "POST",
        body: JSON.stringify({ content: val, by_ai: false }),
      }
    );

    updateProgress(res.projectProgress);
    try {
      const project = await apiJson(`/api/projects/${state.projectId}`);
      state.nodes = project.nodes;
      state.contextLinks = project.context_links || state.contextLinks;
    } catch (_) {
      const updated = res.updatedNode;
      state.nodes = state.nodes.map((n) =>
        n.id === updated.id ? { ...n, status: updated.status } : n
      );
      if (res.addedNodes && res.addedNodes.length) {
        state.nodes = state.nodes.concat(res.addedNodes);
      }
    }
    buildMap();
    showToast("节点补全成功", "green");

    // 回答完成后，自动收起作答框，避免一直占用视野
    if (nodePanel) {
      nodePanel.classList.add("translate-y-32", "opacity-0", "pointer-events-none");
      nodePanel.classList.remove("pointer-events-auto");
    }
    if (nodeInput) {
      nodeInput.value = "";
    }

    if (res.nextNodeId) {
      const next = state.nodes.find((n) => n.id === res.nextNodeId);
      if (next) setTimeout(() => selectNode(next.id, { panToCenter: false }), 600);
    }
  } catch (e) {
    console.error(e);
    showToast("提交解答失败，请检查后端是否运行。", "red");
  }
}

function enterAnswerModeForNode(node) {
  if (!nodePanel || !nodeInput) return;
  nodePanel.classList.remove("translate-y-32", "opacity-0", "pointer-events-none");
  nodePanel.classList.add("pointer-events-auto");
  activeNodeName.innerText = getNodeShortTitle(node);
  nodeInput.disabled = false;
  nodeInput.placeholder = "在此输入你的回答…";
  nodeInput.classList.remove("bg-green-50", "cursor-default");
  nodeInput.classList.add("bg-white/40");
  nodeInput.value = "";
  nodeInput.focus();
  if (nodeSubmit) nodeSubmit.classList.remove("hidden");
}

function enterViewModeForNode(node) {
  if (!nodePanel || !nodeInput) return;
  nodePanel.classList.remove("translate-y-32", "opacity-0", "pointer-events-none");
  nodePanel.classList.add("pointer-events-auto");
  activeNodeName.innerText = getNodeShortTitle(node);
  nodeInput.value = "";
  nodeInput.disabled = true;
  nodeInput.placeholder = "";
  nodeInput.classList.remove("bg-white/40");
  nodeInput.classList.add("bg-green-50", "cursor-default");
  if (nodeSubmit) nodeSubmit.classList.add("hidden");
}

// ----------- Merge 融合 -----------
// 保存最近一次融合结果，供 PDF 导出与可靠性说明
state.lastMergeContent = null;
state.lastMergeTitle = null;

const resultMergeLoadingHtml = `
  <div class="flex flex-col items-center justify-center min-h-[200px] gap-6 text-gray-500">
    <div class="w-14 h-14 border-4 border-[#4285F4]/30 border-t-[#4285F4] rounded-full animate-spin"></div>
    <p class="font-bold text-lg">正在生成报告…</p>
    <p class="text-sm">以当前脑图全部问答为依据，请稍候</p>
  </div>`;

async function openModal() {
  if (!state.projectId) return;
  resultModal.classList.remove("hidden");
  resultContent.innerHTML = resultMergeLoadingHtml;
  if (mergeBtn) mergeBtn.disabled = true;
  try {
    const res = await apiJson(`/api/projects/${state.projectId}/merge`, {
      method: "POST",
    });
    state.lastMergeContent = res.content || "";
    state.lastMergeTitle = state.title || "项目全景方案";
    resultContent.innerHTML = `<pre class="whitespace-pre-wrap text-gray-800 text-lg leading-relaxed">${(res.content || "").replace(
      /</g,
      "&lt;"
    )}</pre>`;
  } catch (e) {
    console.error(e);
    resultContent.innerHTML = `<p class="text-red-500 font-semibold text-center py-8">生成失败，请稍后重试。</p>`;
    showToast("项目尚未全部补全，无法融合。", "red");
  } finally {
    if (mergeBtn) mergeBtn.disabled = false;
  }
}

window.closeModal = function () {
  resultModal.classList.add("hidden");
};

// 导出 PDF：打开打印友好页，用户通过浏览器「另存为 PDF」保存
function exportMergeToPdf() {
  const content = state.lastMergeContent;
  const title = state.lastMergeTitle || "项目全景方案";
  if (!content || !content.trim()) {
    showToast("请先点击「融合项目成果」生成报告后再导出 PDF", "red");
    return;
  }
  const pdfBtn = document.getElementById("download-pdf-btn");
  const originalHtml = pdfBtn ? pdfBtn.innerHTML : "";
  if (pdfBtn) {
    pdfBtn.disabled = true;
    pdfBtn.innerHTML = '<span class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>生成中…';
  }
  const restorePdfBtn = () => {
    if (pdfBtn) {
      pdfBtn.disabled = false;
      pdfBtn.innerHTML = originalHtml || "下载 PDF 报告";
    }
  };
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${(title || "项目全景方案").replace(/</g, "&lt;")} - PDF 报告</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
  <style>
    body { font-family: 'Segoe UI', 'PingFang SC', sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1e293b; line-height: 1.7; }
    h1 { font-size: 1.75rem; border-bottom: 2px solid #4285F4; padding-bottom: 0.5rem; }
    h2 { font-size: 1.35rem; margin-top: 1.5rem; }
    h3 { font-size: 1.1rem; margin-top: 1rem; }
    pre { white-space: pre-wrap; background: #f1f5f9; padding: 1rem; border-radius: 8px; }
    @media print { body { margin: 0; padding: 1rem; } }
  </style>
</head>
<body>
  <div id="report"></div>
  <script>
    var raw = ${JSON.stringify(content)};
    function render() {
      var el = document.getElementById('report');
      if (!el) return;
      if (typeof marked !== 'undefined') {
        el.innerHTML = marked.parse(raw || '');
      } else {
        el.innerHTML = '<pre>' + (raw || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '<\/pre>';
      }
      setTimeout(function() { window.print(); }, 400);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(render, 100); });
    } else {
      setTimeout(render, 100);
    }
  <\/script>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (w) w.focus();
  else {
    showToast("请允许弹窗后重试，或使用融合弹窗内打印 (Ctrl+P) 另存为 PDF", "blue");
    restorePdfBtn();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  setTimeout(restorePdfBtn, 2500);
}

// 事件绑定

startBtn.addEventListener("click", startAction);
initialInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    startAction();
  }
});

nodeSubmit.addEventListener("click", submitAnswer);
nodeInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }
});

mergeBtn.addEventListener("click", openModal);
const downloadPdfBtn = document.getElementById("download-pdf-btn");
if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", exportMergeToPdf);
if (superAgentBtn) superAgentBtn.addEventListener("click", runSuperAgent);
const superAgentExitBtn = document.getElementById("super-agent-exit-btn");
if (superAgentExitBtn) superAgentExitBtn.addEventListener("click", () => {
  state.superAgentAbortRequested = true;
  showToast("正在退出托管…", "blue");
});

// 文档拖拽上传（ALLOWED_DOC_TYPES 见 config.js）

function isAllowedFile(file) {
  const name = (file.name || "").toLowerCase();
  return ALLOWED_DOC_TYPES.some((ext) => name.endsWith(ext));
}

function processDroppedFile(file) {
  if (!file || !isAllowedFile(file)) {
    showToast("仅支持 .txt、.pdf、.docx、.md 文件", "red");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("文件过大，最大 5MB", "red");
    return;
  }
  uploadAndParseDocument(file)
    .then((res) => {
      if (res.text) handleParsedDocument(res.text, file.name);
      else showToast("未能识别出文本内容", "red");
    })
    .catch((e) => {
      console.error(e);
      showToast(e && e.message ? e.message : "文档解析失败", "red");
    });
}

if (dropZone) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("border-[#4285F4]", "bg-blue-50/50");
  });
  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("border-[#4285F4]", "bg-blue-50/50");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("border-[#4285F4]", "bg-blue-50/50");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) processDroppedFile(file);
  });
}

if (dropFileInput) {
  dropFileInput.addEventListener("change", (e) => {
    const file = e.target && e.target.files && e.target.files[0];
    if (file) processDroppedFile(file);
    e.target.value = "";
  });
}

// Agent Skills：加载可选技能并绑定选择
async function loadSkills() {
  try {
    const res = await apiJson("/api/skills");
    const list = res.skills || [];
    state.skills = list;
    if (skillSelect) {
      skillSelect.innerHTML = "";
      list.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name || s.id;
        skillSelect.appendChild(opt);
      });
      if (list.length > 0) {
        skillSelect.value = list[0].id;
        state.skillId = list[0].id;
      }
      skillSelect.addEventListener("change", () => {
        state.skillId = skillSelect.value || null;
      });
    }
  } catch (e) {
    console.warn("加载 Agent Skills 失败", e);
  }
}
loadSkills();

