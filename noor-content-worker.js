const PROJECT_ID = "lp-store-23212";
const REPO = "yaseeninoor/lp-fm-ai";
const BRANCH = "main";
const ALLOWED_ORIGIN = "https://noor.yaseenis.com";
const MAX_GITHUB_BYTES = 20 * 1024 * 1024;
const MAX_TELEGRAM_BYTES = 20 * 1024 * 1024;

function cors(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) }
  });
}
function decodePart(value) {
  const s = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = s + "=".repeat((4 - s.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodePart(value)));
}
async function verifyAdmin(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("Admin login token is missing.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid Firebase login token.");
  const headerData = decodeJson(parts[0]);
  const claims = decodeJson(parts[1]);
  if (headerData.alg !== "RS256" || !headerData.kid) throw new Error("Unsupported login token.");
  if (claims.aud !== PROJECT_ID || claims.iss !== "https://securetoken.google.com/" + PROJECT_ID) throw new Error("This token belongs to another Firebase project.");
  if (!claims.sub || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) throw new Error("Login expired. Sign in again.");
  const keysResponse = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  if (!keysResponse.ok) throw new Error("Could not verify Firebase login.");
  const keys = await keysResponse.json();
  const jwk = (keys.keys || []).find(k => k.kid === headerData.kid);
  if (!jwk) throw new Error("Login key not found. Sign in again.");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodePart(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!valid) throw new Error("Firebase login verification failed.");
  const isAdmin = claims.admin === true || claims.superadmin === true || claims.role === "admin" || claims.role === "superadmin";
  if (!isAdmin) throw new Error("Admin or Super Admin access is required.");
  return claims;
}
function safeName(name) {
  return String(name || "file").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "").slice(-100) || "file";
}
function base64(bytes) {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}
async function uploadGithub(file, type, env) {
  if (!env.GITHUB_TOKEN) throw new Error("Cloudflare secret GITHUB_TOKEN is not configured.");
  if (file.size > MAX_GITHUB_BYTES) throw new Error("GitHub upload limit for this portal is 20 MB per file.");
  const folder = type === "pdf" ? "pdf" : type === "text" ? "text" : "photos";
  const name = Date.now() + "-" + safeName(file.name);
  const path = "noor-media/" + folder + "/" + name;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const response = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + env.GITHUB_TOKEN,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "NOOR Portal: add " + name,
      content: base64(bytes),
      branch: BRANCH
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error("GitHub upload failed: " + (result.message || response.status));
  return {
    url: result.content && result.content.download_url ? result.content.download_url : "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH + "/" + path,
    path: path,
    name: name
  };
}
async function uploadTelegram(file, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) throw new Error("Telegram secrets TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not configured.");
  if (file.size > MAX_TELEGRAM_BYTES) throw new Error("Telegram upload limit for this portal is 20 MB per file.");
  const form = new FormData();
  form.append("chat_id", env.TELEGRAM_CHAT_ID);
  form.append("document", file, file.name);
  const response = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendDocument", { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok || !result.ok || !result.result || !result.result.document) {
    throw new Error("Telegram upload failed: " + (result.description || response.status));
  }
  return { fileId: result.result.document.file_id, messageId: result.result.message_id };
}
async function telegramFile(fileId, env, origin) {
  if (!env.TELEGRAM_BOT_TOKEN) return new Response("Telegram is not configured.", { status: 503, headers: cors(origin) });
  const infoResponse = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/getFile?file_id=" + encodeURIComponent(fileId));
  const info = await infoResponse.json();
  if (!info.ok || !info.result || !info.result.file_path) return new Response("Telegram file not found.", { status: 404, headers: cors(origin) });
  const fileResponse = await fetch("https://api.telegram.org/file/bot" + env.TELEGRAM_BOT_TOKEN + "/" + info.result.file_path);
  if (!fileResponse.ok) return new Response("Telegram download failed.", { status: 502, headers: cors(origin) });
  const headers = new Headers(cors(origin));
  headers.set("Content-Type", fileResponse.headers.get("Content-Type") || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("Content-Disposition", "inline");
  return new Response(fileResponse.body, { status: 200, headers: headers });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/telegram/")) {
      const fileId = decodeURIComponent(url.pathname.slice("/telegram/".length));
      if (!fileId || fileId.length > 2048) return new Response("Invalid file id.", { status: 400, headers: cors(origin) });
      return telegramFile(fileId, env, origin);
    }
    if (request.method !== "POST" || url.pathname !== "/upload") return json({ error: "Not found" }, 404, origin);
    try {
      const claims = await verifyAdmin(request, env);
      const form = await request.formData();
      const file = form.get("file");
      const type = String(form.get("type") || "");
      const photoTarget = String(form.get("photoTarget") || "github");
      if (!(file instanceof File)) return json({ error: "Choose a file first." }, 400, origin);
      if (!["pdf", "text", "image"].includes(type)) return json({ error: "Unsupported upload type." }, 400, origin);
      if (type === "pdf" && file.type !== "application/pdf") return json({ error: "Please choose a PDF file." }, 400, origin);
      if (type === "image" && !file.type.startsWith("image/")) return json({ error: "Please choose an image file." }, 400, origin);
      if (type === "text" && !(file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name))) return json({ error: "Please choose a TXT or Markdown file." }, 400, origin);
      if (type === "image" && !["github", "telegram", "both"].includes(photoTarget)) return json({ error: "Choose a photo destination." }, 400, origin);
      if (file.size < 1) return json({ error: "The selected file is empty." }, 400, origin);
      if (file.size > MAX_GITHUB_BYTES && (type !== "image" || photoTarget !== "telegram")) return json({ error: "GitHub file limit is 20 MB." }, 413, origin);
      let github = null, telegram = null, warnings = [];
      if (type !== "image" || photoTarget === "github" || photoTarget === "both") {
        try { github = await uploadGithub(file, type, env); }
        catch (e) { if (type !== "image" || photoTarget === "github") throw e; warnings.push(e.message); }
      }
      if (type === "image" && (photoTarget === "telegram" || photoTarget === "both")) {
        try { telegram = await uploadTelegram(file, env); }
        catch (e) { if (photoTarget === "telegram") throw e; warnings.push(e.message); }
      }
      if (!github && !telegram) throw new Error(warnings.join(" "));
      return json({
        success: true,
        githubUrl: github ? github.url : "",
        githubPath: github ? github.path : "",
        telegramFileId: telegram ? telegram.fileId : "",
        telegramProxyUrl: telegram ? url.origin + "/telegram/" + encodeURIComponent(telegram.fileId) : "",
        warnings: warnings,
        uploadedBy: claims.sub
      }, 200, origin);
    } catch (e) {
      return json({ error: e.message || "Upload failed." }, 400, origin);
    }
  }
};
