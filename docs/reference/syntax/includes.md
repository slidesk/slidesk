# Includes

Split long presentations into multiple files with `!include()`:

```markdown
!include(path/of/sdf or md file)
```

You can include a directory — files are included **alphabetically** and **recursively**:

```markdown
!include(path/of/directory)
```

Subdirectories are walked automatically; the slide order follows the alphabetical sort at every level:

```
slides/
├── 01-intro.md
├── 02-demo.md
├── 03-advanced/
│   ├── 01-feature-a.md
│   ├── 02-feature-b.md
│   └── 03-feature-c.md
└── 99-questions.md
```

```
!include(slides)
```

→ slides appear in the order shown above (`01-intro`, `02-demo`, `03-advanced/01-feature-a`, `03-advanced/02-feature-b`, `03-advanced/03-feature-c`, `99-questions`).
