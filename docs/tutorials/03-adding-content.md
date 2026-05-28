# Adding content

## Images

Use the `!image()` component to add images:

```markdown
!image(path/to/image.png, alt text, width, height, styles, addCaption)
```

Only the path is mandatory:

```markdown
!image(diagram.png)
```

Full example:

```markdown
!image(diagram.png, Architecture diagram, 800)
```

Images are responsive when `WIDTH` is set in `slidesk.toml`.

See the [image reference](/reference/syntax/images) for all options.

## Slide classes

Add CSS classes to a slide with `.[classname]`:

```markdown
## My Slide .[cover dark]
```

This renders as `<section class="sd-slide cover dark">`.

## Templates

Apply a template with `.[#template-name]`:

```markdown
## My Slide .[#split left right]
```

Templates are `.sdt` files in the `templates/` directory. See the [template how-to](/how-to/use-templates) for creating your own.

## Speaker notes

Wrap speaker notes between `/*` and `*/`:

```markdown
## My Slide

This text is shown to the public.

/*

This text is only for you — visible in the speaker view.

*/
```

Open the speaker view with the `-n` option:

```sh
slidesk -n my-talk
```

## Components

Create custom `.mjs` components in the `components/` directory:

```markdown
!test(hello world)
```

See [how to create components](/how-to/create-components).

## Plugins

Plugins extend SliDesk with ready-to-use features. Install them from the hub:

```sh
slidesk plugin install @gouz/mermaid
```

Then add the plugin's syntax to your slides. For example, with `@gouz/mermaid`:

```markdown
  ```mermaid
  sequenceDiagram
      Alice->>+John: Hello John, how are you?
      Alice->>+John: John, can you hear me?
      John-->>-Alice: Hi Alice, I can hear you!
      John-->>-Alice: I feel great!
  ```
```

Browse all available plugins at [slidesk.link/plugins](https://slidesk.link/plugins).

## Includes

Split long presentations into multiple files:

```markdown
!include(slides/introduction.md)
!include(slides/conclusion.md)
```

See the [includes reference](/reference/syntax/includes) for details.
