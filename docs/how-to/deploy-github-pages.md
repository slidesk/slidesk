# Deploy to GitHub Pages

Generate the workflow, then in the settings of the repository, choose **GitHub Actions** as the source of **Pages**:

```sh
slidesk deploy -t github my-talk
```

It writes `.github/workflows/slidesk.yml`, which installs SliDesk, saves the talk and publishes it on each push to `main`.

## A talk in several languages

The talk is published in its default language at the root of the site, and once per `XX.lang.json` in a sub-folder: `https://<user>.github.io/<repo>/en/`, `…/fr/`.

## Addons installed from git

An addon [installed from git](manage-addons.md#install-from-a-git-repository) and not committed with the talk is installed by the workflow before the build: uncomment the **Install the addons** step and list them, with their version.

```yaml
      - name: Install the addons
        run: |
          git config --global url."https://x-access-token:${{ secrets.ADDONS_TOKEN }}@github.com/".insteadOf "https://github.com/"
          slidesk theme install https://github.com/someone/my-theme.git#v1.2.0
```

For a private repository, create a token that can read it (a fine-grained token with **Contents: read**) and save it as the `ADDONS_TOKEN` secret of the talk's repository. The `git config` line is not needed for public addons.
