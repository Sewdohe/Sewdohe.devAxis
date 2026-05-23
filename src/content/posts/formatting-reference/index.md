---
title: Formatting Reference
published: 2026-03-09
description: A comprehensive guide to all the markdown, extended markdown, and formatting features available in Axis.
tags:
  - markdown
  - formatting
  - reference
image:
imageAlt:
imageOG: false
hideCoverImage: false
hideTOC: false
hideLocalGraph: false
keyword: ""
draft: true
redirects:
  - formatting-example
---


This post demonstrates all the markdown, extended markdown, and formatting features available in Axis. Use it as both a reference guide and a showcase of what's possible.

## Basic Formatting

### Text Emphasis

- **Bold text** using `**bold**` or `__bold__`
- *Italic text* using `*italic*` or `_italic_`
- ***Bold and italic*** using `***text***`
- ~~Strikethrough~~ using `~~text~~`
- ==Highlighted text== using `==text==`
- `Inline code` using backticks

### Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

## Callouts and Admonitions

Axis supports Obsidian-style callouts with proper icons and styling. Each callout type has its own color scheme and icon.

### Basic Callouts

> [!note]
> This is a note callout. Use it for general information that readers should be aware of.

> [!tip]
> This is a tip callout. Perfect for helpful suggestions and best practices.

> [!important]
> This is an important callout. Use it to highlight critical information.

> [!warning]
> This is a warning callout. Use it to alert readers about potential issues.

> [!caution]
> This is a caution callout. Use it for dangerous or risky situations.

### Custom Titles

> [!note] Custom Note Title
> You can customize the title of any callout by adding text after the callout type.

> [!tip] Pro Tip
> Custom titles help you provide more context for your callouts.

### Collapsible Callouts

You can make callouts collapsible by adding `+` (expanded by default) or `-` (collapsed by default) after the callout type:

> [!note]+ Expanded by Default
> This callout starts expanded and can be collapsed by clicking the toggle button or the title.

> [!warning]- Collapsed by Default
> This callout starts collapsed and can be expanded by clicking the toggle button or the title.

> [!tip]+ Collapsible with Custom Title
> You can combine collapsible functionality with custom titles for more control over your content organization.

### Extended Callout Types

> [!info]
> Info callouts provide additional context or details.

> [!success]
> Success callouts highlight positive outcomes or achievements.

> [!question]
> Question callouts can be used to pose questions or highlight areas of uncertainty.

> [!example]
> Example callouts are perfect for showcasing code examples or demonstrations.

> [!quote]
> Quote callouts can be used to highlight important quotes or references.

### Callouts with Formatting

> [!example]
> You can use markdown syntax in callout content like *italics*, **bolded text**, or [links](https://astro.build).

## Media Content

### Images

#### Single Image

![Glacier](glacier.jpg)

#### Multiple Image Layouts

Axis automatically arranges consecutive images in responsive grid layouts. Place images together without empty lines between them to create these layouts.

**Two Images Side by Side**

![Glacier](glacier.jpg)
![Tree in Japan](tree-in-japan.jpg)

**Three Images in a Row**

![Glacier](glacier.jpg)
![Tree in Japan](tree-in-japan.jpg)
![Desert](desert.jpg)

**Four Images in a Row**

![Glacier](glacier.jpg)
![Tree in Japan](tree-in-japan.jpg)
![Desert](desert.jpg)
![Lava](lava.jpg)

**How to Use Multiple Images / Gallery**

Simply place multiple images together without empty lines between them:

```markdown
![Image 1](image1.jpg)
![Image 2](image2.jpg)
![Image 3](image3.jpg)
```

On mobile devices, all layouts switch to a single column for better readability.

### Linked Images

[![Glacier](glacier.jpg)](https://obsidian.md)

```markdown
[![Glacier](glacier.jpg)](https://obsidian.md)
```

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item
  - Another nested item
    - Deeply nested item
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
      1. Sub-sub-step
3. Third step

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
  - [ ] Nested incomplete task
  - [x] Nested completed task
- [ ] Final incomplete task

## Links and References

### External Links

Here's an [external link](https://obsidian.md).

### Internal Links

You can create internal links using standard markdown.

For example: [Obsidian Embeds Demo](posts/obsidian-embeds-demo/index.md) or [Hello, World](posts/hello-world/index.md).

```markdown
[Obsidian Embeds Demo](posts/obsidian-embeds-demo/index.md)
[Hello, World](posts/hello-world/index.md)
```

Here's an internal link with an anchor:

[What's Included](posts/hello-world/index.md#What's included)

### Reference Links

This is a [reference link][1] and this is another [reference link][markdown].

[1]: https://example.com
[markdown]: https://daringfireball.net/projects/markdown/

## Code Blocks

### Inline Code

Use `const variable = 'value'` for inline code snippets.

### JavaScript

```javascript
function greetUser(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to our blog, ${name}`;
}

const user = "Developer";
greetUser(user);
```

### Python

```python
def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

# Example usage
for i in range(10):
    print(f"F({i}) = {calculate_fibonacci(i)}")
```

### CSS

```css
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 12px 24px;
  transition: transform 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
}
```

### Bash/Shell

```bash
#!/bin/bash
echo "Setting up development environment..."

