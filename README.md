# SliDesk

Write your talk/presentation in a simplified language (SliDeskFormat), generate it and visualize it in Web.

SliDesk is a new talk engine like RevealJS developped with [Bun](https://bun.sh).

The `example` rendering is visible on [gouz.github.io/slidesk/](https://gouz.github.io/slidesk/).

## How to use?

### macOS with **Homebrew**

#### Installation

```sh
brew tap gouz/tools && brew install slidesk
```

or

```sh
brew install gouz/tools/slidesk
```

#### Usage

```sh
Usage: slidesk [options] [command] [talk]

Your presentation companion

Arguments:
  talk                   the directory of your talk

Options:
  -v, --version          output the version number
  -d, --domain <string>  domain (default: "localhost")
  -p, --port <int>       port (default: 1337)
  -s, --save             save the html file
  -n, --notes            open with speakers notes
  -src, --source         add a button on slides to display its SDF code
  -g, -gamepad           control your slide with a gamepad from the presentation
  --gamepad-sv           control your slide with a gamepad from the speaker-view
  -q, --qrcode           add a QRCode on each slide
  -t, --timers           add checkpoint and slide's maximum time on notes view
  -h, --help             display help for command

Commands:
  create <talk>
```

### Other systems

If you want to compile **SliDesk**, you must have **Bun** installed on your computer.

If not, you can install it through:

```sh
curl -fsSL https://bun.sh/install | bash
```

Then you can use it through:

```sh
Usage: bunx slidesk [options] [command] <talk>

Your presentation companion

Options:
  -v, --version          output the version number
  -d, --domain <string>  domain (default: "localhost")
  -p, --port <int>       port (default: 1337)
  -s, --save             save the html file
  -n, --notes            open with speakers notes
  -src, --source         add a button on slides to display its SDF code
  -g, -gamepad           control your slide with a gamepad from the presentation
  --gamepad-sv           control your slide with a gamepad from the speaker-view
  -q, --qrcode           add a QRCode on each slide
  -t, --timers           add checkpoint and slide's maximum time on notes view
  -h, --help             display help for command

Commands:
  create <talk>
```

## How to build SliDesk?

Once you clone the repository, you can install the dependencies with:

```sh
bun install
```

And create the "exe" file with:

```sh
bun make:exe
```

Then you'll have a `exe/slidesk` file created.

## How to create a presentation

In a directory, create a `main.sdf` file which is the entry point of your presentation.

```
bunx slidesk <yourdirectory>
```

or

```
slidesk <yourdirectory>
```

will convert the `main.sdf` into a HTML file and serve it, it will open the default browser too.

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

  --sd-background-color: #242424;
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

## Why a new tool???

I decided to create my own tool for my talks, because:

- It's fun to create something
- I want to have a tool which do only the minimum
- I want a very tiny light tool
- I want it to be permissive a lot (you can add html tags in without any problem)
