# Slidesk

A new talk engine like RevealJS.

I want to use a simplified language like MarkDown or AsciiDoc to generate the presentation.

The `example` rendering is visible on https://gouz.github.io/slidesk/

## Installation

```
npm i -g slidesk
```

## How to create a presentation

In a directory, create a `main.sdf` file which is the entry point of your presentation.

```
slidesk <yourdirectory>
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
node index.js example
```

## Customize theme

In your `custom.css` file, you can override this variables:

```
:root {
  --tf-heading1-size: 3.75em;
  --tf-heading1-line-height: 1;
  --tf-heading2-size: 2.25em;
  --tf-heading2-line-height: 1;
  --tf-heading3-size: 1.75em;
  --tf-heading3-line-height: 1;
  --tf-text-size: 40px;
  --tf-text-line-height: 1.2;

  --tf-background-color: #242424;;
  --tf-heading-color: rgba(255, 255, 255, 0.97);
  --tf-text-color: rgba(255, 255, 255, 0.87);
  --tf-primary-color: rgb(37, 186, 146);


  /* SpeakerView */
  --tf-sv-timer-size: 80px;
  --tf-sv-text-size: 40px;
  --tf-sv-text-line-height: 1.2;
  --tf-sv-background-color: #242424;
  --tf-sv-text-color: rgba(255, 255, 255, 0.87);
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
:custom_css: assets/custom.css

:custom_js: assets/custom.js

:custom_sv_js: assets/customsv.js

```

Warning, it's very important to space this lines with a new line

## Why a new tool ???

I decided to create my own tool for my talks, because:

- It's fun to create something
- I want to have a tool which do only the minimum
- I want a very tiny light tool
- I want it to be permissive a lot (you can add html tags in without any problem)
