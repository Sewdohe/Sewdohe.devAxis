---
title: Obsidian Embeds Demo
published: 2026-03-09
description: Demonstration of Obsidian-style embeds, math rendering, and Mermaid diagrams in Axis.
tags:
  - obsidian
  - formatting
  - reference
image:
imageAlt:
imageOG: false
hideCoverImage: false
hideTOC: false
hideLocalGraph: false
keyword: obsidian embeds
draft: true
---
This post showcases the advanced embed features available in Axis, including media embeds, auto-embeds, math rendering, and Mermaid diagrams.

## Auto-embeds

### YouTube Videos

YouTube URLs are automatically embedded as responsive video players. Just paste a standard YouTube link as a markdown image:

![Astro Suite for Obsidian](https://www.youtube.com/watch?v=3zeqJ5tqmaQ)

```markdown
![Astro Suite for Obsidian](https://www.youtube.com/watch?v=3zeqJ5tqmaQ)
```

### Twitter/X Posts

Twitter/X post URLs are automatically embedded with theme-aware styling that matches your site's light/dark mode:

![Why doesn't everyone use Astro?](https://x.com/davidvkimball/status/1933196479801536736)

```markdown
![Why doesn't everyone use Astro?](https://x.com/davidvkimball/status/1933196479801536736)
```

## Media Embeds

Axis supports embedding local media files directly in your posts using standard markdown image syntax. Just place the files in your post's folder and reference them.

### Video

![Demo video](video.mp4)

```markdown
![Demo video](video.mp4)
```

### Audio

![Demo audio](sound.wav)

```markdown
![Demo audio](sound.wav)
```

### PDF

![Sample document](document.pdf)

```markdown
![Sample document](document.pdf)
```

## Math

Axis includes comprehensive LaTeX math support using KaTeX. All math works seamlessly in both light and dark themes.

### Inline Math

Use single dollar signs for inline math: $E = mc^2$ or $\int_0^{2\pi} d\theta x+e^{-i\theta}$.

### Display Math

Use double dollar signs for centered display math:

$$
\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc
$$

$$
f(x) = x^2 + 3x + 2
$$

### Common Mathematical Notation

#### Fractions and Superscripts
- Fractions: $\frac{a}{b}$, $\frac{x^2 + 1}{x - 1}$
- Superscripts: $x^2$, $e^{i\pi} + 1 = 0$
- Subscripts: $x_1$, $H_2O$

#### Greek Letters
- $\alpha, \beta, \gamma, \delta, \epsilon, \theta, \lambda, \mu, \pi, \sigma, \phi, \omega$
- $\Gamma, \Delta, \Theta, \Lambda, \Pi, \Sigma, \Phi, \Omega$

#### Mathematical Symbols
- Summation: $\sum_{i=1}^{n} x_i$
- Product: $\prod_{i=1}^{n} x_i$
- Integral: $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$
- Limit: $\lim_{x \to 0} \frac{\sin x}{x} = 1$

#### Matrices and Vectors
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

#### Complex Equations
$$
\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}
$$

$$
i\hbar\frac{\partial}{\partial t}\Psi(\vec{r},t) = \hat{H}\Psi(\vec{r},t)
$$

### Math in Callouts

Math works perfectly within callouts:

> [!note] Mathematical Proof
> The Pythagorean theorem states that for a right triangle:
> $$a^2 + b^2 = c^2$$
>
> Where $c$ is the hypotenuse and $a$ and $b$ are the other two sides.

> [!tip] Integration by Parts
> The formula for integration by parts is:
> $$\int u \, dv = uv - \int v \, du$$
>
> This is particularly useful for integrals involving products of functions.

### Advanced Mathematical Typesetting

#### Aligned Equations
$$
\begin{aligned}
f(x) &= ax^2 + bx + c \\
f'(x) &= 2ax + b \\
f''(x) &= 2a
\end{aligned}
$$

#### Cases and Piecewise Functions
$$
f(x) = \begin{cases}
x^2 & \text{if } x \geq 0 \\
-x^2 & \text{if } x < 0
\end{cases}
$$

#### Set Notation
- Natural numbers: $\mathbb{N} = \{1, 2, 3, \ldots\}$
- Real numbers: $\mathbb{R}$
- Complex numbers: $\mathbb{C}$
- Set union: $A \cup B$
- Set intersection: $A \cap B$
- Subset: $A \subseteq B$

### Obsidian Compatibility

All math notation works identically in Obsidian and your published site:

- **Inline math**: `$...$` syntax
- **Display math**: `$$...$$` syntax
- **LaTeX commands**: Full support for standard LaTeX math commands
- **Greek letters**: Use `\alpha`, `\beta`, etc.
- **Symbols**: Use `\sum`, `\int`, `\infty`, etc.

## Diagrams

Axis supports Mermaid diagrams that automatically adapt to the current theme (light/dark).

### Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    participant John
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

### Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

### Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
```

### User Journey

```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

### Gantt Chart

```mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2024-01-12  , 12d
    another task     : 24d
```

### Pie Chart

```mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
```

### Git Graph

```mermaid
    gitGraph
       commit
       commit
       branch develop
       checkout develop
       commit
       commit
       checkout main
       merge develop
       commit
       commit
```

### Complex Flowchart

```mermaid
graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]
    D --> G[Code on it]
    E --> H[Use it]
    F --> I[Drive it]
```

### Responsive Design

All diagrams are responsive and work well on mobile devices, with proper scaling and overflow handling.

## Further Reading

For standard markdown formatting examples, see [Formatting Reference](../formatting-reference/index.md).

