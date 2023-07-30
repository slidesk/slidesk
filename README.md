# SliDesk

A new talk engine like RevealJS.

I want to use a simplified language like MarkDown or AsciiDoc to generate the presentation.

The `example` rendering is visible on https://gouz.github.io/slidesk/

## Installation

SliDesk is develop with https://bun.sh instead of Node.js

```
bunx slidesk <talk>
```

## Usage

```sh
Usage: bunx slidesk [options] <talk>

Convert & present a talk

Options:
  -p, --port <int>  port (default: 1337)
  --open            open the default browser
  --save            save the html file
  --notes           open with speakers notes
  -h, --help        display help for command
```

## How to create a presentation

In a directory, create a `main.sdf` file which is the entry point of your presentation.

```
bunx slidesk <yourdirectory>
```

will convert the `main.sdf` into an html file and serve it, it will open the default browser too.

A livereload is activated per default.

## sdf Syntax

```
# Main title

## Title of a new slide

!include(another_file)

_italic_

*bold*

!image(path or url | html attributes)

- list
-- sublist
-- sub
- end of a list

```

See the example directory to understand how it works or run

```
bun run bin/index.js example
```

## Customize theme

In your `custom.css` file, you can override this variables:

```
:root {
  --sd-heading1-size: 3.75em;
  --sd-heading1-line-height: 1;
  --sd-heading2-size: 2.25em;
  --sd-heading2-line-height: 1;
  --sd-heading3-size: 1.75em;
  --sd-heading3-line-height: 1;
  --sd-text-size: 40px;
  --sd-text-line-height: 1.2;

  --sd-background-color: #242424;;
  --sd-heading-color: rgba(255, 255, 255, 0.97);
  --sd-text-color: rgba(255, 255, 255, 0.87);
  --sd-primary-color: rgb(37, 186, 146);


  /* SpeakerView */
  --sd-sv-timer-size: 80px;
  --sd-sv-text-size: 40px;
  --sd-sv-text-line-height: 1.2;
  --sd-sv-background-color: #242424;
  --sd-sv-text-color: rgba(255, 255, 255, 0.87);
}
```

Then, in your `main.sdf` file you have to prepend this line:

```
:custom_css: location/of/your/custom.css
```

## Custom class on slides

```
## My title .[my-class my-other-class]
```

## Speakers Notes

```
/*
A comment in a page correspond to the notes for the speaker.
*/
```

## Add JS on your slides & Speakers Notes

With a custom header in the `main.sdf` file, you can add a script file for the slide part, or the speaker notes part:

```
/::
custom_css: assets/custom.css
custom_js: assets/custom.js
custom_sv_js: assets/customsv.js
::/
```

Warning, it's very important to space this lines with a new line

## Why a new tool ???

I decided to create my own tool for my talks, because:

- It's fun to create something
- I want to have a tool which do only the minimum
- I want a very tiny light tool
- I want it to be permissive a lot (you can add html tags in without any problem)
