# Going further

## Telnet mode

Present from any terminal via telnet:

```sh
slidesk -t my-talk
```

Then connect:

```sh
telnet localhost 2323
```

Combine with speaker notes:

```sh
slidesk -tn my-talk
```

See the [telnet how-to](/how-to/use-speaker-notes) for all commands.

## Internationalisation

Create `XX.lang.json` files for multi-language support:

```json
{
  "default": true,
  "translations": {
    "greeting": "Hello"
  }
}
```

Use `$$greeting$$` in your slides and switch languages with `--lang`:

```sh
slidesk -l fr my-talk
```

## Export static HTML

Export your presentation as a standalone static site:

```sh
slidesk save -t public my-talk
```

See [export static site](/how-to/export-static-site).

## Deploy

Deploy to GitHub Pages or GitLab Pages:

```sh
slidesk deploy -t github my-talk
slidesk deploy -t gitlab my-talk
```

See [deploy to GitHub Pages](/how-to/deploy-github-pages) or [deploy to GitLab Pages](/how-to/deploy-gitlab-pages).
