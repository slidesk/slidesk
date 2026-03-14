# Deploy your slides on GitLab Pages

If your project is hosted in GitLab, you can use GitLab Pages to host your slide.

You can use the [official SliDesk GitLab CI component](https://gitlab.com/explore/catalog/fun_with/fun-with-gitlab/components/slidesk) to build and deploy your slides on GitLab Pages.

```yaml title="Sample GitLab CI template"
stages:
  - deploy

include:
 - component: $CI_SERVER_FQDN/fun_with/fun-with-gitlab/components/slidesk/slidesk@1.0.1
```

After running this job, your slide is available 🎉. To verify, you can go on the `Deploy > Pages` GitLab menu to see the url generated for your website.

_If you want to customize GitLab pages or get more information, you can refer to [this page](https://docs.gitlab.com/ee/user/project/pages/)._

#
