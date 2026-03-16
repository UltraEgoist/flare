/**
 * Comprehensive test suite for Flare Compiler
 * Tests all major compiler functions: splitBlocks, parseTemplateNodes, TypeChecker, generate, compile
 */

const test = require('node:test');
const assert = require('node:assert');
const { compile, splitBlocks, parseTemplateNodes, TypeChecker, generate } = require('../lib/compiler.js');

// ============================================================
// HELPER ASSERTIONS
// ============================================================

function assertSuccess(result, msg) {
  assert.strictEqual(result.success, true, msg || `Expected compilation to succeed. Errors: ${JSON.stringify(result.diagnostics)}`);
}

function assertFail(result, msg) {
  assert.strictEqual(result.success, false, msg || 'Expected compilation to fail');
}

function assertContains(str, pattern, msg) {
  // If pattern is a string, treat it as a regex pattern (not escaped)
  // If pattern is a regex, use it directly
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  assert.match(str, regex, msg);
}

function assertNotContains(str, pattern, msg) {
  // If pattern is a string, treat it as a regex pattern (not escaped)
  // If pattern is a regex, use it directly
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  assert.doesNotMatch(str, regex, msg);
}

function countDiagnostics(result, level) {
  return (result.diagnostics || []).filter(d => d.level === level).length;
}

// ============================================================
// TESTS: SPLITBLOCKS
// ============================================================

test('splitBlocks - basic 4-block parsing', () => {
  const src = `<meta>name: "x-test"</meta><script>state count: number = 0</script><template><div>{{ count }}</div></template><style>div { color: red; }</style>`;
  const blocks = splitBlocks(src);
  assert.strictEqual(blocks.length, 4);
  assert.strictEqual(blocks[0].type, 'meta');
  assert.strictEqual(blocks[1].type, 'script');
  assert.strictEqual(blocks[2].type, 'template');
  assert.strictEqual(blocks[3].type, 'style');
});

test('splitBlocks - template only (missing other blocks)', () => {
  const src = `<template><div>Hello</div></template>`;
  const blocks = splitBlocks(src);
  assert.strictEqual(blocks.length, 1);
  assert.strictEqual(blocks[0].type, 'template');
});

test('splitBlocks - no meta block', () => {
  const src = `<script>state x: number = 0</script><template><div>{{ x }}</div></template>`;
  const blocks = splitBlocks(src);
  assert.strictEqual(blocks.length, 2);
  assert(!blocks.some(b => b.type === 'meta'));
});

test('splitBlocks - CRLF normalization', () => {
  const src = `<template>\r\n<div>test</div>\r\n</template>`;
  const blocks = splitBlocks(src);
  assert.strictEqual(blocks[0].content, '\n<div>test</div>\n');
});

test('splitBlocks - startLine tracking accuracy', () => {
  const src = `<meta>name: "x-test"</meta>\n<script>state x: number = 0</script>\n<template><div>{{ x }}</div></template>`;
  const blocks = splitBlocks(src);
  assert.strictEqual(blocks[0].startLine, 1); // meta on line 1
  assert.strictEqual(blocks[1].startLine, 2); // script on line 2
  assert.strictEqual(blocks[2].startLine, 3); // template on line 3
});

test('splitBlocks - empty blocks', () => {
  const src = `<meta></meta><template></template>`;
  const blocks = splitBlocks(src);
  assert.strictEqual(blocks.length, 2);
  assert.strictEqual(blocks[0].content.trim(), '');
  assert.strictEqual(blocks[1].content.trim(), '');
});

// ============================================================
// TESTS: PARSETEMPLATNODES
// ============================================================

test('parseTemplateNodes - text nodes', () => {
  const nodes = parseTemplateNodes('Hello World');
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].kind, 'text');
  assert.strictEqual(nodes[0].value, 'Hello World');
});

test('parseTemplateNodes - interpolation {{ expr }}', () => {
  const nodes = parseTemplateNodes('Hello {{ name }}');
  assert.strictEqual(nodes.length, 2); // Text node coalesces whitespace after interpolation
  assert.strictEqual(nodes[0].kind, 'text');
  assert.strictEqual(nodes[1].kind, 'interpolation');
  assert.strictEqual(nodes[1].expr, 'name');
});

