# Deploy your slides on GitHub Pages

If your project is hosted in GitHub, you can use GitHub Pages to host your slide.

You can use the [official SliDesk GitHub Action](https://github.com/marketplace/actions/slidesk-deploy) to build and deploy your slides on GitHub Pages.

```yaml title="Sample action workflow"
name: Deploy with Slidesk
on:
  push:
    branches: [ "main" ]

## Very important
permissions:
  contents: read
  pages: write       # required by deploy-pages
  id-token: write    # required by deploy-pages

jobs:
  slidesk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build & Deploy
        uses: yodamad-actions/slidesk@1.1.0
```
