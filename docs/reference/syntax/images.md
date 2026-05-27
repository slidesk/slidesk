# Images

```markdown
!image(path, alternative text, width, height, additional styles, addCaption)
```

Only the path is mandatory. Width and height are in pixels.

```markdown
!image(my-image.png,,,200)
!image(path/of/your/image, my alt text, 13, 12, float: left; background-color: #131282, true)
```

Renders:

```html
<figure class="sd-img" style="float: left; background-color: #131282">
  <img src="path/of/your/image" loading="lazy" width="13" height="12" alt="my alt text" />
  <figcaption>my alt text</figcaption>
</figure>
```

With `WIDTH` set in `slidesk.toml`, images are responsive.

If `additional styles` contains no spaces, it is applied as a class instead of inline styles.

Since 2.7.6, you can specify multiple classes with bracket syntax:

```markdown
!image(path, alt, 13, 12, [class1 class2 class3])
```