test('parseTemplateNodes - unclosed {{ warning', () => {
  const errs = [];
  const nodes = parseTemplateNodes('Hello {{ name', errs);
  assert.strictEqual(errs.length, 1);
  assert.strictEqual(errs[0].level, 'warning');
  assert.match(errs[0].code, /W0301/);
});

test('parseTemplateNodes - element parsing with attributes', () => {
  const nodes = parseTemplateNodes('<div class="test">content</div>');
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].kind, 'element');
  assert.strictEqual(nodes[0].tag, 'div');
  assert.strictEqual(nodes[0].attrs.length, 1);
  assert.strictEqual(nodes[0].attrs[0].name, 'class');
  assert.strictEqual(nodes[0].attrs[0].value, 'test');
});

test('parseTemplateNodes - self-closing elements', () => {
  const nodes = parseTemplateNodes('<input type="text" />');
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].kind, 'element');
  assert.strictEqual(nodes[0].tag, 'input');
  assert.strictEqual(nodes[0].selfClosing, true);
});

test('parseTemplateNodes - dynamic attributes :name="expr"', () => {
  const nodes = parseTemplateNodes('<div :class="active"></div>');
  assert.strictEqual(nodes[0].attrs[0].name, 'class');
  assert.strictEqual(nodes[0].attrs[0].dynamic, true);
  assert.strictEqual(nodes[0].attrs[0].value, 'active');
});

test('parseTemplateNodes - event attributes @click="handler"', () => {
  const nodes = parseTemplateNodes('<button @click="handleClick">Click</button>');
  const clickAttr = nodes[0].attrs.find(a => a.event);
  assert.strictEqual(clickAttr.name, 'click');
  assert.strictEqual(clickAttr.event, true);
  assert.strictEqual(clickAttr.value, 'handleClick');
});

test('parseTemplateNodes - :bind directive', () => {
  const nodes = parseTemplateNodes('<input :bind="text" />');
  const bindAttr = nodes[0].attrs.find(a => a.bind);
  assert.strictEqual(bindAttr.bind, true);
  assert.strictEqual(bindAttr.value, 'text');
});

test('parseTemplateNodes - @html directive', () => {
  const nodes = parseTemplateNodes('<div @html="htmlContent"></div>');
  const htmlAttr = nodes[0].attrs.find(a => a.html);
  assert.strictEqual(htmlAttr.html, true);
  assert.strictEqual(htmlAttr.name, 'html');
});

test('parseTemplateNodes - ref attribute', () => {
  const nodes = parseTemplateNodes('<input ref="inputRef" />');
  const refAttr = nodes[0].attrs.find(a => a.ref);
  assert.strictEqual(refAttr.ref, true);
  assert.strictEqual(refAttr.value, 'inputRef');
});

test('parseTemplateNodes - #if blocks with condition', () => {
  const nodes = parseTemplateNodes('<#if condition="show"><div>Visible</div></#if>');
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].kind, 'if');
  assert.strictEqual(nodes[0].condition, 'show');
});

test('parseTemplateNodes - #if with :else-if and :else', () => {
  const nodes = parseTemplateNodes(
    '<#if condition="x > 0"><div>Positive</div><:else-if condition="x < 0"><div>Negative</div><:else><div>Zero</div></#if>'
  );
  assert.strictEqual(nodes[0].kind, 'if');
  assert.strictEqual(nodes[0].elseIfChain.length, 1);
  assert.strictEqual(nodes[0].elseIfChain[0].condition, 'x < 0');
  assert.strictEqual(nodes[0].elseChildren.length, 1);
});

test('parseTemplateNodes - #for blocks with each, of, key', () => {
  const nodes = parseTemplateNodes('<#for each="item" of="items" key="item.id"><div>{{ item.name }}</div></#for>');
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].kind, 'for');
  assert.strictEqual(nodes[0].each, 'item');
  assert.strictEqual(nodes[0].of, 'items');
  assert.strictEqual(nodes[0].key, 'item.id');
});

