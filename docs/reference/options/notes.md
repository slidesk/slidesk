# notes

```
  -n, --notes [slug]       open with speaker notes
```

Generates the speaker view alongside your presentation. Default URL is `/notes.html`, customisable with the slug argument.

```sh
slidesk -n my-talk
slidesk -n hidden-path my-talk
```

The speaker view shows the current slide, next slide, a timer, and your notes.

When active, keyboard navigation works from the speaker view, not the presentation.

Communication between views happens via `window.slidesk.io`:

```js
window.slidesk.io.send(JSON.stringify({ action: "next" }));
```

## Checkpoints

```
//@ < 35:00
```

Turns the clock red after the specified time.

## Duration timers

```
//@ [] 02:00
```

Shows a countdown clock that turns red when time is up.
