# Create a deployment file

The `deploy` command generates CI/CD configuration files for publishing your presentation.

```sh
slidesk deploy -t github mytalk
slidesk deploy -t gitlab mytalk
slidesk deploy -t link mytalk
```

```
  -t, --target <param>      generate a deploy file for 'github', 'gitlab' or 'link' (slidesk.link)
```

## GitHub Pages

```sh
slidesk deploy -t github mytalk
```

This creates `.github/workflows/slidesk.yml` that uses the [SliDesk GitHub Action](https://github.com/marketplace/actions/slidesk-deploy) to build and deploy on every push to `main`.

## GitLab Pages

```sh
slidesk deploy -t gitlab mytalk
```

This creates a `.gitlab-ci.yml` that uses the official SliDesk CI component.

## slidesk.link

```sh
slidesk deploy -t link mytalk
```

Creates a `link.yml` metadata file for use with `slidesk link push`.

## See also

- [Deploy to GitHub Pages](/deploy/github)
- [Deploy to GitLab Pages](/deploy/gitlab)