# Install dependencies
pnpm install

# Start development server
pnpm dev

echo "Development server started on http://localhost:4321"
```

## Tables

### Basic Tables

| Feature   | Supported | Notes                           |
| --------- | --------- | ------------------------------- |
| Markdown  | Yes       | Full CommonMark support         |
| Callouts  | Yes       | Multiple types with icons       |
| Math      | Yes       | LaTeX math with KaTeX rendering |
| Diagrams  | Yes       | Mermaid diagram support         |
| Galleries | Yes       | Auto grid layout for images     |

### Advanced Tables

| Language   | Use Case             | Performance | Learning Curve |
| ---------- | -------------------- | ----------- | -------------- |
| JavaScript | Web Development      | Great       | Easy           |
| Python     | Data Science         | Good        | Easy           |
| Rust       | Systems Programming  | Excellent   | Hard           |
| Go         | Backend Services     | Great       | Medium         |

## Blockquotes

### Simple Quotes

> The best way to predict the future is to invent it.
> -- Alan Kay

### Nested Quotes

> This is a top-level quote.
>
> > This is a nested quote within the first quote.
> >
> > > And this is a quote nested even deeper.
>
> Back to the top level.

## Footnotes

Axis supports footnotes that display as sidenotes on wide screens [^1]. You can add multiple footnotes throughout your content [^2].

[^1]: This is a footnote. On desktop screens wider than 1280px, footnotes appear as sidenotes in the right margin.

[^2]: A second footnote. They're numbered automatically.

```markdown
Text with a footnote [^1].

[^1]: Footnote content here.
```

## GitHub Repository Cards

Dynamic cards that pull repository info from the GitHub API on page load.

```embed
https://github.com/davidvkimball/vaultcms
```

````markdown
```embed
https://github.com/owner/repo
```
````

## Buttons

<div class="btn-group">
  <a href="https://astro.build" class="no-styling no-underline" target="_blank"><button class="btn-primary" name="button">Primary</button></a>
  <a href="https://astro.build" class="no-styling no-underline" target="_blank"><button class="btn-secondary" name="button">Secondary</button></a>
  <a href="https://astro.build" class="no-styling no-underline" target="_blank"><button class="btn-outline" name="button">Outline</button></a>
  <a href="https://astro.build" class="no-styling no-underline" target="_blank"><button class="btn-ghost" name="button">Ghost</button></a>
</div>

<a href="https://astro.build" class="no-styling no-underline" target="_blank"><button class="btn-large" name="button">Large Button</button></a>

```html
<div class="btn-group">
  <button class="btn-primary">Primary</button>
  <button class="btn-secondary">Secondary</button>
  <button class="btn-outline">Outline</button>
  <button class="btn-ghost">Ghost</button>
</div>
<button class="btn-large">Large</button>
```

## Horizontal Rules

---

## HTML Elements

You can use HTML directly. Here are some examples:

<details>
<summary>Click to expand</summary>

This content is hidden by default and can be expanded by clicking the summary.

</details>

<small>Small text for fine print</small>

<sup>Superscript</sup>

<sub>Subscript</sub>

### Keyboard Shortcuts

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy and <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste.

Use <kbd>Ctrl</kbd> + <kbd>K</kbd> to open the command palette.

### Special Characters and Symbols

- Copyright: &copy;
- Trademark: &trade;
- Registered: &reg;
- Arrows: &larr; &uarr; &rarr; &darr;
- Currency: $ &euro; &pound; &yen;

## Works with Obsidian

All of these formatting options render in Obsidian as well, with some differences depending on the theme you use.

### Quick Reference

- **Bold**: `**text**` or `__text__`
- **Italic**: `*text*` or `_text_`
- **Code**: `` `code` ``
- **Highlight**: `==text==`
- **Strikethrough**: `~~text~~`
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Lists**: `-` or `1.` for ordered
- **Tasks**: `- [ ]` and `- [x]`
- **Tables**: Use `|` to separate columns
- **Quotes**: Start lines with `>`
- **Callouts**: `> [!TYPE]`
- **Footnotes**: `[^1]` with `[^1]: text` below
- **Horizontal rule**: `---`
- **GitHub cards**: `` ```embed `` with GitHub URL
- **Buttons**: `<button class="btn-primary">Text</button>`

Further reading: [Obsidian Embeds Demo](posts/obsidian-embeds-demo/index.md)
