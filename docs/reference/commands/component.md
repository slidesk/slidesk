# component

Manage components.

```sh
slidesk component search qrcode
slidesk component install @gouz/qrcode
slidesk component install https://github.com/someone/my-component.git
slidesk component update @gouz/qrcode
slidesk component remove @gouz/qrcode
slidesk component push my-component
```

An installed component is saved as `components/user__name.mjs`, so that [`slidesk update`](update.md) knows where it comes from.

An addon installs from the hub (`@user/name`) or from its git repository: see [Install from a git repository](../../how-to/manage-addons.md#install-from-a-git-repository).
