import { createServer } from "http";
import { Server as WSServer } from "socket.io";
export default class Server {
  constructor(html, port) {
    this.html = html;
    const httpServer = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write(this.html, "utf-8");
      res.end();
    });
    this.io = new WSServer(httpServer);
    this.io.on("connection", () => {
      console.log("🤝 new client");
    });
    httpServer.listen(port, () => console.log(`🎉 http://localhost:${port}`));
  }

  setHTML(html) {
    this.html = html;
    this.io.emit("reload");
  }
}
