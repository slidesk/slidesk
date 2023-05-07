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
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="401.333" version="1.0" viewBox="0 0 300 301"><path d="M72.9 80c0 .3-.1 5.6-.1 11.9v11.4l18.4-.2 18.3-.2V215.2l14.3.2 14.2.1V102.8l18.5.4 18.5.3v-24h-51c-28 0-51 .2-51.1.5zm97.6 11.5v7l-15.8.5-15.9.5-2.4 2.8-2.4 2.8V211H114.3l-.7-53.8c-.7-51.7-.8-53.8-2.7-55.7-1.8-1.8-3.5-2-17.9-2.3l-16-.3v-6.8c0-3.7.3-7.1.7-7.4.3-.4 21.4-.6 46.7-.5l46.1.3v7z"/><path d="M146 163v52h22v-41.2l17.5.4 17.5.3V156h-35v-26h37.5l-.1-9.2-.2-9.3-29.6-.3-29.6-.2v52zm54.8-42.3-.3 4.8-16 .3c-21.1.3-20.5-.2-20.5 17.1 0 17.4-.3 17.1 18.6 17.1 15.7 0 16.8.4 16.2 6.2l-.3 3.3-15.3.5c-20.3.7-19.2-.6-19.2 21.9 0 9.1-.4 17.2-.9 17.9-.5.9-2.6 1.2-6.7 1l-5.9-.3-.3-47.3-.2-47.2h51.1l-.3 4.7z"/></svg>`
        );
        res.end();
      } else if (req.url === "/notes") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write(
          speaker_view.replace(
            "#SOCKETIO#",
            `window.talkflow.io = new WebSocket("ws://localhost:${port}");`
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
