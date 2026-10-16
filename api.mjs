import { getStore } from "@netlify/blobs";
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
export default async (req) => {
  const store = getStore("mobiledekhao");
  const path = new URL(req.url).pathname.replace(/^\/api\/?/, "");
  const PW = process.env.ADMIN_PASSWORD;
  const authed = () => PW && req.headers.get("x-admin-password") === PW;
  if (path === "data" && req.method === "GET") {
    const d = await store.get("data", { type: "json" });
    return J(d ? { init: true, ...d } : { init: false });
  }
  if (path.startsWith("img/") && req.method === "GET") {
    const r = await store.getWithMetadata(path.slice(4), { type: "arrayBuffer" });
    if (!r) return new Response("Not found", { status: 404 });
    return new Response(r.data, { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000" } });
  }
  if (req.method !== "POST") return J({ error: "Bad request" }, 400);
  if (!PW) return J({ error: "Admin password not set. In Netlify add environment variable ADMIN_PASSWORD, then redeploy." }, 500);
  if (!authed()) return J({ error: "Wrong password" }, 401);
  if (path === "login") return J({ ok: true });
  if (path === "save") {
    const b = await req.json();
    await store.setJSON("data", { phones: b.phones || [], updates: b.updates || [] });
    return J({ ok: true });
  }
  if (path === "img") {
    const { data } = await req.json();
    const buf = Uint8Array.from(atob(String(data).split(",")[1]), c => c.charCodeAt(0));
    const id = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    await store.set(id, buf);
    return J({ url: "/api/img/" + id });
  }
  return J({ error: "Not found" }, 404);
};
export const config = { path: "/api/*" };
