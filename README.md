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

__italic__

**bold**
```

