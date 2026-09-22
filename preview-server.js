"use strict";
// Loopback-only preview. Production is the existing GitHub Pages Jekyll build.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const manifest = require("./hosting-public-files.json");
const types = {".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"application/javascript", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml", ".webp":"image/webp", ".woff2":"font/woff2", ".txt":"text/plain; charset=utf-8", ".md":"text/plain; charset=utf-8", ".xml":"application/xml"};
const routeNames = manifest.routes;
const sourceFiles = new Set(manifest.sourceFiles);
const outputFiles = new Set(manifest.sourceFiles.flatMap(file => routeNames.includes(file.replace(/\.html$/, "")) ? [file, file.replace(/\.html$/, "/index.html")] : [file]));

function createPreviewServer({root = __dirname, built = false} = {}) {
  root = fs.realpathSync(root);
  return http.createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405, {Allow:"GET, HEAD"}).end(); return; }
    let url, pathname;
    try { url = new URL(req.url, "http://127.0.0.1"); pathname = decodeURIComponent(url.pathname); }
    catch { res.writeHead(400).end("Bad request"); return; }
    const name = pathname.replace(/^\/+|\/+$/g, "");
    const isPage = routeNames.includes(name) || name === "payment-return";
    if (isPage && !pathname.endsWith("/")) {
      res.writeHead(301, {Location:"/"+name+"/"+url.search}).end(); return;
    }
    if (!built && routeNames.includes(name.replace(/\.html$/, "")) && name.endsWith(".html")) {
      res.writeHead(301, {Location:"/"+name.replace(/\.html$/, "")+"/"+url.search}).end(); return;
    }
    let file = pathname === "/" ? "index.html" : name;
    if (pathname.endsWith("/") && name) file = built || name === "payment-return" ? name+"/index.html" : name+".html";
    if (!(built ? outputFiles : sourceFiles).has(file)) { res.writeHead(404).end("Not found"); return; }
    const candidate = path.resolve(root, file);
    try {
      const real = fs.realpathSync(candidate);
      if (!real.startsWith(root + path.sep) || !fs.statSync(real).isFile()) { res.writeHead(404).end("Not found"); return; }
      let body = fs.readFileSync(real);
      if (!built && file.endsWith(".html")) body = Buffer.from(body.toString("utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ""));
      res.writeHead(200, {"Content-Type":types[path.extname(file)] || "application/octet-stream", "Cache-Control":"no-store", "Content-Length":body.length});
      res.end(req.method === "HEAD" ? undefined : body);
    } catch { res.writeHead(404).end("Not found"); }
  });
}

if (require.main === module) {
  const builtRoot = process.env.CYTREA_PREVIEW_SITE_ROOT;
  createPreviewServer({root:builtRoot ? path.resolve(builtRoot) : __dirname, built:!!builtRoot})
    .listen(4173, "127.0.0.1", () => console.log("Local Cytrea preview at http://127.0.0.1:4173/"));
}
module.exports = {createPreviewServer};
