import http from "http";

export default function Server(html, port) {
  var server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write(html, "utf-8");
    res.end();
  });
  server.listen(port, () => console.log(`🎉 http://localhost:${port}`));
}
