# Use the hub (slidesk.link)

The hub at https://slidesk.link lets you share and discover addons, host presentations, and manage your talks.

## Login

```sh
slidesk link login
```

Creates an account and stores a token in `~/.slidesk`.

## Host a presentation

Send your presentation to slidesk.link for 72 hours (max 100 MB):

```sh
slidesk link host -n mynotes.html
```

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
