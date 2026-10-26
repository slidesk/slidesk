# Use the hub (slidesk.link)

The hub at https://slidesk.link lets you share and discover addons, host presentations, and manage your talks.

## Login

```sh
slidesk link login
```

Creates an account and stores a token in `~/.slidesk`. The browser hands the
token back to the CLI on port 1337, or on a free port when 1337 is taken (for
instance by a running presentation). The command ends once the browser tab
reports it is done.

## Host a presentation

Send your presentation to slidesk.link for 72 hours (max 100 MB):

```sh
slidesk link host -n mynotes.html
```

The command prints three URLs:

- **Share with your audience**: the presentation, which follows your slides
- **Present from** and **Speaker view**: the same pages with a token that lets
  them drive the talk. Keep them to yourself.

## Push talk metadata

Use a `link.yml` file to publish your talk and its sessions:

```yaml
title: Your title
abstract: |
  Your abstract
url: https://your.hosted.slides
sessions:
  - date: 2025-03-12
    location: A nice meetup
    link: https://event.url
    slides: https://your.slides
    video: https://video.url
```

Then push:

```sh
slidesk link push
```
