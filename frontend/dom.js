/**
 * 集中管理 DOM 引用，避免在 main 中散落 getElementById
 */
export const topBar = document.getElementById("top-bar");
export const projectTitleDisplay = document.getElementById("project-title-display");
export const progressText = document.getElementById("progress-text");
export const progressFill = document.getElementById("progress-fill");
export const mergeBtn = document.getElementById("merge-btn");
export const superAgentBtn = document.getElementById("super-agent-btn");
export const superAgentBtnText = document.getElementById("super-agent-btn-text");

export const heroSection = document.getElementById("hero-section");
export const chatHistory = document.getElementById("chat-history");
export const dropZone = document.getElementById("drop-zone");
export const dropFileInput = document.getElementById("drop-file-input");
export const initialInput = document.getElementById("initial-input");
export const startBtn = document.getElementById("start-btn");

export const chatView = document.getElementById("chat-view");
export const mindmapView = document.getElementById("mindmap-view");
export const canvasContainer = document.getElementById("canvas-container");
export const canvasInner = document.getElementById("canvas-inner");

export const nodePanel = document.getElementById("node-panel");
export const activeNodeName = document.getElementById("active-node-name");
export const nodeInput = document.getElementById("node-input");
export const nodeSubmit = document.getElementById("node-submit");

export const questionFloat = document.getElementById("question-float");
export const questionFloatTitle = document.getElementById("question-float-title");
export const questionFloatText = document.getElementById("question-float-text");
export const questionFloatCard = document.getElementById("question-float-card");

export const toastEl = document.getElementById("toast");
export const toastIcon = document.getElementById("toast-icon");
export const toastText = document.getElementById("toast-text");
export const skillSelect = document.getElementById("skill-select");

export const superAgentCenterOverlay = document.getElementById("super-agent-center-overlay");
export const superAgentProgressText = document.getElementById("super-agent-progress-text");
export const superAgentDetail = document.getElementById("super-agent-detail");
export const superAgentEtaText = document.getElementById("super-agent-eta-text");

export const resultModal = document.getElementById("result-modal");
export const resultContent = document.getElementById("result-content");
export const contextMenu = document.getElementById("node-context-menu");
export const contextMenuButtons = contextMenu
  ? Array.from(contextMenu.querySelectorAll("button[data-action]"))
  : [];
export const webSearchPanel = document.getElementById("web-search-panel");
export const webSearchPanelIntro = document.getElementById("web-search-panel-intro");
export const webSearchPanelList = document.getElementById("web-search-panel-list");
export const webSearchPanelClose = document.getElementById("web-search-panel-close");
