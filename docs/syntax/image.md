# Image

You can integrate images in your presentation using the following component:

```
!image(path, alternative text, width, height, additional styles, addCaption)
```

`width` & `height`are specified in `px`.

Only the path is mandatory.

If you want to specify the height, write you component like this:

```
!image(my-image.png,,,200)
```

Example:

```
!image(path/of/your/image, my alternative text, 13, 12, float: left; background-color: #131282, true)
```

will render

```
<figure class="sd-img" style="float: left; background-color: #131282">
  <img src="path/of/your/image" loading="lazy" width="13" height="12" alt="my alternative text" />
  <figcaption>my alternative text</figcaption>
</figure>
```

Using the `.env` file with the "WIDTH" key, images will be resized to be reponsive.

Since version 2.7.3, if the `additional styles` contains no space, the image will have a class with its value instead of writing it in the style attribute.

Since version 2.7.6, in the `additional styles` you can specify many classes with this following syntax: `!image(path/of/your/image, my alternative text, 13, 12, [class1 class2 class3])` and the image will have these classes.