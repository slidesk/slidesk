# Configuration

SliDesk uses a `slidesk.toml` file for presentation-level configuration. Values are accessible in plugins via `window.slidesk.env.KEY`, in slide content via `++KEY++`, and by SliDesk itself via the `[slidesk]` section.

```toml
[slidesk]
HTTPS=true
KEY="path/to/key.pem"
CERT="path/to/cert.pem"
PASSPHRASE="optional-passphrase"
WIDTH=1920
TITLE="My Presentation"
DOMAIN="slides.example.com"
PORT=1337
TRANSITION=300
WATCH=true
TELNET_PORT=2323
COMMON_DIR="path/to/common"
```

## HTTPS

Enable HTTPS. Requires `KEY` and `CERT`.

```toml
[slidesk]
HTTPS=true
KEY="./certs/key.pem"
CERT="./certs/cert.pem"
```

## KEY

Path to the TLS certificate key file.

## CERT

Path to the TLS certificate file.

## PASSPHRASE

Passphrase for the TLS key (if required).

## WIDTH

Used for responsive image resizing. Images are scaled relative to this original presentation width.

```toml
[slidesk]
WIDTH=1920
```

## TITLE

Content of the HTML `<title>` tag.

```toml
[slidesk]
TITLE="My Conference Talk"
```

## DOMAIN

Override the domain used in server URLs. Default: `localhost`.

```toml
[slidesk]
DOMAIN="192.168.1.42"
```

## PORT

HTTP server port. Default: `1337`.

```toml
[slidesk]
PORT=8080
```

## TRANSITION

Slide transition animation duration in milliseconds. Default: `300`. Set to `0` to disable.

```toml
[slidesk]
TRANSITION=500
```

## WATCH

Enable or disable the file watcher. When enabled (default), editing a file triggers an automatic browser refresh.

```toml
[slidesk]
WATCH=false
```

## TELNET_PORT

Port for the telnet server. Default: `2323`.

```toml
[slidesk]
TELNET_PORT=2323
```

## COMMON_DIR

Path to a shared directory for reusing themes, plugins, and assets across multiple presentations.

```toml
[slidesk]
COMMON_DIR="/home/user/slidesk-common"
```

Files in `COMMON_DIR` can be referenced with the `-=[COMMON]=-` prefix:

```
/::
add_styles: -=[COMMON]=-/theme/custom.css
::/

!image(-=[COMMON]=-/assets/logo.png)
```

## Custom keys

Any key under `[slidesk]` is accessible as an environment variable:

```toml
[slidesk]
MY_CUSTOM_KEY="hello-world"
```

In slide content: `++MY_CUSTOM_KEY++` renders as `hello-world`.
In plugins: `window.slidesk.env.MY_CUSTOM_KEY` returns `"hello-world"`.
