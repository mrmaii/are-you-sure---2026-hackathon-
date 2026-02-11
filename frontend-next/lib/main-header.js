const runtimeBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

if (typeof window !== "undefined") {
  window.__API_BASE = runtimeBase;
}

// Constants from config.js (ported inline)
const LAYOUT = {
  centerX: 2000,
  centerY: 2000,
  nodeWidth: 200,
  nodeWidthRoot: 200,
  nodeWidthSection: 200,
  nodeHeight: 80,
  radiusLevel1: 350,
  radiusStep: 300,
  minFanAnglePerChild: 28,
  maxFanAngleTotal: 140,
  directions: [0, 60, 120, 180, 240, 300],
};

const CONNECTOR_MORPHOLOGY = {
  THICK_STRAIGHT: "thick_straight",
  THICK_CURVED: "thick_curved",
  THIN_STRAIGHT: "thin_straight",
  THIN_CURVED: "thin_curved",
};

const CANVAS_SCALE_MIN = 0.2;
const CANVAS_SCALE_MAX = 3;

const SUPER_AGENT_BURST_IDS = ["burst-1", "burst-2", "burst-3", "burst-4"];
const ALLOWED_DOC_TYPES = [".txt", ".pdf", ".docx"];

(function () {
  if (typeof window === "undefined") return;

  const state = {
    projectId: null,
    nodes: [],
    activeId: null,
    title: "AI Project",
    nodePositions: {},
    contextLinks: [],
    titled: {},
    fetchingTitle: {},
    lastMergeContent: null,
    lastMergeTitle: null,
    draftId: null,
    skillId: null,
    dialog: [],
    canvas: { x: 0, y: 0, scale: 1 },
    contextMenu: { visible: false, nodeId: null, materialId: null },
    superAgentRunning: false,
    superAgentAbortRequested: false,
    didDragThisSession: false,
    draggingNode: null,
    dragStart: null,
    isDragging: false,
    mouse: null,
    _contextLinkTimer: null,
    drawingContextLink: null,
    blankMenuCanvasPos: null,
    tipsCandidates: {},
    tipsLoading: {},
    webSearchForNodeId: null,
  };

  const dom = {
    chatView: document.getElementById("chat-view"),
    mindmapView: document.getElementById("mindmap-view"),
    topBar: document.getElementById("top-bar"),
    heroSection: document.getElementById("hero-section"),
    dropZone: document.getElementById("drop-zone"),
    fileInput: document.getElementById("drop-file-input"),
    chatHistory: document.getElementById("chat-history"),
    input: document.getElementById("initial-input"),
    startBtn: document.getElementById("start-btn"),
    canvasInner: document.getElementById("canvas-inner"),
    canvasContainer: document.getElementById("canvas-container"),
    projectTitle: document.getElementById("project-title-display"),
    progressText: document.getElementById("progress-text"),
    progressFill: document.getElementById("progress-fill"),
    toast: document.getElementById("toast"),
    toastText: document.getElementById("toast-text"),
    toastIcon: document.getElementById("toast-icon"),
    nodePanel: document.getElementById("node-panel"),
    activeNodeName: document.getElementById("active-node-name"),
    nodeInput: document.getElementById("node-input"),
    nodeSubmit: document.getElementById("node-submit"),
    contextMenu: document.getElementById("node-context-menu"),
    blankContextMenu: document.getElementById("blank-context-menu"),
    blankMenuImportMaterial: document.getElementById("blank-menu-import-material"),
    mergeBtn: document.getElementById("merge-btn"),
    superAgentBtn: document.getElementById("super-agent-btn"),
    superAgentExitBtn: document.getElementById("super-agent-exit-btn"),
    resultModal: document.getElementById("result-modal"),
    resultContent: document.getElementById("result-content"),
    questionFloat: document.getElementById("question-float"),
    questionFloatTitle: document.getElementById("question-float-title"),
    questionFloatText: document.getElementById("question-float-text"),
    questionFloatCard: document.getElementById("question-float-card"),
  };

  if (!dom.input || !dom.startBtn || !dom.canvasInner || !dom.mindmapView || !dom.chatView) {
    return;
  }

  let isSubmitting = false;
  let toastTimer = null;

  function apiJson(path, options) {
    const base = window.__API_BASE || runtimeBase;
    return fetch(base + path, {
      headers: {
        "Content-Type": "application/json",
        ...(options && options.headers ? options.headers : {}),
      },
      ...options,
    }).then(async function (res) {
      const data = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        const detail = data && data.detail.detail ? String(data.detail) : "request_failed";
        throw new Error(detail);
      }
      return data;
    });
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

.

  function showToast(message, type) {
    if (!dom.toast || !dom.toastText || !dom.toastIcon) return;
    const iconClass = type === "error" ? "fas fa-circle-xmark" : "fas fa-circle-check";
    const iconBg = type === "error" ? "var(--burnt)" : "var(--moss)";
    dom.toastText.textContent = message;
    dom.toastIcon.innerHTML = '<i class="' + iconClass + '" style="color:#fff"></i>';
    dom.toastIcon.style.background = iconBg;
    dom.toast.classList.remove("toast-retracted");
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(function () {
      dom.toast.classList.add("toast-retracted");
    }, 2200);
  }

  window.showToast = showToast;

  function appendChatBubble(role, content) {
    if (!dom.chatHistory) return;
    const wrapper = document.createElement("div");
    const isUser = role === "user";
    wrapper.className = "w-full flex " + (isUser ? "justify-end" : "justify-start");
    const bubble = document.createElement("div");
    bubble.className = "max-w-[min(68ch,80%)] px-4 py-3 text-sm font-semibold leading-relaxed solid-card";
    bubble.style.background = isUser ? "var(--cobalt)" : "var(--cream)";
    bubble.style.color = isUser ? "#fff" : "var(--text-primary)";
    bubble.innerHTML = escapeHtml(content).replace(/\n/g, "<br>");
    wrapper.appendChild(bubble);
    dom.chatHistory.appendChild(wrapper);
    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
  }

  function toggleSubmitting(flag) {
    isSubmitting = flag;
    dom.startBtn.disabled = flag;
    dom.startBtn.style.opacity = flag ? "0.7" : "1";
    dom.startBtn.innerHTML = flag
      ? '<i class="fas fa-spinner fa-spin text-xl"></i>'
      : '<i class="fas fa-chevron-right text-xl"></i>';
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result || "");
        const parts = result.split(",");
        if (parts.length < 2) {
          reject(new Error("invalid_file_data"));
          return;
        }
        resolve(parts[1]);
      };
      reader.onerror = function () {
        reject(new Error("file_read_failed"));
      };
      reader.readAsDataURL(file);
    });
  }

  async function readFileAsBase64(file) {
    return fileToBase64(file);
  }

  async function uploadAndParseDocument(file) {
    const content_base64 = await fileToBase64(file);
    const res = await apiJson("/api/parse-document", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, content_base64 }),
    });
    if (!res || !res.text) {
      throw new Error("parse_no_text_returned");
    }
    return res;
  }
