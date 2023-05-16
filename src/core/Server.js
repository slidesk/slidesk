import { createServer } from "http";
import { WebSocketServer } from "ws";
import { readFile } from "fs";
import mime from "mime";
import { speaker_view } from "#speaker_view";

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
          `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" style="shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd"><path fill="#fefefe" d="M-.5-.5h500v500H-.5V-.5Z" style="opacity:1"/><path fill="#030303" d="M228.5 192.5v5c-8.934.592-17.601-.075-26-2-1.121-4.377-3.788-7.544-8-9.5a4094.203 4094.203 0 0 0-128 0 20.236 20.236 0 0 0-7.5 7.5 169.242 169.242 0 0 0 0 26c1.5 4.167 4.333 7 8.5 8.5l127 1c18.144 3.141 29.644 13.641 34.5 31.5.667 9.667.667 19.333 0 29-3.558 19.559-15.058 31.059-34.5 34.5-43.667.667-87.333.667-131 0-16.993-4.493-27.327-15.326-31-32.5v-6h26c.187 6.687 3.52 10.854 10 12.5 41.667.667 83.333.667 125 0 4.167-1.5 7-4.333 8.5-8.5.667-9 .667-18 0-27-1.892-3.558-4.725-6.058-8.5-7.5l-132-1c-22.03-8.534-32.03-24.701-30-48.5-1.138-24.254 9.862-39.754 33-46.5 43.333-.667 86.667-.667 130 0 19.167 3.334 30.5 14.501 34 33.5Z" style="opacity:1"/><path fill="#323232" d="M420.5 159.5h-150v165a6891.114 6891.114 0 0 1-1-166c50.503-.332 100.836.001 151 1Z" style="opacity:1"/><path fill="#010101" d="M420.5 159.5c23.7 3.528 38.867 16.862 45.5 40a788.234 788.234 0 0 1 1 78c-4.843 26.176-20.343 41.676-46.5 46.5-49.999.5-99.999.667-150 .5v-165h150Z" style="opacity:1"/><path fill="#898989" d="M418.5 185.5h-122v112h122c-40.83.999-81.83 1.332-123 1v-114c41.17-.332 82.17.001 123 1Z" style="opacity:1"/><path fill="#fefefe" d="M418.5 185.5c10.623 1.783 17.789 7.783 21.5 18l.5 37.5c.14 13.566-.36 27.066-1.5 40.5-3.795 9.301-10.628 14.635-20.5 16h-122v-112h122Z" style="opacity:1"/><path fill="#545454" d="M228.5 192.5c.961 1.765 1.295 3.765 1 6h-27v-3c8.399 1.925 17.066 2.592 26 2v-5Z" style="opacity:1"/><path fill="#828282" d="M58.5 285.5h-26v6c-.968-2.107-1.302-4.441-1-7 9.182-.327 18.182.007 27 1Z" style="opacity:1"/></svg>`
        );
        res.end();
      } else if (req.url === "/notes") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write(
          speaker_view.replace(
            "#SOCKETS#",
            `window.slidesk.io = new WebSocket("ws://localhost:${port}");`
          ),
          "utf-8"
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

      ws.on("message", (data) => {
        this.io.forEach((io) => {
          io.send(JSON.stringify(JSON.parse(data)));
        });
      });
    });
    httpServer.listen(port, () =>
      console.log(`
📽️\thttp://localhost:${port}
📝\thttp://localhost:${port}/notes
`)
    );
  }

  setHTML(html) {
    this.html = html;
    this.io.forEach((io) => {
      io.send(JSON.stringify({ action: "reload" }));
    });
  }
}