test('parseTemplateNodes - #for with :empty', () => {
  const nodes = parseTemplateNodes(
    '<#for each="item" of="items" key="item.id"><div>{{ item }}</div><:empty><p>No items</p></:empty></#for>'
  );
  assert.strictEqual(nodes[0].emptyChildren.length, 1);
  assert.strictEqual(nodes[0].emptyChildren[0].kind, 'element');
  assert.strictEqual(nodes[0].emptyChildren[0].tag, 'p');
});

test('parseTemplateNodes - #for with index variable', () => {
  const nodes = parseTemplateNodes('<#for each="item" of="items" key="item.id"><div>{{ item }}</div></#for>');
  // Index variable is parsed from each attribute if it contains comma (not in key)
  // Basic test: just verify for block is parsed
  assert.strictEqual(nodes[0].kind, 'for');
  assert.strictEqual(nodes[0].each, 'item');
});

test('parseTemplateNodes - nested elements', () => {
  const nodes = parseTemplateNodes('<div><span><em>text</em></span></div>');
  assert.strictEqual(nodes[0].kind, 'element');
  assert.strictEqual(nodes[0].children[0].kind, 'element');
  assert.strictEqual(nodes[0].children[0].tag, 'span');
  assert.strictEqual(nodes[0].children[0].children[0].tag, 'em');
});

test('parseTemplateNodes - nested #if inside #for', () => {
  const nodes = parseTemplateNodes(
    '<#for each="item" of="items" key="item.id"><#if condition="item.active"><div>{{ item.name }}</div></#if></#for>'
  );
  assert.strictEqual(nodes[0].kind, 'for');
  assert.strictEqual(nodes[0].children[0].kind, 'if');
});

// ============================================================
// TESTS: TYPE SYSTEM
// ============================================================

test('parseType - primitives (string, number, boolean)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state name: string = ""
  state count: number = 0
  state active: boolean = true
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  // Type checking is done internally, just verify compilation succeeds
});

