# notes

```sh
-n, --notes [slug]       open with speakers notes
```

This option generates the speaker view in addition of your presentation.

Per default, notes view is accessible through /notes.html, but you can change it with the slug argument.

```sh
slidesk -n hidden-path
```


![speaker view](./_media/notes.png)

In the speaker view, you can view:

- the current slide
- the next slide
- a timer
- your notes

!!!warning
  When this option is active, you can't navigate directly in the presentation with keyboard. The speaker view controls the navigation.

Technically, communication between the "presentation" view and the "speaker" view takes place via a websocket.

This is done via a `window.slidesk.io` object available in the "presentation" and "speaker" pages.

Example of a call to the next slide:

```js
window.slidesk.io.send(JSON.stringify({ action: "next" }));
```

This JavaScript object enables developers to add additional functionality through plugins.


The time, a precious ressource for a speaker.

SliDesk allows you to check your time with two manners.

## Checkpoint

```
//@ < 35:00
```

This syntax in your `.sdf` defines a checkpoint. In this example, when your current slide is display after 35 minutes of the start of your presentation, the clock will be displayed with a red background.

## Duration

```
//@ [] 02:00
```

This syntax allow to display a new clock which the time you want. Here, a 2 minutes clock will be shown. After the time specified, this clock will have a red background, to warn you you reach the limits.

![timers](./_media/timers.png)
