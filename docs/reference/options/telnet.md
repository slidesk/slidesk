# telnet

```
  -t, --telnet               serve a telnet version
```

Launches a telnet server alongside the HTTP server.

When TLS (`KEY` / `CERT`) is configured in `slidesk.toml`, the telnet server also serves over TLS for encrypted connections.

```sh
slidesk -t my-talk
telnet localhost 2323
```

Port configurable in `slidesk.toml`:

```toml
[slidesk]
TELNET_PORT=2323
```

Telnet controls:
- **Enter** / **right arrow** — next slide
- **Left arrow** — previous slide
- **Number + Enter** — go to slide
- **r** — reload presentation
- **q** — quit
