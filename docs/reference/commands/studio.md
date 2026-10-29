# studio

Edit your slides in your browser, as in an online slides editor, while they stay Markdown files.

```sh
slidesk studio
slidesk studio my-talk
```

SliDesk opens the studio on `http://localhost:57210`, next to the presentation it serves as for [`present`](present.md):

- on the left, a thumbnail of each slide of the talk in the order they are shown, under the file each one is written in. Drag a slide to move it, even into another file,
- in the middle, the selected slide: click its title, a paragraph, a list item or a subtitle and type. In a list or a paragraph, **Enter** starts another item or paragraph and **Backspace** at the start joins it to the previous one, or removes it when empty; elsewhere **Enter** or **Esc** ends the edit. **⌘B** / **⌘I** set bold and italic. What you type is written back into the Markdown of the slide. Drag an image to place it anywhere on the slide: its position, in % of the slide, goes into the styles of its `!image(...)`. Drag its corner to resize it: its width, in pixels, goes into its `!image(...)`, its height following,
- under it, its speaker notes,
- on the right, the **Source** of the slide, for what cannot be typed on it: code blocks, images, template blocks, HTML, links.

The slide is drawn without the scripts of its plugins; **▶ Present** opens the presentation itself on it.

The toolbar adds a paragraph, a subtitle, a list item, a code block, or an image, copied into `assets/`. **+ Slide** adds a slide after the selected one, **Remove** deletes it.

The **template** menu lists the [templates](../template-format.md) of the talk: picking one adds `#name` to the classes of the slide title and the blocks it fills, `[[left]]`, `[[right]]`…, with their name as a text to replace. **No template** removes it from the title and leaves the blocks.

**Add-ons** searches the templates, plugins, components and themes of [slidesk.link](https://slidesk.link), installs them into the talk and removes them, as `slidesk template install`, `slidesk plugin remove`… do. The presentation rebuilds with them.

The **Theme** panel sets the colours and the fonts of the talk in `themes/studio/studio.css`; **Reset** removes them. The fonts are picked among those of your computer (in Chrome and Edge, which ask first) or typed. A Google font is downloaded into `themes/studio/fonts`, so the talk works offline and on another computer; any other font has to be installed where you present.

The files stay the reference: edit them in another editor at the same time, the studio picks the change up when you come back to it. It only answers on this machine. Press **Q** in the terminal to quit.
