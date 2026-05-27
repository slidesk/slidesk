# Deploy to GitLab Pages

Use the [official SliDesk GitLab CI component](https://gitlab.com/explore/catalog/fun_with/fun-with-gitlab/components/slidesk).

```yaml title=".gitlab-ci.yml"
stages:
  - deploy

include:
  - component: $CI_SERVER_FQDN/fun_with/fun-with-gitlab/components/slidesk/slidesk@1.1.0
```

After the job completes, your slides are available under `Deploy > Pages` in your GitLab project.

You can also generate this file automatically:

```sh
slidesk deploy -t gitlab my-talk
```
