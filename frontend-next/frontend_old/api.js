/**
 * 后端 API 请求封装（JSON、文档解析上传等）
 */
import { API_BASE } from "./config.js";

export async function apiJson(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    throw new Error("NETWORK: 无法连接后端，请确认已执行 uvicorn backend.main:app --reload");
  }
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const j = JSON.parse(text);
      detail = j.detail || (typeof j.detail === "string" ? j.detail : text);
    } catch (_) {}
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json();
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.indexOf(",") >= 0 ? dataUrl.split(",")[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadAndParseDocument(file) {
  const content_base64 = await readFileAsBase64(file);
  const res = await fetch(`${API_BASE}/api/parse-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, content_base64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail || res.statusText;
    throw new Error(detail);
  }
  return res.json();
}
