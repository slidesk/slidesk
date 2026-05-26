# Present a talk

This is the default command. It converts your `.(sdf|md)` files into a web presentation and launches an HTTP server with WebSocket live reload.

```sh
slidesk my-talk
```

or just

```sh
slidesk 
```

if you are in the talk folder

SliDesk watches your talk directory for file changes and automatically refreshes the browser.

## Options

```sh
slidesk -n my-talk          # also open speaker notes view
slidesk -o my-talk          # auto-open browser
slidesk -tn my-talk         # telnet + speaker notes
slidesk -g my-talk          # hide terminal help info
slidesk -c custom.toml my-talk  # use custom config file
slidesk -l fr my-talk       # present in French (if translations exist)
```

## Terminal navigation

While the presentation is running, control it from the terminal:

```
 ____(•)-
(SliDesk) v 2.16.5

Take the control of your presentation direct from here.

Press Enter to go to the next slide.
Press P + Enter to go to the previous slide.
Press Q to quit the program.
```

You can also type a number and press Enter to jump directly to that slide.

## Browser navigation

In the browser:

| Key | Action |
|-----|--------|
| Right arrow / Down arrow | Next slide |
| Left arrow / Up arrow | Previous slide |
| Number + Enter | Go to slide number |
| f | Toggle fullscreen |
| Esc | Exit fullscreen |

Swipe gestures are also supported on touch devices.
