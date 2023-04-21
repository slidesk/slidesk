import { createServer } from "http";
import { WebSocketServer } from "ws";
import { readFile } from "fs";
import mime from "mime";
export default class Server {
  constructor(html, port, path) {
    this.html = html;
    this.path = path;
    this.io = [];
    const httpServer = createServer((req, res) => {
      if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write(this.html, "utf-8");
        res.end();
      } else if (req.url === "/favicon.svg") {
        res.writeHead(200, { "Content-Type": "image/svg+xml" });
        res.write(
          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m" /></svg>`
        );
        res.end();
      } else {
        const file = req.url.match(
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
        )
          ? req.url
          : `${this.path}${req.url}`;
        readFile(file, function (err, data) {
          if (err) {
            res.writeHead(404);
            return res.end("File not found.");
          }
          res.setHeader("Content-Type", mime.getType(file));
          res.writeHead(200);
          res.end(data);
        });
      }
    });
    const wss = new WebSocketServer({
      server: httpServer,
      perMessageDeflate: false,
    });
    wss.on("connection", (ws) => {
      this.io.push(ws);
    });
    httpServer.listen(port, () => console.log(`🎉 http://localhost:${port}`));
  }

  setHTML(html) {
    this.html = html;
    this.io.forEach((io) => {
      io.send("reload");
    });
  }
}
