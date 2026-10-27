# Maths

SliDesk shows LaTeX formulas with the `@gouz/maths` plugin, which bundles [KaTeX](https://katex.org) and works offline:

```sh
slidesk plugin install @gouz/maths
```

## A formula in a block

````markdown
```math
\begin{pmatrix} a & b \\ c & d \end{pmatrix} \, x_{1}
```
````

The content of a `math` block is kept as written. Use it for any formula with `\\`, `\,`, `\{`, `\(`…: in the text, Markdown would eat these backslashes.

A simple formula can also stand between `$$` in the text:

```markdown
$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
```

## A formula in a sentence

Write it as inline code between `$`:

```markdown
The famous `$E = mc^2$`, and `$\frac{1}{2}$` of it.
```

A single `$` in the text is left alone, so prices like $5 stay as they are.

The formulas show in the presentation, in the speaker view, and in the PDF and PPTX exports.
