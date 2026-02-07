# Use https://slidesk.link

Since 2.13.0, SliDesk can interract with the hub slidesk.link.

Three commands are avaiable:

## login

```bash
slidesk link login
```

This subcommand logs you and store the tocken in a `.slidesk` file in your home directory.

You have to create an account first to use it.


## host

```bash
slidesk link host -n mynotes.html
```

This command allows you to send your presentation (100 MB max) for 72h on slidesk.link

## push

```bash
slidesk link push
```

This command uses a `link.yml` file present in your directory, to add a talk and its sessions on your slidesk.link page.

`title` is mandatory

```yaml
title: Your title
abstract: |
  Your abstract
url: https://www.host.tld/path/to/your/slides
sessions:
  - date: 2025-03-12
    location: A nice meetup
    link: https://www.your-event.tld/path/to/your/program
    slides: https://your.hosted.slides.tld
    video: https://www.your-video-provider.tld/path/to/your/video
  - date: 2025-03-12
    location: Another nice meetup
    link: https://www.your-event.tld/path/to/your/program
    slides: https://your.hosted.slides.tld
    video: https://www.your-video-provider.tld/path/to/your/video
```
