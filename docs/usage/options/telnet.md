# Telnet

```
  -t, --telnet               serve a telnet version
```

This option launches a telnet server alongside the HTTP server, allowing you to present directly from a terminal.

```sh
slidesk -t my-talk
```

Then connect with any telnet client:

```sh
telnet localhost 2323
```

You can change the telnet port in `slidesk.toml`:

```toml
[slidesk]
TELNET_PORT=2323
```

Once connected, use these keys in the telnet session:
- **Enter** or **right arrow** — next slide
- **Left arrow** — previous slide
- **Number + Enter** — go to a specific slide
- **r** — reload presentation
- **q** — quit

Combine with `-n` for speaker notes while the telnet session runs independently:

```sh
slidesk -tn my-talk
```
