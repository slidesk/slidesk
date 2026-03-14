# About SliDesk

![logo](_media/icon.svg){width=250}

A contraction of the words "Slide" and "Desk", this open-source project aims to be a tool for both slide creation and presentation at conferences.

Write your talk/presentation in a MarkDown, generate it and visualize it in Web.

SliDesk is a new talk engine like RevealJS or SliDev developped with [Bun](https://bun.sh).

Plugins, Components, Themes, Templates can be found here : https://slidesk.link

A VSCode extension is available too : https://github.com/slidesk/vscode-sdf-language

The initial specifications for SliDesk (https://github.com/slidesk/slidesk) corresponded to the following list of features:

- Server
- Presentation View
- Speaker view:
- Displaying the current and next slide
- Timer(s)
- Viewing speech notes
- Watcher: if a file is modified, the displayed presentation is updated
- Image management
- Theme management
- Plugin operation to add functionality as needed
- A presentation generator (the essential files to get started)

Modular operation is essential. SliDesk must be a lightweight tool, but expandable as needed.

The advantage of using Bun is that it can generate a binary executable that does not need any dependencies.

## Why a new tool???

I decided to create my own tool for my talks, because:

- It's fun to create something
- I want to have a tool which do only the minimum
- I want a very tiny light tool
- I want it to be permissive a lot (you can add html tags in without any problem)
