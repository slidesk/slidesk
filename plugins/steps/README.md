# SliDesk Plugin: steps

This plugin overrides the `next()` function of slidesk to allow you to have a list which appears step by step.

You have to add a class `steps` on the slides which contain a list.

Appearence speed can be control with an override in `custom.css` by redefining this css variable:

```css
:root {
  --animationSteps: 100ms;
}
```
