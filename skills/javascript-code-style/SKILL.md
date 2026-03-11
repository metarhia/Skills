---
name: javascript-code-style
description: Apply Metarhia JavaScript style (eslint-config-metarhia). Use when writing or editing .js files and .ts (with certain corrections for typescript) files, formatting code, or when the user asks about code style or linting.
---

# JavaScript Code Style (eslint-config-metarhia)

Use `npm run lint` (or `npm run fix`) before AI fixes to enforce algorithmic fixes to prevent using AI model when we can use just eslint and prettier to follow **eslint-config-metarhia**.
Also follow this skill conventions when you writing js/ts code. Key conventions:

## Formatting

- **Quotes**: Single quotes; template literals allowed where needed.
- **Semicolons**: Always.
- **Line length**: Max 80 characters (ignore URLs).
- **Indent**: Handled by Prettier (eslint-config-metarhia uses eslint-config-prettier).
- **Braces**: 1tbs, `allowSingleLine: true` for single-line blocks.
- **Commas**: Trailing commas in multiline (arrays, objects, params).
- **Spacing**: Space before blocks, no space before function paren for named functions; space for anonymous/arrow.
- Add empty line between semantic blocks for visual separation
- Use `camelCase` for variables and parameters, `UpperCamelCase` for classes and types
- Use `UPPER_SNAKE_CASE` for constants

## Best practices

- Use intermediate variables instead of multiline expressions
- Don't change values in incoming parameters writing functions
- Decompose complex functions (more than 30 lines but prefer 10-20 lines function)
- Decompose long expressions, prefer one-line expressions, especially in if-statements
- Respect separation of concerns and single responsibility principle
- Prefer `const`, minimize `let` usage, do not use `var`
- Prefer arrow functions (do not use function keyword except cases of prototype paradigm)
- Use round brackets even for single argument lambda functions
- Optimize loop invariant: move everything not changing out of loops
- Optimize lexical scope, minimize area of identifier visibility
- Prefer `for..of` loops, use classical `for` loops (c-style) for performance and `for..of` for readability, avoid `for..in`
- Use `.map`, `.filter`, `.reduce` and other iteration methods if it is good for code semantic
- Try to avoid `.forEach` except case when passed callback do not read something from outer context
- Return result of logical expression instead of `return true; else return false;`
- **Equality**: avoid type conversions in equality expressions, use `===` and `!==` only (`eqeqeq: always`)
- Use curly braces for multi-line or when one branch has braces (`curly: multi-line, consistent`)
- Consistent return; treat undefined as unspecified (`consistent-return`)
- **Variables**: No shadowing of restricted names; no use before define (functions allowed to be used before define)
- **No**: useless concat, unmodified loop condition, self-compare, return-assign (assignment in return)
- Self-documented and self-descriptive code: do not add comments, code should be clear without comments

## Structure

- **Nested callbacks**: Max depth 5 (`max-nested-callbacks`), prefer named functions for multiline callbacks except cases where in-line callbacks gives us readability
- **Constructors**: `new` with Cap; capIsNew for constructors
- **Operators**: avoid nested `?` operators

## Optimizations

Optimize code for V8:

- Preserve object shape (all keys and value types including key order) to force V8 use monomorphic code optimizations
  - We can change object shape just in constructors and creational GoF patterns
  - Avoid mix-ins and `delete` operator
  - We can use shape mutations just for metaprogramming
- Empty value for primitive types and reference types:
  - Use null for empty reference types: Object, Function, Array, etc...
  - Use undefined for empty primitive types: string, number, boolean, bigint
- Avoid array destructuring in assignments `const [uno, due] = array;` and loops `for ([uno, due] of list)`
- Object destructuring is ok: `const { uno, due } = collection;` or `for (const { name, price } of basket)`

## Good and bad cases for union types based on JavaScript V8 optimizations:

- Good cases:
  - Union of strings instead of enum: `type Direction = 'north' | 'south' | 'east' | 'west';`
  - Union of numeric as status or result code: `type StatusCode = 200 | 201 | 204 | 400 | 500;`
  - Union with shared properties: `type MailTarget = User | Company;` (both with email)
  - Union with common method: `type Thenable = Promise | Query;` (both with then method)
- Bad cases for union types:
  - Polymorphic object shapes causing deopts: `type Something = User | Socket | string;`
  - Requiring extensive "if"-logic and type checking: `type Input = string | number | boolean;`
  - Inconsistent return types: `function getData(id: number): string | string[];`
  - Mixed primitives and objects: `type Value = number | { value: number };`
  - Contradictory members: `type Person = { name: string; } | { name: number[] };`
  - Union types that include any: `type FlexibleType = number | any;`
  - Incompatible contracts: `type Handler = (() => string) | ((event: Event, data: any) => void);`
  - Avoid mixing symbols with other types in unions

## Verification

- Run `npm run lint` before committing.
- Run `npm run fix` to auto-fix when possible.
- Run `npm t` to run tests and detect runtime bugs.
