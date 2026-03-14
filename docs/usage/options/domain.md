# domain

```sh
  -d, --domain <string>    domain (default: "localhost")
```

Per default, SliDesk will serve your presentation through `http://localhost:1337`.

If you want to share your presentation and synchronize it to many devices, you will want to specify an IP or a domain.

This option is used for that.

```sh
slidesk -d 192.168.0.13
```

will create a server which display your presentation on `http://192.168.0.13:1337`
