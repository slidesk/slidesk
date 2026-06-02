# Create themes

Themes bundle CSS, JS, templates, plugins, and components into a reusable package.

## Structure

Create a directory inside `themes/`:

```
themes/
└── my-theme/
    ├── theme.css
    ├── script.js
    ├── templates/
    └── plugins/
```

A theme can contain templates and plugins — they are loaded automatically when the theme is applied.

## CSS variables

Override these variables in your `theme.css` to customise the presentation look.

### Presentation view

| Variable | Default | Description |
|---|---|---|
| `--sd-background-color` | `#242424` | Slide background |
| `--sd-heading-color` | `rgba(255, 255, 255, 0.97)` | Heading text colour |
| `--sd-text-color` | `rgba(255, 255, 255, 0.87)` | Body text colour |
| `--sd-primary-color` | `rgb(37, 186, 146)` | Links and strong emphasis |
| `--sd-heading1-size` | `8.5vw` | H1 font size |
| `--sd-heading1-line-height` | `1` | H1 line height |
| `--sd-heading2-size` | `5vw` | H2 font size |
| `--sd-heading2-line-height` | `1` | H2 line height |
| `--sd-text-size` | `2.2vw` | Body text font size |
| `--sd-text-line-height` | `1.2` | Body text line height |
| `--sd-caption-font-size` | `1vw` | Image caption font size |
| `--sd-caption-line-height` | `1` | Image caption line height |
| `--sd-caption-color` | `rgba(0, 0, 0, 0.7)` | Caption text colour |
| `--sd-caption-bgcolor` | `rgba(255, 255, 255, 0.7)` | Caption background colour |
| `--animationTimer` | `300ms` (from `slidesk.TRANSITION`) | Slide transition duration |

### Speaker / Notes view

| Variable | Default | Description |
|---|---|---|
| `--sd-sv-timer-size` | `80px` | Timer font size |
| `--sd-sv-subtimer-size` | `60px` | Per-slide countdown font size |
| `--sd-sv-text-size` | `40px` | Notes text font size |
| `--sd-sv-text-line-height` | `1.2` | Notes text line height |
| `--sd-sv-background-color` | `#242424` | Speaker view background |
| `--sd-sv-text-color` | `rgba(255, 255, 255, 0.87)` | Speaker view text colour |
| `--sd-sv-background-color-emergency` | `#d9000e` | Timer emergency background |

The speaker view also inherits `--sd-background-color` and `--sd-text-color` from the presentation variables for the slide preview area.

## Presentation classes

### `.sd-app`

The root application wrapper (`<body class="sd-app">`). Full viewport area with `overflow: hidden` and the mouse cursor hidden after 250ms of inactivity.

### `.sd-slide`

Each slide is rendered as `<section class="sd-slide">`. Slides are positioned absolutely and start off-screen to the right (`translateX(100%)`). The transition is controlled by `--animationTimer`.

### `.sd-slide.sd-current`

The visible slide (`translateX(0)`).

### `.sd-slide.sd-previous`

Slides that have been passed (`translateX(-100%)`).

### `.sd-slide.no-sd-animation`

Disables the transition (`transition-duration: 0ms`). Applied on initial load and removed after `--animationTimer` elapses.

### `.sd-img`

Wrapper `<figure>` for images:

```css
.sd-img {
    display: inline-block;
    max-width: 90vw;
    position: relative;
}
```

Contains a `figcaption` with caption styling.

### `.sd-notes`

Speaker notes are hidden on slides (`display: none`). They are extracted and displayed in the speaker view.

### Print

When printing, all slides are repositioned statically with `page-break-after: always` and `transform: translateX(0)` so every slide appears on its own page.

## Speaker view structure

The speaker view (`notes.html`) layout:

```
#sd-sv-left (50% width)
├── #sd-sv-current (current slide preview, class="sd-app")
└── #sd-sv-future  (next slide preview, class="sd-app")

#sd-sv-right (50% width)
├── #sd-sv-timer     (elapsed time, click to start)
├── #sd-sv-subtimer  (per-slide countdown)
├── #sd-sv-notes     (speaker notes text)
└── #sd-open-presentation (presentation launcher buttons)
```

Slide previews in the speaker view are rendered at `zoom: 0.5` with no transition animation. The future slide has a semi-transparent overlay (`#sd-sv-future:after`).

## Example: light theme

```css
:root {
    --sd-background-color: #ffffff;
    --sd-heading-color: rgba(18, 18, 18, 0.97);
    --sd-text-color: rgba(18, 18, 18, 0.87);
    --sd-primary-color: #2563eb;
}
```

## Example: custom slide classes

The default theme includes `.speaker` and `.chapter` helper classes:

```css
.speaker img {
    border: 2px solid var(--sd-primary-color);
    border-radius: 100%;
}

.chapter h2 {
    color: var(--sd-primary-color);
}
```

Use them in your slides with the add class syntax: `## Chapter title {.chapter}`.

## Usage

Place the theme in your talk's `themes/` directory. SliDesk loads it automatically. Theme CSS is loaded after `slidesk.css`, so it overrides the defaults.

## Share a theme

1. Add a `README.md` for a description.
2. Optionally add `preview/` subfolder with `.webp` images at 320px width.
3. Log in and push:

```sh
slidesk link login
slidesk theme push my-theme
```
