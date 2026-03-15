# Flare 🔥

A template-first language that compiles to native Web Components.

Write `.flare` files with a simple, declarative syntax — get zero-runtime Custom Elements with Shadow DOM, scoped CSS, reactivity, and type checking out of the box.

```flare
<meta>
  name: "x-counter"
  shadow: open
</meta>

<script>
  /** Current count value */
  state count: number = 0

  fn increment() {
    count += 1
  }
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>

<style>
  button { padding: 8px 16px; border-radius: 8px; }
</style>
```

## Why Flare?

- **Zero runtime** — Compiles to standard `HTMLElement` classes. No framework, no virtual DOM, no runtime library.
- **Single-file components** — `<meta>`, `<script>`, `<template>`, `<style>` in one `.flare` file.
- **Works everywhere** — Output is vanilla Web Components. Use with React, Vue, Svelte, or plain HTML.
- **Built-in reactivity** — `state` changes automatically update the DOM.
- **Scoped CSS** — Shadow DOM isolates styles by default.
- **Type-checked** — Catches undefined variables, type mismatches, and typos at compile time.
- **XSS-safe** — All `{{ }}` interpolation is auto-escaped. Opt in to raw HTML with `@html`.

## Quick start

```bash
# 1. Download flare-cli and enter the directory
cd flare-cli

# 2. Create a new project
node bin/flare.js init my-app

# 3. Build and run
cd my-app
node ../bin/flare.js dev
# → Open http://localhost:3000
```

## Language overview

### Script declarations

```flare
<script>
  state count: number = 0            // Reactive variable
  prop  label: string = "default"    // External attribute
  computed total: number = a + b     // Derived value (read-only)
  ref   canvas: HTMLCanvasElement    // DOM reference

  fn increment() { count += 1 }     // Method (auto-updates DOM)
  fn async fetchData() { ... }       // Async method

  emit close: { reason: string }     // Custom event (bubbles + composed)
  emit(local) internal: void         // Non-bubbling event

  watch(count) { localStorage.setItem("count", String(count)) }

  on mount { console.log("connected") }
  on unmount { console.log("disconnected") }
</script>
```

### Template syntax

```flare
<template>
  {{ expression }}                         <!-- Text (auto-escaped) -->
  <img :src="imageUrl" />                  <!-- Dynamic attribute -->
  <button @click="handler">Click</button>  <!-- Event listener -->
  <input :bind="text" />                   <!-- Two-way binding -->
  <div @html="rawContent"></div>           <!-- Raw HTML (opt-in) -->

  <#if condition="count > 0">              <!-- Conditional -->
    <p>{{ count }} items</p>
  <:else>
    <p>No items</p>
  </#if>

  <#for each="item, index" of="items" key="item.id">
    <li>{{ item.name }}</li>               <!-- Loop -->
    <:empty><p>Empty list</p></:empty>
  </#for>

  <slot name="header"></slot>              <!-- Web Component slot -->
</template>
```

### Event modifiers

```flare
<form @submit|prevent="handleSubmit">
<div @click|stop="handleClick">
<input @keydown|enter="search">
```

### Emit options

```flare
emit close: { reason: string }              // Default: bubbles + composed
emit(bubbles) notify: void                  // Bubbles only
emit(composed) select: { id: number }       // Crosses Shadow DOM only
emit(local) internal: void                  // Self only
```

## Build output

```
dist/
├── flare-bundle.js        ← All components bundled (use this)
└── components/            ← Individual files (for standalone use)
    ├── app.js
    ├── button.js
    └── card.js
```

```html
<!-- One script tag loads everything -->
<script src="dist/flare-bundle.js"></script>
<x-app></x-app>
```

## Component composition

Components reference each other by tag name. No import required at runtime.

```flare
<template>
  <x-card title="Users">
    <x-button label="Add" @press="addUser" />
  </x-card>
</template>
```

The bundle registers all components before any `connectedCallback` fires, so nesting works regardless of file order.

## VS Code extension

Syntax highlighting, real-time diagnostics, hover documentation, and file icons.

```bash
# Install
cp -r flare-vscode ~/.vscode/extensions/flare-lang-0.1.0
```

Features:
- Highlight for all Flare syntax + embedded TypeScript/CSS
- Error detection: undefined variables, type mismatches, missing attributes
- JSDoc hover: `/** comment */` above declarations shows on hover
- `#for` loop variable scope tracking

## CLI commands

| Command | Description |
|---------|-------------|
| `flare init <name>` | Create new project |
| `flare dev` | Dev server with file watching |
| `flare build` | Production build |
| `flare check` | Type check only |

## Security

- All `{{ }}` text interpolation is HTML-escaped via `#esc()`
- All dynamic attributes (`:src`, `:class`, etc.) are escaped via `#escAttr()`
- `@html` is intentionally unescaped — use only with trusted data
- Each component is wrapped in an IIFE for scope isolation

## Roadmap

- [ ] Language Server Protocol (LSP) for full TypeScript type checking inside `fn`
- [ ] Rust compiler implementation (source available in `flare-compiler-rust/`)
- [ ] HMR (Hot Module Replacement) in dev server
- [ ] SSR (Server-Side Rendering) support
- [ ] npm package publishing

## License

MIT
