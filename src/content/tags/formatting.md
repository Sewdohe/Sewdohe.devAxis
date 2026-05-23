---
title: "#formatting"
tags:
  - formatting
managed-by: tag-mirror
---

```base
filters:
  and:
    - file.hasTag("formatting")
    - '!file.folder.startsWith("tags")'
views:
  - type: titles
    name: By title
    order:
      - file.name
      - published
    sort:
      - property: published
        direction: DESC
    columnSize:
      file.name: 316
      note.published: 151
    titleProperty: note.title
    layout: list
    secondaryProperty: note.published

```