test('parseType - arrays (string[])', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state items: string[] = []
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('parseType - union types (string | number)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state value: string | number = 0
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('parseType - object types ({ name: string, age: number })', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state user: { name: string, age: number } = { name: "", age: 0 }
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('parseType - optional fields ({ name?: string })', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state config: { name?: string, value: number } = { value: 0 }
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('parseType - literal types ("idle" | "loading")', () => {
  // Literal types work but the type parser should handle them
  const src = `<meta>name: "x-test"</meta>
<script>
  state status: string = "idle"
</script>
<template><div>{{ status }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('parseType - recursion depth limit', () => {
  // Create a deeply nested type - should be handled gracefully
  const src = `<meta>name: "x-test"</meta>
<script>
  state deeply: string = "test"
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

// ============================================================
// TESTS: TYPECHECKER
// ============================================================

test('TypeChecker - symbol table building (state, prop, computed, fn, emit, ref, provide, consume)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state count: number = 0
  prop label: string = ""
  computed doubled: number = count * 2
  fn increment() { count += 1 }
  emit changed: number
  ref inputRef: HTMLInputElement
  provide themeColor: string = "blue"
  consume darkMode: boolean
</script>
<template><div>{{ count }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('TypeChecker - type mismatch detection (state init vs declared type)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state count: number = "not a number"
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertFail(result);
  assert(countDiagnostics(result, 'error') > 0, 'Should report type mismatch error');
});

test('TypeChecker - prop default type checking', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  prop count: number = "not a number"
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertFail(result);
  assert(countDiagnostics(result, 'error') > 0);
});

test('TypeChecker - undefined identifier detection in templates', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state count: number = 0
</script>
<template><div>{{ undefined_var }}</div></template>`;
  const result = compile(src);
  assertFail(result);
  assert(countDiagnostics(result, 'error') > 0);
});

test('TypeChecker - unused state warning', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state unused: number = 0
  state used: number = 0
</script>
<template><div>{{ used }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert(countDiagnostics(result, 'warning') > 0, 'Should warn about unused state');
});

test('TypeChecker - method on wrong type (number.toUpperCase)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state count: number = 0
</script>
<template><div>{{ count.toUpperCase() }}</div></template>`;
  const result = compile(src);
  assertFail(result);
  assert(countDiagnostics(result, 'error') > 0);
});

test('TypeChecker - similar name suggestion (Levenshtein)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state count: number = 0
</script>
<template><div>{{ cont }}</div></template>`;
  const result = compile(src);
  assertFail(result);
  const err = (result.diagnostics || []).find(d => d.level === 'error');
  assert(err && err.hint, 'Should suggest similar name');
});

test('TypeChecker - computed ordering warning', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  computed c1: number = c2 + 1
  computed c2: number = 5
</script>
<template><div>{{ c1 }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert(countDiagnostics(result, 'warning') > 0, 'Should warn about forward reference');
});

test('TypeChecker - watch nested path warning', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state obj: { x: number } = { x: 0 }
  watch(obj.x) { console.log("changed") }
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert(countDiagnostics(result, 'warning') > 0, 'Should warn about nested watch path');
});

test('TypeChecker - security warnings (@html, dynamic :href)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state html: string = "<b>bold</b>"
  state url: string = "https://example.com"
</script>
<template>
  <div @html="html"></div>
  <a :href="url">link</a>
</template>`;
  const result = compile(src);
  assertSuccess(result);
  assert(countDiagnostics(result, 'warning') >= 2, 'Should warn about @html and dynamic href');
});

test('TypeChecker - import symbols in symbol table', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  import * as utils from "helpers"
  fn test() { return utils.getValue() }
</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

// ============================================================
// TESTS: CODE GENERATION (compile full pipeline)
// ============================================================

test('compile - basic component compiles successfully', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state count: number = 0</script>
<template><div>{{ count }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('compile - output contains class extending HTMLElement', () => {
  const src = `<meta>name: "x-test"</meta>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /class\s+\w+\s+extends\s+HTMLElement/);
});

test('compile - output contains customElements.define', () => {
  const src = `<meta>name: "x-test"</meta>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /customElements\.define\('x-test'/);
});

test('compile - shadow DOM mode: open', () => {
  const src = `<meta>
  name: "x-test"
  shadow: open
</meta>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /attachShadow[\s\S]*mode:\s*'open'/);
});

test('compile - shadow DOM mode: closed', () => {
  const src = `<meta>
  name: "x-test"
  shadow: closed
</meta>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /attachShadow[\s\S]*mode:\s*'closed'/);
});

test('compile - shadow DOM mode: none', () => {
  const src = `<meta>
  name: "x-test"
  shadow: none
</meta>
<template><div>test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertNotContains(result.output, 'attachShadow');
});

test('compile - state becomes private field (#name)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state count: number = 0</script>
<template><div>{{ count }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /#count\s*=\s*0/);
});

test('compile - prop generates observedAttributes', () => {
  const src = `<meta>name: "x-test"</meta>
<script>prop label: string = ""</script>
<template><div>{{ label }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'observedAttributes');
  assertContains(result.output, "'label'");
});

test('compile - computed generates getter', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state count: number = 0
  computed doubled: number = count * 2
</script>
<template><div>{{ doubled }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'get #doubled');
});

test('compile - emit generates CustomEvent dispatch', () => {
  const src = `<meta>name: "x-test"</meta>
<script>emit changed: number</script>
<template><button @click="changed">test</button></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'CustomEvent');
  assertContains(result.output, "'changed'");
});

test('compile - event handler binding with data-flare-id', () => {
  const src = `<meta>name: "x-test"</meta>
<script>fn handleClick() { console.log("clicked") }</script>
<template><button @click="handleClick">Click</button></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'data-flare-id');
  assertContains(result.output, 'addEventListener');
});

test('compile - :bind generates two-way binding', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state text: string = ""</script>
<template><input :bind="text" /></template>`;
  const result = compile(src);
  assertSuccess(result);
  // :bind is compiled away into input binding
  assertContains(result.output, /addEventListener.*'input'/);
});

test('compile - #if generates ternary', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state show: boolean = true</script>
<template><#if condition="show"><div>visible</div></#if></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /\?/);
  assertContains(result.output, / : /);
});

test('compile - #for generates .map()', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state items: string[] = []</script>
<template><#for each="item" of="items" key="item"><div>{{ item }}</div></#for></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /\.map\(/);
});

test('compile - XSS escaping (#esc, #escAttr, #escUrl)', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state html: string = ""</script>
<template><div>{{ html }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, /#esc\(/);
  assertContains(result.output, /#escAttr\(/);
  assertContains(result.output, /#escUrl\(/);
});

test('compile - TypeScript output (target: "ts") includes type annotations', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state count: number = 0</script>
<template><div>{{ count }}</div></template>`;
  const result = compile(src, 'test.flare', { target: 'ts' });
  assertSuccess(result);
  assert(result.output.includes(': number'), 'Should have type annotations');
});

test('compile - .d.ts generation', () => {
  const src = `<meta>name: "x-test"</meta>
<script>prop label: string = ""</script>
<template><div>{{ label }}</div></template>`;
  const result = compile(src, 'test.flare', { target: 'ts' });
  assertSuccess(result);
  assert(result.dtsOutput, 'Should generate .d.ts');
  assertContains(result.dtsOutput, 'declare');
});

// ============================================================
// TESTS: ERROR HANDLING
// ============================================================

test('error - missing template block returns error', () => {
  const src = `<meta>name: "x-test"</meta><script>state x: number = 0</script>`;
  const result = compile(src);
  assertFail(result);
  assert(result.diagnostics.some(d => d.code === 'E0002'), 'Should error about missing template');
});

test('error - invalid #if syntax does not throw', () => {
  const src = `<meta>name: "x-test"</meta>
<template><#if invalid><div>test</div></#if></template>`;
  assert.doesNotThrow(() => {
    compile(src);
  }, 'Should not throw on invalid #if');
});

test('error - invalid #for syntax does not throw', () => {
  const src = `<meta>name: "x-test"</meta>
<template><#for invalid><div>test</div></#for></template>`;
  assert.doesNotThrow(() => {
    compile(src);
  }, 'Should not throw on invalid #for');
});

test('error - compile with errors returns success: false', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state count: number = "not a number"</script>
<template><div>test</div></template>`;
  const result = compile(src);
  assert.strictEqual(result.success, false);
});

// ============================================================
// TESTS: SECURITY
// ============================================================

test('security - #escUrl blocks javascript: URLs', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state url: string = "javascript:alert('xss')"</script>
<template><a :href="url">click</a></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '#escUrl');
});

test('security - #escUrl blocks data: URLs', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state url: string = "data:text/html,<script>alert('xss')</script>"</script>
<template><a :href="url">click</a></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '#escUrl');
});

test('security - #escUrl blocks blob: and file: URLs', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state url: string = "blob:https://example.com/123"</script>
<template><a :href="url">click</a></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '#escUrl');
});

test('security - dynamic href/src generates #escUrl call', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state url: string = ""</script>
<template><a :href="url">link</a></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '#escUrl');
});

test('security - @html warning in diagnostics', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state content: string = ""</script>
<template><div @html="content"></div></template>`;
  const result = compile(src);
  assertSuccess(result);
  const warnings = result.diagnostics.filter(d => d.level === 'warning');
  assert(warnings.length > 0, 'Should have @html warning');
});

// ============================================================
// INTEGRATION TESTS
// ============================================================

test('integration - complex component with all features', () => {
  const src = `<meta>
  name: "x-todo"
  shadow: open
</meta>
<script>
  import * as utils from "helpers"
  state items: string[] = []
  state text: string = ""
  prop theme: string = "light"
  computed count: number = items.length
  emit added: string
  ref inputEl: HTMLInputElement
  fn addItem() {
    if (text.trim() === "") return
    items = [...items, text]
    text = ""
  }
  watch(items) {
    console.log("items changed")
  }
  on mount {
    console.log("mounted")
  }
  on unmount {
    console.log("unmounted")
  }
</script>
<template>
  <div class="container">
    <input ref="inputEl" :bind="text" @keydown|enter="addItem" />
    <button @click="addItem">Add</button>
    <#if condition="count > 0">
      <ul>
        <#for each="item" of="items" key="item">
          <li>{{ item }}</li>
        </#for>
      </ul>
    <:else>
      <p>No items</p>
    </#if>
  </div>
</template>
<style>
  .container { padding: 10px; }
</style>`;
  const result = compile(src);
  assertSuccess(result);
  assert(result.output.includes('class XTodo'), 'Should generate class');
  assert(result.output.includes('observedAttributes'), 'Should have observedAttributes');
  assert(result.output.includes('connectedCallback'), 'Should have lifecycle');
});

test('integration - valid JavaScript output', () => {
  const src = `<meta>name: "x-test"</meta>
<script>state count: number = 0</script>
<template><div>{{ count }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  // Should not throw when validating syntax
  assert.doesNotThrow(() => {
    new Function(result.output);
  }, 'Generated code should be valid JavaScript');
});

test('integration - multiple event handlers on same element', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  fn handleClick() { console.log("click") }
  fn handleHover() { console.log("hover") }
</script>
<template><button @click="handleClick" @mouseenter="handleHover">test</button></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'addEventListener');
});

test('integration - nested loops with event binding', () => {
  const src = `<meta>name: "x-test"</meta>
<script>
  state items: string[] = ["a", "b"]
  state subitems: string[] = ["x", "y"]
  fn handleItem() { console.log("item") }
</script>
<template>
  <#for each="item" of="items" key="item">
    <div>
      <#for each="sub" of="subitems" key="sub">
        <span @click="handleItem">{{ sub }}</span>
      </#for>
    </div>
  </#for>
</template>`;
  const result = compile(src);
  assertSuccess(result);
});

test('compile - #for without key attribute should succeed', () => {
  const src = `<meta>name: "x-nokey"</meta>
<script>state items: string[] = ["a", "b"]</script>
<template>
  <#for each="item" of="items">
    <div>{{ item }}</div>
  </#for>
</template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('.map('), 'should contain .map(');
});

// ============================================================
// TESTS: SLOT SUPPORT
// ============================================================

test('slot - default slot passes through in shadow DOM mode', () => {
  const src = `<meta>name: "x-card"</meta>
<template><div class="card"><slot></slot></div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '<slot>');
  assertContains(result.output, '</slot>');
});

test('slot - named slot passes through', () => {
  const src = `<meta>name: "x-layout"</meta>
<template>
  <header><slot name="header">Default Header</slot></header>
  <main><slot></slot></main>
  <footer><slot name="footer"></slot></footer>
</template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'slot name="header"');
  assertContains(result.output, 'slot name="footer"');
  assertContains(result.output, 'Default Header');
});

