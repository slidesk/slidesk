# present

The default command. Converts your `.(sdf|md)` files into a web presentation and launches an HTTP server with WebSocket live reload.

```sh
slidesk my-talk
```

SliDesk watches the talk directory for file changes and automatically refreshes the browser.

When the server starts, a QR code is displayed in the terminal pointing to the presentation URL for easy access from mobile devices.

## Options

```sh
slidesk -n my-talk          # also open speaker notes view
slidesk -o my-talk          # auto-open browser
slidesk -tn my-talk         # telnet + speaker notes
slidesk -g my-talk          # hide terminal help info
slidesk -c custom.toml      # use custom config file
slidesk -l fr my-talk       # present in French
```

## Terminal navigation

```
Press Enter          next slide
Press P + Enter      previous slide
Press Q + Enter      quit
Type a number        jump to that slide
```

`Ctrl-C` and `Ctrl-D` quit too. Quitting stops the server and the telnet server, so the port is free for the next run.

## Browser navigation

| Key | Action |
|-----|--------|
| Right arrow, Page Down, Space | Next slide |
| Left arrow, Page Up | Previous slide |
| Home / End | First / last slide |
| b or . | Black screen, press again to come back |
| f | Toggle fullscreen |
| Esc | Exit fullscreen |

Swipe gestures are supported on touch devices.

In the speaker view, the same keys drive the presentation, except **f**, which only acts on its own window, and the **up/down arrows** scroll the notes.

The keys do nothing while you type in a field, and the shortcuts with Cmd, Ctrl or Alt are left to the browser. A held key moves one slide only. The [keyboard plugin](https://github.com/slidesk/extras/tree/main/plugins/keyboard) can bind other keys, or take over these ones, with a `keyboard.json` file.

The talk is served to everyone who can reach your machine. Hidden files and directories (`.git`, `.env`…), `.toml` files, `.pem` and `.key` files, and the `KEY` and `CERT` files of the configuration are never served.
