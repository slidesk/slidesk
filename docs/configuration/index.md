# Configuration of SliDesk

SliDesk uses a `slidesk.toml` file to be configured for your presentation.

This file can be used for plugins (values are readable in an object `window.slidesk.env`) or presentation (values are readable with the syntax `++KEY++`).

```toml
[slidesk]
HTTPS=true
KEY=""
CERT=""
PASSPHRASE=""
WIDTH=1920
TITLE="This is my Title tag"
DOMAIN="localhost"
PORT=1337
TRANSITION=300
WATCH=true
```

## HTTPS

If this key is set to "true", you'll need to specify the "KEY", "CERT", and optionaly the "PASSPHRASE".

Then you can browse your presentation with https.

## KEY

The path of the certificat key file.

## CERT

The path of the certificat cert file.

## PASSPHRASE

The passphrase if needed.

## WIDTH

This parameter is used for responsive design. If this value is specified, then images are recalculated to fit the ratio with this original width of the presentation.

## TITLE

You can specify a title that will be displayed at the title tag.

## DOMAIN

You can specify a domain to use instead of "localhost"

## PORT

You can change the default port

## TRANSITION

You can specify the duration of animation

## WATCH

You can disable the watcher. Per default, SliDesk watchs the changement of files in the talk directory, then it refreshs the presentation.
