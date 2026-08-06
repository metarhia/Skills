---
name: js-data-structures
description: Choose and use native JavaScript collections for Big-O, readability, semantics, naming, stability, or testability. Use when working with Map, Object, Set, Array, WeakMap, WeakSet, TypedArray, or deciding among built-in collections. For custom queues, lists, heaps, tries, and related structures, use the data-structures skill.
---

# Native Data Structures (JavaScript)

## Choosing a native collection

- Fixed schema / DTO / JSON: use `Object` (avoid `Map`, no `JSON.stringify`)
- Dynamic string-to-value dict: use `Map` or `Object.create(null)` (avoid plain `{}` if keys are user input)
- Non-string keys, insertion order, `.size`: use `Map` (avoid `Object`)
- Ordered list, index access, transform: use `Array` (avoid `Set`, no indexes)
- Unique values, fast membership: use `Set` (avoid `Array.includes` on large/dynamic sets)
- Attach data to objects without retaining them: use `WeakMap` (avoid `Map`, leaks)
- Track object presence without retaining: use `WeakSet` (avoid `Set`, leaks)
- Numeric / binary data, I/O, crypto: use TypedArray / `ArrayBuffer` (avoid `number[]` for hot binary work)
- Hot queue / deque / stack ends: do not rely on `Array.shift`/`unshift` — use a custom ring or linked structure

## Complexity and code characteristics

Choose a structure for the property you need to control — not only for speed.

**Big-O (typical average case; n = collection size):**

- `Object` field access: O(1) for fixed shapes; dynamic/`delete`-heavy objects degrade toward dictionary mode
- `Array` index get/set, `push`/`pop`: O(1); `includes`/`indexOf`/`splice`/`shift`/`unshift`: O(n)
- `Map` get/set/has/delete, `Set` add/has/delete: amortized O(1); iteration: O(n)
- `WeakMap`/`WeakSet` get/set/has/delete: amortized O(1); no iteration
- TypedArray index get/set: O(1); grow/copy: O(n)
- Prefer the structure whose hot operation is O(1); measure before optimizing rare paths

**Readability and semantics:**

- Let the type state the intent: `Set` = unique membership; `Map` = keyed registry; `Array` = ordered sequence; plain `Object` = record/DTO
- Prefer a named collection over encoding the same idea in ad-hoc flags, parallel arrays, or stringly keys
- Use array methods (`.map`, `.filter`, `.reduce`) when they match the transform; use explicit loops when control flow or performance matters
- Avoid over-abstracting: a small static `Array` allowlist is clearer than a `Set` used once

**Naming:**

- Plural names for collections (`users`, `sessions`); singular for entities (`user`)
- Name by role, not by type: `seenIds` (Set), `socketToSession` (Map) — not `set1` / `mapData`
- Boolean membership reads as `has`/`is`: `if (seen.has(id))`, `blocked.has(user)`
- Include units in size names (`sizeBytes`, `timeoutMs`) when the collection holds measured quantities

**Stability and contracts:**

- Treat inputs as immutable at API boundaries; copy or freeze when you must share
- Prefer stable iteration order when callers rely on it (`Map`/`Set`/`Array` insertion order)
- Keep record shapes and array element kinds stable over time (see per-structure V8 hints)
- Document whether a returned collection is live (shared) or a snapshot

**Testability:**

- Prefer pure functions over collections: same inputs, same outputs; inject maps/sets as arguments when state is required
- Favor deterministic structures in tests: plain data over WeakMap (non-enumerable), over insertion-timed WeakRef behavior
- Assert on observable contents (`[...set]`, `Object.fromEntries(map)`, length/size) rather than private fields
- Small fixtures: build with literals/`Object.freeze` when the shape should not change under test

**Encapsulation, safety, operability:**

- Hide representation behind a small API (`add`/`has`, getters) so internals can change without call-site churn
- Use `Object.create(null)` or `Map` for untrusted keys (prototype-pollution safety)
- Use WeakMap/WeakSet when lifetime must follow the key (leak control)
- Cap growth (max size, TTL, eviction) for long-lived Maps/Sets; unbounded collections are operability bugs
- Pick serializable structures (`Object`/`Array`) at I/O boundaries; convert `Map`/`Set` explicitly

## Object

Use for records with a known, stable shape (config, entities, options).

```javascript
const user = { id: 1, name: 'Ada', active: true };

// Pure dictionary (no prototype pollution via __proto__)
const dict = Object.create(null);
dict[key] = value;
```

**Hints:**

