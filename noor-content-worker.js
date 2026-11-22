const PROJECT_ID = "lp-store-23212";
const REPO = "yaseeninoor/lp-fm-ai";
const BRANCH = "main";
const ALLOWED_ORIGIN = "https://noor.yaseenis.com";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
function cors() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors() }
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
  const h = decodeJson(parts[0]), c = decodeJson(parts[1]);
  if (h.alg !== "RS256" || !h.kid) throw new Error("Unsupported login token.");
  if (c.aud !== PROJECT_ID || c.iss !== "https://securetoken.google.com/" + PROJECT_ID) throw new Error("Token belongs to another Firebase project.");
  if (!c.sub || !c.exp || c.exp <= Math.floor(Date.now() / 1000)) throw new Error("Login expired. Sign in again.");
  const kr = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  if (!kr.ok) throw new Error("Could not verify Firebase login.");
  const jwks = await kr.json(), jwk = (jwks.keys || []).find(k => k.kid === h.kid);
  if (!jwk) throw new Error("Login key not found. Sign in again.");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodePart(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!valid) throw new Error("Firebase login verification failed.");
  if (!(c.admin === true || c.superadmin === true || c.role === "admin" || c.role === "superadmin")) throw new Error("Admin or Super Admin access is required.");
  return c;
}
function safeName(name) {
  return String(name || "file").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "").slice(-100) || "file";
}
function base64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
async function uploadGithub(file, type, env) {
  if (!env.GITHUB_TOKEN) throw new Error("Cloudflare Worker secret GITHUB_TOKEN is not configured.");
  if (file.size > MAX_FILE_BYTES) throw new Error("GitHub upload limit is 20 MB per file.");
  const folder = type === "pdf" ? "pdf" : type === "text" ? "text" : "photos";
  const name = Date.now() + "-" + safeName(file.name);
  const path = "noor-media/" + folder + "/" + name;
  const response = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + env.GITHUB_TOKEN,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: "NOOR Portal: add " + name, content: base64(new Uint8Array(await file.arrayBuffer())), branch: BRANCH })
  });
  const result = await response.json();
  if (!response.ok) throw new Error("GitHub upload failed: " + (result.message || response.status));
  return { url: result.content?.download_url || "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH + "/" + path, path };
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/upload") return json({ error: "Not found" }, 404);
    try {
      const claims = await verifyAdmin(request, env);
      const form = await request.formData(), file = form.get("file"), type = String(form.get("type") || "");
      if (!(file instanceof File)) return json({ error: "Choose a file first." }, 400);
      if (!["pdf", "text", "image"].includes(type)) return json({ error: "Unsupported upload type." }, 400);
      if (type === "pdf" && file.type !== "application/pdf") return json({ error: "Please choose a PDF file." }, 400);
      if (type === "image" && !file.type.startsWith("image/")) return json({ error: "Please choose an image file." }, 400);
      if (type === "text" && !(file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name))) return json({ error: "Please choose a TXT or Markdown file." }, 400);
      if (!file.size) return json({ error: "The selected file is empty." }, 400);
      if (file.size > MAX_FILE_BYTES) return json({ error: "Maximum file size is 20 MB." }, 413);
      const saved = await uploadGithub(file, type, env);
      return json({ success: true, githubUrl: saved.url, githubPath: saved.path, uploadedBy: claims.sub }, 200);
    } catch (e) {
      return json({ error: e.message || "Upload failed." }, 400);
    }
  }
};
