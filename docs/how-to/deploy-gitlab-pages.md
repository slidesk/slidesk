# Deploy to GitLab Pages

Generate the pipeline:

```sh
slidesk deploy -t gitlab my-talk
```

It writes `.gitlab-ci.yml`, whose `pages` job installs SliDesk, saves the talk and publishes it on each push to the default branch. After the job completes, your slides are available under `Deploy > Pages` in your GitLab project.

## A talk in several languages

The talk is published in its default language at the root of the site, and once per `XX.lang.json` in a sub-folder: `…/en/`, `…/fr/`.

## Addons installed from git

An addon [installed from git](manage-addons.md#install-from-a-git-repository) and not committed with the talk is installed by the job before the build: uncomment the lines and list the addons, with their version.

```yaml
    - apt-get update -qq && apt-get install -qq -y git
    - git config --global url."https://oauth2:${ADDONS_TOKEN}@gitlab.com/".insteadOf "https://gitlab.com/"
    - slidesk theme install https://gitlab.com/someone/my-theme.git#v1.2.0
```

For a private repository, create a token that can read it (a project or personal access token with `read_repository`) and save it as the masked `ADDONS_TOKEN` CI/CD variable of the talk's project. The `git config` line is not needed for public addons.
