const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = 4173;

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

http.createServer((req, res) => {
  const requestPath = (req.url || "/").split("?")[0];
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(root, relativePath);
  const extensionlessHtmlPath = path.resolve(root, `${relativePath}.html`);
  const directoryIndexPath = path.resolve(root, relativePath, "index.html");

  if (!resolvedPath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=UTF-8" });
    res.end("Forbidden");
    return;
  }

  const candidates = [resolvedPath];

  if (!path.extname(relativePath)) {
    candidates.push(extensionlessHtmlPath, directoryIndexPath);
  }

  const readCandidate = (index) => {
    const candidatePath = candidates[index];

    if (!candidatePath || !candidatePath.startsWith(root)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
      res.end("Not found");
      return;
    }

    fs.readFile(candidatePath, (error, content) => {
      if (error) {
        readCandidate(index + 1);
        return;
      }

      const extension = path.extname(candidatePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream"
      });
      res.end(content);
    });
  };

  readCandidate(0);
}).listen(port, "127.0.0.1", () => {
  console.log(`Preview server running at http://127.0.0.1:${port}`);
});