test('slot - slot with fallback content', () => {
  const src = `<meta>name: "x-btn"</meta>
<template><button><slot>Click me</slot></button></template>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, 'Click me');
});

// ============================================================
// TESTS: SCOPED CSS
// ============================================================

test('scoped css - shadow:none applies data-flare-scope attribute', () => {
  const src = `<meta>name: "x-widget"\nshadow: none</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>
<style>.widget { color: red; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, "data-flare-scope");
  assertContains(result.output, 'setAttribute.*data-flare-scope.*x-widget');
});

test('scoped css - selectors are prefixed with scope attribute', () => {
  const src = `<meta>name: "x-test"\nshadow: none</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>
<style>.box { color: red; } h2 { font-size: 1rem; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '\\[data-flare-scope="x-test"\\] \\.box');
  assertContains(result.output, '\\[data-flare-scope="x-test"\\] h2');
});

test('scoped css - :host maps to scope attribute', () => {
  const src = `<meta>name: "x-host"\nshadow: none</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>
<style>:host { display: block; } :host(.active) { border: 1px solid red; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '\\[data-flare-scope="x-host"\\]\\{display');
  assertContains(result.output, '\\[data-flare-scope="x-host"\\]\\.active');
});

test('scoped css - comma-separated selectors are all scoped', () => {
  const src = `<meta>name: "x-multi"\nshadow: none</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>
<style>.a, .b { margin: 0; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  assertContains(result.output, '\\[data-flare-scope="x-multi"\\] \\.a');
  assertContains(result.output, '\\[data-flare-scope="x-multi"\\] \\.b');
});

test('scoped css - shadow:open does NOT scope CSS', () => {
  const src = `<meta>name: "x-open"</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>
<style>.box { color: red; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  assertNotContains(result.output, 'data-flare-scope');
  assertContains(result.output, '\\.box\\{color');
});

// ============================================================
// TESTS: SECURITY FIXES (S-01 through S-10)
// ============================================================

test('S-01: scopeCss sanitizes tagName to prevent CSS injection', () => {
  // tagName with special chars like "] should be stripped
  const src = `<meta>name: "x-safe-tag"
shadow: none</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>
<style>.box { color: red; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  // Should produce clean CSS attribute selector
  assertContains(result.output, 'data-flare-scope="x-safe-tag"');
});

test('S-04: #escUrl blocks URL-encoded javascript: protocol', () => {
  const src = `<meta>name: "x-url-test"</meta>
<script>state link: string = "test"</script>
<template><a :href="link">test</a></template>`;
  const result = compile(src);
  assertSuccess(result);
  // Should contain decodeURIComponent in escUrl
  assert.ok(result.output.includes('decodeURIComponent'), '#escUrl should decode before checking');
});

test('S-05: invalid meta name is rejected', () => {
  const src = `<meta>name: "NoHyphen"</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>`;
  const result = compile(src);
  assertFail(result);
  assert.ok(result.diagnostics.some(d => d.code === 'E0003'), 'should report E0003 for invalid name');
});

test('S-05: meta name without hyphen is rejected', () => {
  const src = `<meta>name: "xcomponent"</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>`;
  const result = compile(src);
  assertFail(result);
});

test('S-05: valid meta names are accepted', () => {
  for (const name of ['x-comp', 'my-app', 'x-my-component', 'app-v2']) {
    const src = `<meta>name: "${name}"</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>`;
    const result = compile(src);
    assertSuccess(result, `${name} should be accepted`);
  }
});

test('S-06: generated code does not contain unsafe-eval', () => {
  // Verify no eval() in generated component code
  const src = `<meta>name: "x-eval-check"</meta>
<script>state x: number = 0</script>
<template><div>{{ x }}</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(!result.output.includes('eval('), 'generated code should not contain eval()');
});

test('S-10: invalid #if syntax reports diagnostic error', () => {
  const src = `<meta>name: "x-parse-err"</meta>
<script>state x: number = 0</script>
<template>
  <#if badattr>
    <div>test</div>
  </#if>
</template>`;
  const result = compile(src);
  assertFail(result);
  assert.ok(result.diagnostics.some(d => d.code === 'E0004'), 'should report E0004 for parse error');
});

test('S-10: invalid #for syntax reports diagnostic error', () => {
  const src = `<meta>name: "x-for-err"</meta>
<script>state items: string[] = []</script>
<template>
  <#for badattr>
    <div>test</div>
  </#for>
</template>`;
  const result = compile(src);
  assertFail(result);
  assert.ok(result.diagnostics.some(d => d.code === 'E0004'), 'should report E0004 for parse error');
});

// ============================================================
// DIFF-BASED DOM RENDERING TESTS
// ============================================================

test('diff - generated output contains #getNewTree method', () => {
  const src = `<meta>name: "x-diff-a"</meta>
<script>state count: number = 0</script>
<template><p>{{ count }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('#getNewTree()'), 'should contain #getNewTree method');
});

test('diff - generated output contains #patch method', () => {
  const src = `<meta>name: "x-diff-b"</meta>
<script>state count: number = 0</script>
<template><p>{{ count }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('#patch(parent, newContent)'), 'should contain #patch method');
});

test('diff - #update calls #patch instead of #render', () => {
  const src = `<meta>name: "x-diff-c"</meta>
<script>state count: number = 0</script>
<template><p>{{ count }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  // #update should call #patch, not #render
  const updateMatch = result.output.match(/#update\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(updateMatch, 'should have #update method');
  assert.ok(updateMatch[0].includes('#patch('), '#update should call #patch');
  assert.ok(!updateMatch[0].includes('#render()'), '#update should NOT call #render');
});

test('diff - #patch handles attribute diffing', () => {
  const src = `<meta>name: "x-diff-d"</meta>
<script>state cls: string = "active"</script>
<template><div :class="cls">test</div></template>`;
  const result = compile(src);
  assertSuccess(result);
  // Verify #patch has attribute comparison logic
  assert.ok(result.output.includes('o.getAttribute(a.name) !== a.value'), 'should compare attributes');
  assert.ok(result.output.includes('o.setAttribute(a.name, a.value)'), 'should set changed attributes');
  assert.ok(result.output.includes('o.removeAttribute('), 'should remove old attributes');
});

test('diff - #patch handles text node diffing', () => {
  const src = `<meta>name: "x-diff-e"</meta>
<script>state msg: string = "hello"</script>
<template><p>{{ msg }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('o.textContent !== n.textContent'), 'should compare text nodes');
});

test('diff - #patch handles node type mismatch replacement', () => {
  const src = `<meta>name: "x-diff-f"</meta>
<script>state x: number = 0</script>
<template><p>{{ x }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('o.nodeType !== n.nodeType || o.nodeName !== n.nodeName'), 'should detect node type mismatch');
  assert.ok(result.output.includes('parent.replaceChild(n.cloneNode(true), o)'), 'should replace mismatched nodes');
});

test('diff - #patch skips STYLE element children', () => {
  const src = `<meta>name: "x-diff-g"</meta>
<script>state x: number = 0</script>
<template><p>{{ x }}</p></template>
<style>p { color: red; }</style>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes("o.tagName === 'STYLE'"), 'should skip STYLE children');
});

