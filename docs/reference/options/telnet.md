# telnet

```
  -t, --telnet               serve a telnet version
```

Launches a telnet server alongside the HTTP server.

When TLS (`KEY` / `CERT`) is configured in `slidesk.toml`, the telnet server also serves over TLS for encrypted connections. A plain `telnet` client cannot connect then; use a TLS client instead, as printed at startup:

```sh
openssl s_client -quiet -connect localhost:2323
```

The telnet version follows your edits: a change to the talk shows up after pressing **r**.

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
