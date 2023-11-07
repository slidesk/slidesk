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
  -v, --version           output the version number
  -d, --domain <string>   domain (default: "localhost")
  -p, --port <int>        port (default: 1337)
  -s, --save              save the html file
  -n, --notes             open with speakers notes
  -t, --timers            add checkpoint and slide's maximum time on notes view
  -a, --transition <int>  transition timer (default: 300)
  -h, --help              display help for command

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
  -v, --version           output the version number
  -d, --domain <string>   domain (default: "localhost")
  -p, --port <int>        port (default: 1337)
  -s, --save              save the html file
  -n, --notes             open with speakers notes
  -t, --timers            add checkpoint and slide's maximum time on notes view
  -a, --transition <int>  transition timer (default: 300)
  -h, --help              display help for command

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

You can also use Gitpod :

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/gouz/slidesk/-/tree/main/)

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

!image(path or url, placeholder, width (in vw), height (in vh), styles)

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
  --sd-heading1-size: 8.5vw;
  --sd-heading1-line-height: 1;
  --sd-heading2-size: 5vw;
  --sd-heading2-line-height: 1;
  --sd-text-size: 2.2vw;
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
/::
custom_css: location/of/your/custom.css
::/
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

This following syntax means that this slide must be done in 2 minutes.

```
//@ [] 2:00
```

## `.env` file

SliDesk can load a `.env` file. The content will be available in JS (for your plugins) with the property `window.slidesk.env`.

Reserved key: `PLUGINS`, used to specify internal plugins to load.

## Plugins

SliDesk has a plugin system.

To use it, you have to create a `plugins` directory into your main directory (where main.sdf is).

There is some samples in this repository.

A plugin is a directory with at least one file: plugin.json

This `json` file describes the comportement of the plugin. Each keys of the json correspond to a "hook":

- `addHTML`: add some html at the end of the presentation
- `addScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry)
- `addSpeakerScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry) but on speaker view
- `addStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry)
- `addSpeakerStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry) but on speaker view
- `onSlideChange`: javascript code which will be executed after a slide is changed
- `onSpeakerViewSlideChange`: javascript code which will be executed after a slide is changed

If you want to use one of the "core" plugins, available in this repository, you don't need to copy them. You have just to create a `.env` file in your root directory of the talk, and precise the plugins you need:

```
PLUGINS="source, qrcode"
```

## Components

SliDesk has a component system.

To use it, you have to create a `components` directory into your main directory (where main.sdf is).

In this directory, you can add custom components with a `.mjs` file. One per component.

Example:

I want to have a `!test(my text)` which generate a `<p>Test: my text</p>`.

So I create a `components/test.mjs` with the following content.

```js
export default (data) => {
  let newData = data;
  [...newData.matchAll(/!test\((.*)\)/g)].forEach((match) => {
    newData = newData.replace(match[0], `<p>Test: ${match[1]}</p>`);
  });
  return newData;
};
```

Then a dynamic call will be done when parsing a slide (at the end of default parsing).

## Why a new tool???

I decided to create my own tool for my talks, because:

- It's fun to create something
- I want to have a tool which do only the minimum
- I want a very tiny light tool
- I want it to be permissive a lot (you can add html tags in without any problem)