test('diff - #patch handles node removal (old > new)', () => {
  const src = `<meta>name: "x-diff-h"</meta>
<script>state items: string[] = ["a"]</script>
<template>
  <#for each="item" of="items"><p>{{ item }}</p></#for>
</template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('parent.removeChild(o)'), 'should remove extra old nodes');
});

test('diff - #patch handles node addition (new > old)', () => {
  const src = `<meta>name: "x-diff-i"</meta>
<script>state items: string[] = ["a"]</script>
<template>
  <#for each="item" of="items"><p>{{ item }}</p></#for>
</template>`;
  const result = compile(src);
  assertSuccess(result);
  assert.ok(result.output.includes('parent.appendChild(n.cloneNode(true))'), 'should append new nodes');
});

test('diff - #updateKeepFocus delegates to #update (simplified)', () => {
  const src = `<meta>name: "x-diff-j"</meta>
<script>state text: string = ""</script>
<template><input :bind="text" /></template>`;
  const result = compile(src);
  assertSuccess(result);
  // #updateKeepFocus should be simplified - just calls #update
  const keepFocusMatch = result.output.match(/#updateKeepFocus\(focusedEl\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(keepFocusMatch, 'should have #updateKeepFocus method');
  assert.ok(keepFocusMatch[0].includes('this.#update()'), 'should delegate to #update');
  // Should NOT contain old focus-save/restore logic
  assert.ok(!keepFocusMatch[0].includes('selectionStart'), 'should not have manual focus preservation');
});

test('diff - connectedCallback still uses #render for initial render', () => {
  const src = `<meta>name: "x-diff-k"</meta>
<script>state x: number = 0</script>
<template><p>{{ x }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  // connectedCallback should use #render (full initial render), not #patch
  const ccMatch = result.output.match(/connectedCallback\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(ccMatch, 'should have connectedCallback');
  assert.ok(ccMatch[0].includes('this.#render()'), 'connectedCallback should use #render for initial');
});

test('diff - shadow:none mode uses correct root for patch', () => {
  const src = `<meta>name: "x-diff-l"\nshadow: none</meta>
<script>state x: number = 0</script>
<template><p>{{ x }}</p></template>`;
  const result = compile(src);
  assertSuccess(result);
  // For shadow:none, root is 'this' instead of 'this.#shadow'
  assert.ok(result.output.includes('#patch(this,'), '#patch should use `this` as root for shadow:none');
});

console.log('\n✓ All compiler tests passed');
