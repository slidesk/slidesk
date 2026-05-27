# present

The default command. Converts your `.(sdf|md)` files into a web presentation and launches an HTTP server with WebSocket live reload.

```sh
slidesk my-talk
```

SliDesk watches the talk directory for file changes and automatically refreshes the browser.

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
Press Q              quit
Type a number        jump to that slide
```

## Browser navigation

| Key | Action |
|-----|--------|
| Right / Down arrow | Next slide |
| Left / Up arrow | Previous slide |
| Number + Enter | Go to slide |
| f | Toggle fullscreen |
| Esc | Exit fullscreen |

Swipe gestures are supported on touch devices.
