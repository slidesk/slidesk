# Deploy to GitHub Pages

Use the [official SliDesk GitHub Action](https://github.com/marketplace/actions/slidesk-deploy) to build and deploy your slides.

```yaml title=".github/workflows/slidesk.yml"
name: Deploy with Slidesk
on:
  push:
    branches: [ "main" ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  slidesk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & Deploy
        uses: yodamad-actions/slidesk@1.1.0
```

You can also generate this file automatically:

```sh
slidesk deploy -t github my-talk
```
