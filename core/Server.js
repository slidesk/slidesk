const http = require("http");

const port = 1337;

function Server(html) {
  var server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write(html, "utf-8");
    res.end();
  });
  server.listen(port, () => console.log(`🎉 http://localhost:${port}`));
}

module.exports = Server;
