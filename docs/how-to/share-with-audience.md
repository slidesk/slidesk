# Let the audience follow on their phone

While you present, SliDesk serves your talk live: anyone who opens it follows your slides on their own screen, as you change them. Links can be clicked, code can be selected and copied, and the slide can be zoomed in from the back of the room.

Only you drive the talk. The audience can swipe back to a slide they missed; your next slide change brings them back to you.

## In the room

```sh
slidesk my-talk
```

The terminal prints the address of the presentation on your network:

```
Your presentation is available on: http://192.168.1.47:1337
```

Anyone on the same network (the venue's Wi-Fi, or your phone's hotspot) who opens it follows your slides.

## From anywhere

When the audience is not on your network, or watches remotely, host the talk on [slidesk.link](use-hub-slidesk-link.md) for 72 hours:

```sh
slidesk link host -n notes.html
```

Share the **Share with your audience** URL: it follows your slides from anywhere. Present from the **Present from** URL, and keep it and the **Speaker view** URL to yourself: they drive the talk.

## A QR code on a slide

Put the address on your first slide, so the room can scan it, with the [`@gouz/qrcode`](https://slidesk.link) plugin:

```sh
slidesk plugin install @gouz/qrcode
```

```markdown
## Follow along

<div class="sd-qrcode" data-url="https://your-hosted-url" style="width: 300px"></div>
```

The QR code printed in the terminal is the one of your speaker view: it drives the talk, do not show it.
