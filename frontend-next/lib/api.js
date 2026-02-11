async function apiJson(path, options) {
  const base = window.__API_BASE || (typeof window !== "undefined" && window.__API_BASE) || "http://localhost:8000";
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
      const detail = data && data.detail ? String(data.detail) : "request_failed";
      throw new Error(detail);
    }
    return data;
  });
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

export { apiJson, readFileAsBase64, uploadAndParseDocument };
