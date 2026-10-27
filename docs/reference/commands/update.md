# update

Update the addons of your talk installed from [slidesk.link](https://slidesk.link).

```sh
slidesk update              # plugins, components, themes and templates
slidesk update plugins
slidesk update components
slidesk update themes
slidesk update templates
```

Run it from the directory of your talk. An addon comes from the hub when its name is `user__addon`: a directory in `plugins/`, `themes/` or `templates/`, or a `components/user__addon.mjs` file. The addons you wrote yourself are left as they are.

An addon that cannot be updated is reported, the others are updated anyway, and the command then exits with an error.

A component installed by an older SliDesk is a bare `components/addon.mjs`, without its author: install it again once with `slidesk component install user/addon`, and `slidesk update` picks it up from then on.
