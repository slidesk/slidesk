import http from "http";

export default class Server {
  constructor(html, port) {
    this.html = html;
    var server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write(this.html, "utf-8");
      res.end();
    });
    server.listen(port, () => console.log(`🎉 http://localhost:${port}`));
  }

  setHTML(html) {
    this.html = html;
  }
}
