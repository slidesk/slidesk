---
sidebar_position: 1
---

# Templates

SliDesk has a template system since version 2.11.0. It allows you to create custom templates for your content, which can be used in various ways.

To create a template, you need to create a new folder in the `templates` directory of your SliDesk installation. In this folder, you have to create `.sdt` files.

Example: `templates/split.sdt`

```html
<div class="split">
  <div class="left">
    <sd-title />
  </div>
  <div class="right">
    <sd-content />
  </div>
</div>
```

You can see special tags : `sd-title` & `sd-title`. These are placeholders for the title and content of your page.

To use this template, you need to specify it in the `class` field of your slide. For example:

 `main.sdf`:
```
## My Slide .[#split other-classes]

My Content
```

In this example, the slide will be rendered by:

```html
<section class="sd-slide other-classes">
<div class="split">
  <div class="left">
    <h2>My Slide</h2>
  </div>
  <div class="right">
    <p>My Content</p>
  </div>
</div>
</section>
```

You can also use named block to make multi blocks.

Example, this following template:

```html
<div class="split">
  <div class="left">
    <sd-title />
    <sd-block />
  </div>
  <div class="right">
    <sd-content />
    <sd-foo />
  </div>
</div>
```

with the sdf content:

```

## Title .[#split]

<div class="speaker">

[[foo]]

Test

[[/foo]]


A text


[[block]]

- 🧑‍💻 Dev
- 🏢 Dev'in

[[/block]]

</div>
```

will render as:

```html
<section class="sd-slide">
  <div class="split">
    <div class="left">
      <h2>My Slide</h2>
      <ul>
        <li>🧑‍💻 Dev</li>
        <li>🏢 Dev'in</li>
      </ul>
    </div>
    <div class="right">
      <p>My Content</p>
      <p>Test</p>
    </div>
  </div>
</section>
```

:::warning
A block must be wrapped between 2 empty lines
:::