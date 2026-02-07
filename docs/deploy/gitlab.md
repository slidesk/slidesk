# Deploy your slides on GitLab Pages

If your project is hosted in GitLab, you can use GitLab Pages to host your slide.

With a quickly configuration, your project have to be suffixed by `gitlab.io` and a GitLab CI job, for example `pages` have to initiate in your project to publish the result of `bunx slidesk`command:

```yaml
pages:
  image: gitpod/workspace-bun
  script:
    - bunx slidesk -s public <the directory of your slides>
  artifacts:
    paths:
      - public
  # This line allows you to only deploy your main branch, ie develop or main for example
  rules:
    - if: $CI_COMMIT_REF_NAME == $CI_DEFAULT_BRANCH

```

After running this job, your slide is available 🎉. To verify, you can go on the `Deploy > Pages` GitLab menu to see the url generated for your website.

_If you want to customize GitLab pages or get more information, you can refer to [this page](https://docs.gitlab.com/ee/user/project/pages/)._

#
