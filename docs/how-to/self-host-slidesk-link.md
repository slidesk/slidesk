# Host your own slidesk.link

[slidesk.link](https://slidesk.link) is open source: run your own hub to keep your addons, hosted presentations and talks inside your company. Its sources are at [slidesk/slidesk.link](https://github.com/slidesk/slidesk.link).

## Create a GitHub OAuth app

Users log in with GitHub. Create an [OAuth app](https://github.com/settings/applications/new) with:

- **Homepage URL**: the public URL of your hub, for instance `https://hub.example.com`
- **Authorization callback URL**: `https://hub.example.com/login/github/authorized`

Keep its client ID and generate a client secret.

## Configure

The hub reads its configuration from the environment, or from a `.env` file:

| Variable | |
|---|---|
| `HOST` | the public URL of the hub, without a trailing slash. Unset, the hub runs as `http://localhost:3000` for development |
| `GITHUB_OAUTH_CLIENT_ID` | the client ID of the OAuth app |
| `GITHUB_OAUTH_CLIENT_SECRET` | its client secret |
| `JWT_SECRET` | a long random string signing the sessions, required once `HOST` is set (`openssl rand -hex 32`) |
| `DATABASE_PATH` | the sqlite file, `./app/dev.db` by default |

The sqlite database is created and migrated when the hub starts.

## Run with Docker

The image is [`gouz/slidesk-link`](https://hub.docker.com/r/gouz/slidesk-link), for `amd64` and `arm64`. It listens on port 3000 and keeps the addons, presentations and database in `/usr/src/app/app`: put it on a volume.

```sh
docker run -d --name slidesk-link \
  -p 3000:3000 \
  --env-file .env \
  -v slidesk-link-data:/usr/src/app/app \
  gouz/slidesk-link:latest
```

Serve it behind a reverse proxy with HTTPS on the `HOST` URL.

## Run with Bun

```sh
git clone https://github.com/slidesk/slidesk.link.git
cd slidesk.link
bun install
bun run build
bun dist-server/index.js
```

## Use it from SliDesk

Every `link` and addon command takes `--slidesk-link-url`:

```sh
slidesk link login --slidesk-link-url https://hub.example.com
slidesk link host --slidesk-link-url https://hub.example.com
slidesk plugin install @author/name --slidesk-link-url https://hub.example.com
slidesk update --slidesk-link-url https://hub.example.com
```

SliDesk keeps a single token, in `~/.slidesk`: log in again with `slidesk link login --force` when you switch between slidesk.link and your hub.