- Keep a stable shape (hidden class): same keys, types, and key order; init once in a factory/constructor
- Prefer fixed access (`obj.x`) over dynamic keys (`obj[key]`) when the schema is known
- Do not `delete` fields; set `null` for refs, `undefined` for primitives
- Objects that share a property should share the full shape — avoid polymorphic property reads
- `for...in` is slow on hot paths; prefer `Object.keys` / `Object.entries`

## Array

Use for ordered sequences, stacks (`push`/`pop`), and small membership checks.

```javascript
const ids = [10, 20, 30];
ids.push(40);
const last = ids.pop();

const ALLOWED = ['read', 'write'];
if (ALLOWED.includes(role)) {
  /* ... */
}
```

**Hints:**

- Keep arrays dense and monomorphic (one element kind): SMI ints, doubles, or objects — do not mix
- Prefer SMI-friendly integers (31-bit signed) for indexes/counters (`PACKED_SMI_ELEMENTS`); a float, `NaN`, or hole promotes the whole array
- Avoid holey arrays (`new Array(n)`, deletes, skips); build with `push` or fill sequentially
- Avoid `shift()` / `unshift()` in hot paths; use a queue or index cursors
- Prefer `for` / `for...of` in hot loops; avoid array destructuring in hot assignments

## Map

Use for dynamic key-value stores with any key type and predictable iteration.

```javascript
const sessions = new Map();
sessions.set(socket, { userId: 42 });
sessions.set('fallback', null);

for (const [key, value] of sessions) {
  // insertion order
}
sessions.delete(socket);
console.log(sessions.size);
```

**Hints:**

- Dynamic keys on `Map` avoid dictionary-mode / shape pollution on `{}`
- Values read on hot paths should still use stable shapes
- `NaN` is a valid single key; object keys compare by reference
- No `JSON.stringify` — use `Object.fromEntries(map)` only if keys are strings

## Set

Use for unique values and fast membership.

```javascript
const seen = new Set();
for (const id of incoming) {
  if (seen.has(id)) continue;
  seen.add(id);
  process(id);
}

const unique = [...new Set(items)];
```

**Hints:**

- Uniqueness is by reference for objects, not deep value
- Insertion-order iteration; no index access
- Array/Set conversion allocates — do it at boundaries, not in hot loops

## WeakMap / WeakSet

Weak collections hold keys weakly so entries can be GC'd when the key is otherwise unreachable. Keys must be objects or symbols. Not iterable; no `.size`.

```javascript
const meta = new WeakMap();
const tracked = new WeakSet();

const attach = (obj, data) => {
  meta.set(obj, data);
  tracked.add(obj);
};
```

**Hints:**

- Prefer WeakMap side tables over adding ad-hoc fields to host objects
- Cannot enumerate — keep a strong list only if you must iterate
- `WeakRef` / `FinalizationRegistry` are for lifetime hooks, not general storage

## Typed arrays

Use for contiguous numeric/binary data: network frames, files, crypto, image/audio, WASM.

- `Uint8Array` — bytes, I/O, hashing
- `Int16Array` / `Uint16Array` — PCM, compact IDs
- `Uint32Array` / `Int32Array` — indexes, bitsets, WASM i32
- `Float32Array` / `Float64Array` — geometry, signals, tensors
- `BigInt64Array` / `BigUint64Array` — 64-bit IDs, timestamps
- `DataView` — endian-aware protocol parsing
- `ArrayBuffer` / `SharedArrayBuffer` — backing store; SAB for workers

```javascript
const buf = new ArrayBuffer(16);
const bytes = new Uint8Array(buf);
const view = new DataView(buf);
view.setUint32(0, 0xdeadbeef, true);
bytes[4] = 0xff;
const frame = bytes.subarray(0, 8); // shared memory; `slice` copies
```

**Hints:**

- Fixed length — size ahead or allocate larger and copy to grow
- Prefer typed arrays over `number[]` for tight numeric loops (stable element type)
- Use `DataView` for wire endianness; multi-byte typed views are platform-endian
- Reuse/pool buffers in hot paths; Node `Buffer` is a `Uint8Array` — prefer `Uint8Array` in shared code unless you need Buffer APIs

## Conventions

- Keep hot code monomorphic: stable argument count, types, return types, and object shapes
- Prefer SMI integers for indexes/sizes; do not mix ints and floats in one variable
- Reduce GC pressure: reuse arrays, objects, and buffers when safe
- Move reusable callbacks outside loops; keep `try/catch` and spread out of hot loops
