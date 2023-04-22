# TalkFlow

A new talk engine like RevealJS.

I want to use a simplified language like MarkDown or AsciiDoc to generate the presentation.


## Installation

```
npm i -g talkflow
```

## How to create a presentation

In a directory, create a `main.tfs` file which is the entry point of your presentation.

```
talkflow <yourdirectory>
```

will convert the `main.tfs` into an html file and serve it, it will open the default browser too.

A livereload is activated per default.

## TFS Syntax

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
}
```

Then, in your `main.tfs` file you have to prepend this line:

```
:custom_css: location/of/your/custom.css
```