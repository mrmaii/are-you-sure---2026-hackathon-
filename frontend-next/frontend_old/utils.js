/**
 * 通用工具（Toast、转义、节点短标题等）
 */
import { toastEl, toastText, toastIcon } from "./dom.js";

export function showToast(text, type) {
  if (!toastEl || !toastText || !toastIcon) return;
  toastText.innerText = text;
  toastIcon.className = `w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
    type === "green" ? "bg-[#34A853]" : type === "red" ? "bg-[#EA4335]" : "bg-[#4285F4]"
  }`;
  toastIcon.innerHTML = `<i class="fas fa-${
    type === "green" ? "check" : type === "red" ? "exclamation" : "info"
  }"></i>`;
  toastEl.classList.remove("toast-retracted");
  toastEl.classList.remove("-translate-y-full");
  toastEl.classList.add("translate-y-0");
  const t = setTimeout(() => {
    toastEl.classList.remove("translate-y-0");
    toastEl.classList.add("-translate-y-full");
    toastEl.ontransitionend = () => {
      toastEl.classList.add("toast-retracted");
      toastEl.ontransitionend = null;
    };
  }, 3000);
  if (toastEl._toastTimer) clearTimeout(toastEl._toastTimer);
  toastEl._toastTimer = t;
}

export function escapeHtml(s) {
  if (s == null) return "";
  const t = String(s);
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getNodeShortTitle(node) {
  if (!node) return "";
  const t = (node.title || "").trim();
  if (t) return t;
  const q = (node.question || "").trim();
  if (q.length <= 12) return q;
  return q.slice(0, 10) + "…";
}
