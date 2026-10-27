# Use speaker notes

Write notes in Markdown between `/*` and `*/` in your slides:

```markdown
## My Slide

This text is shown to the public.

/*

This text is only for you — visible in the speaker view.

*/
```

Open the speaker view with:

```sh
slidesk -n my-talk
```

To open the speaker view on another device, such as your phone, use the URL
or scan the QR code printed in the terminal: it carries a token that lets the
speaker view drive the talk. Keep it to yourself.

Anyone else who opens the presentation on the network follows your slides but
cannot change them.

The speaker view shows:

- the current slide
- the next slide
- a timer
- your notes

## Checkpoints

Add checkpoints to track timing:

```
//@ < 35:00
```

When the current slide displays after 35 minutes, the clock turns red.

## Duration timers

Add a countdown timer:

```
//@ [] 02:00
```

After 2 minutes, the timer turns red.

## Telnet mode

Present from any terminal with telnet:

```sh
slidesk -t my-talk
```

Connect with:

```sh
telnet localhost 2323
```

Controls:

- **Enter**, **Space** or **right arrow** — next slide
- **Left arrow** or **Backspace** — previous slide
- **Number + Enter** — go to that slide (the number shows in the status bar as you type it)
- **r** — reload presentation
- **q** or **Ctrl-C** — quit

Combine both:

```sh
slidesk -tn my-talk
```
