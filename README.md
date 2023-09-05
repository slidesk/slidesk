# SliDesk

A new talk engine like RevealJS.

I want to use a simplified language like MarkDown or AsciiDoc to generate the presentation.

The `example` rendering is visible on https://gouz.github.io/slidesk/

## Installation

On mac you can use **Homebrew**:

```sh
brew tap gouz/tools && brew install slidesk
```

or

```sh
brew install gouz/tools/slidesk
```

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
  -s, --save        save the html file
  -n, --notes       open with speakers notes
  -src, --source    add a button on slides to display its SDF code
  -g, -gamepad      control your slide with a gamepad from the
                    presentation
  --gamepad-sv      control your slide with a gamepad from the
                    speaker-view
  -q, --qrcode      add a QRCode on each slide
  -t, --timers      add checkpoint and slide's maximum time on notes view
  -v, --version     output the version number
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

__italic__

**bold**

!image(path or url | html attributes)

- list
-- sublist
-- sub
- end of a list

```

See the example directory to understand how it works or run

```
bun example
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

## Timers

You can specify checkpoint timers in your slide. They are visibles in Speaker Note View.

This following syntax means that at this slide, if you're under 22 minutes of your presentation, you're good.

```
//@ < 22:00
```

This following syntax means that this slide must be done in 3 minutes.

```
//@ [] 2:00
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
