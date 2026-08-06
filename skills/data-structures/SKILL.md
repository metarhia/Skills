---
name: data-structures
description: Implements custom JavaScript data structures: queues, deques, stacks, linked lists, cons lists, circular buffers, unrolled lists, tries, heaps, graphs, LRU caches, CRDTs, pools, structs. Use when building or choosing non-native collections, optimizing enqueue/dequeue, designing persistent lists, or when the user asks for data structures beyond Map/Set/Array/Object.
---

# Custom Data Structures (JavaScript)

## Complexity and code characteristics

Choose a structure for the property you need to control — not only for speed.

**Big-O (typical; n = size, k = key/word length):**

- Singly-linked push/pop at head: O(1); search / index: O(n)
- Doubly-linked append/prepend / splice at known node: O(1); index: O(n) (nearer-end walk helps)
- Cons `prepend` / `uncons`: O(1); `reverse` / `map` / random access: O(n); tails share structure
- CircularBuffer / Queue / Deque / Stack ends: amortized O(1); grow rare O(n); never hot `Array.shift`
- UnrolledList enqueue/dequeue: amortized O(1); better locality than per-item nodes; pool cuts allocs
- BST insert/search: O(log n) balanced, O(n) skewed; in-order: O(n)
- Binary heap push/pop: O(log n); peek: O(1)
- Trie insert/has: O(k); autocomplete: O(matches × k)
- Adjacency-list addEdge: O(1); BFS/DFS: O(V + E)
- LRU (Map) get/set/evict: O(1); G-Counter inc O(1), merge O(replicas); Pool capture O(1) amortized
- Prefer the structure whose hot operation is O(1) or O(log n); measure before optimizing rare paths

**Readability and semantics:**

- Name by role: `pending` (Queue), `frontier` (Deque), `undo` (Stack) — not `buffer1`
- Type states intent: ring/unrolled = throughput; cons = persistent; heap = priority; trie = prefix
- Small public API (`enqueue`/`dequeue`) — do not expose nodes or buffers

**Stability and contracts:**

- Return copies or iterators; document live vs snapshot and iteration order
- Cap growth (capacity, pool size, LRU max); unbounded queues/caches are operability bugs
- Immutable Cons/Struct: updates are new values (`prepend`, `fork`); mutable lists document aliasing

**Testability:**

- Assert on contents (`[...q]`, `toArray()`, size), not private fields; keep `Symbol.iterator`
- Deterministic fixtures; inject clocks/timeouts for Pool waiters

**Encapsulation and cost:**

- Hide representation so callers survive swaps (array → ring → unrolled)
- Amortized grow and node pools trade memory for latency; clear slots on dequeue for GC
- Power-of-2 ring capacity; index with `& (len - 1)` instead of `%`

## Lists

Singly-linked (push/pop at head):

```javascript
class LinkedList {
  #head = null;
  #length = 0;

  push(data) {
    this.#head = { data, next: this.#head };
    this.#length++;
  }

  pop() {
    if (!this.#head) return undefined;
    const { data } = this.#head;
    this.#head = this.#head.next;
    this.#length--;
    return data;
  }

  *[Symbol.iterator]() {
    let node = this.#head;
    while (node) {
      yield node.data;
      node = node.next;
    }
  }
}
```

Doubly-linked list ideas:

- `#head` / `#tail` / `#size`; nodes `{ value, prev, next }` (fixed key order)
- Resolve index from nearer end; splice ranges by relinking, not rebuild
- Ops worth adding: `append`/`prepend`/`insert`/`delete`, `rotate`, `move`, `slice`/`take`/`drop`, `reverse`, `groupBy` → `Map` of lists
- `Symbol.iterator`; `toArray` only at boundaries

Immutable cons list ideas:

- Cell `{ value, next, size }` + singleton empty; `prepend` returns a new cell (share the old list)
- Build from arrays backwards; merge by prepending earlier lists onto the last
- Prefer for persistent pipelines; use mutable doubly-linked for mid-list edits

## Circular Buffer

Growable ring, power-of-2 capacity, bitmask index — backing for Queue / Deque / Stack:

```javascript
class CircularBuffer {
  #buffer = new Array(16);
  #head = 0;
  #size = 0;

  get size() {
    return this.#size;
  }

  #grow() {
    const cap = this.#buffer.length;
    const mask = cap - 1;
    const next = new Array(cap * 2);
    for (let i = 0; i < this.#size; i++) {
      next[i] = this.#buffer[(this.#head + i) & mask];
    }
    this.#buffer = next;
    this.#head = 0;
  }

  push(value) {
    if (this.#size === this.#buffer.length) this.#grow();
    const m = this.#buffer.length - 1;
    this.#buffer[(this.#head + this.#size) & m] = value;
    this.#size++;
  }

  unshift(value) {
    if (this.#size === this.#buffer.length) this.#grow();
    const m = this.#buffer.length - 1;
    this.#head = (this.#head - 1) & m;
    this.#buffer[this.#head] = value;
    this.#size++;
  }

  shift() {
    if (!this.#size) return undefined;
    const m = this.#buffer.length - 1;
    const v = this.#buffer[this.#head];
    this.#buffer[this.#head] = undefined;
    this.#head = (this.#head + 1) & m;
    this.#size--;
    return v;
  }

  pop() {
    if (!this.#size) return undefined;
    const m = this.#buffer.length - 1;
    const i = (this.#head + this.#size - 1) & m;
    const v = this.#buffer[i];
    this.#buffer[i] = undefined;
    this.#size--;
    return v;
  }

  at(index) {
    const i = index < 0 ? this.#size + index : index;
    if (i < 0 || i >= this.#size) return undefined;
    return this.#buffer[(this.#head + i) & (this.#buffer.length - 1)];
  }
}
```

Ideas: clear slots on remove (GC); `fromArray` with capacity `2^k > n`; iterate `(head + i) & mask`.

## Queue / Deque / Stack

Compose on CircularBuffer — never hot `Array.shift()`:

```javascript
class Queue {
  #buf = new CircularBuffer();
  enqueue(v) {
    this.#buf.push(v);
  }
  dequeue() {
    return this.#buf.shift();
  }
  peek() {
    return this.#buf.at(0);
  }
  get size() {
    return this.#buf.size;
  }
}

class Deque {
  #buf = new CircularBuffer();
  push(v) {
    this.#buf.push(v);
  }
  pop() {
    return this.#buf.pop();
  }
  unshift(v) {
    this.#buf.unshift(v);
  }
  shift() {
    return this.#buf.shift();
  }
}

class Stack {
  #buf = new CircularBuffer();
  push(v) {
    this.#buf.push(v);
  }
  pop() {
    return this.#buf.pop();
  }
  peek() {
    return this.#buf.at(-1);
  }
}
```

## Unrolled List

Linked fixed-size buffers + node pool (high-throughput queue):

```javascript
class UnrolledNode {
  constructor(size) {
    this.buffer = new Array(size);
    this.size = size;
    this.readIndex = 0;
    this.writeIndex = 0;
    this.length = 0;
    this.next = null;
  }
  enqueue(item) {
    if (this.writeIndex >= this.size) return false;
    this.buffer[this.writeIndex++] = item;
    this.length++;
    return true;
  }
  dequeue() {
    if (!this.length) return undefined;
    const i = this.readIndex++;
    const item = this.buffer[i];
    this.buffer[i] = undefined;
    this.length--;
    return item;
  }
  reset() {
    this.readIndex = this.writeIndex = this.length = 0;
    this.next = null;
  }
}
```

Ideas: pool of N nodes (`acquire`/`release`); enqueue grows a new node when full; dequeue releases empty tail nodes back to the pool; typical `nodeSize` 1024.

## Binary Search Tree

```javascript
class BinarySearchTree {
  constructor(data) {
    this.data = data;
    this.left = null;
    this.right = null;
  }

  insert(data) {
    if (data < this.data) {
      if (this.left) this.left.insert(data);
      else this.left = new BinarySearchTree(data);
    } else {
      if (this.right) this.right.insert(data);
      else this.right = new BinarySearchTree(data);
    }
  }

  *inOrder() {
    if (this.left) yield* this.left.inOrder();
    yield this.data;
    if (this.right) yield* this.right.inOrder();
  }
}
```

## Heap / Priority Queue

```javascript
class MinHeap {
  #data = [];

  #parent(i) {
    return (i - 1) >> 1;
  }
  #left(i) {
    return 2 * i + 1;
  }
  #right(i) {
    return 2 * i + 2;
  }
  #swap(i, j) {
    [this.#data[i], this.#data[j]] = [this.#data[j], this.#data[i]];
  }

  push(value) {
    this.#data.push(value);
    let i = this.#data.length - 1;
    while (i > 0 && this.#data[i] < this.#data[this.#parent(i)]) {
      this.#swap(i, this.#parent(i));
      i = this.#parent(i);
    }
  }

  pop() {
    const top = this.#data[0];
    const last = this.#data.pop();
    if (this.#data.length === 0) return top;
    this.#data[0] = last;
    let i = 0;
    while (true) {
      let smallest = i;
      const l = this.#left(i),
        r = this.#right(i);
      if (l < this.#data.length && this.#data[l] < this.#data[smallest])
        smallest = l;
      if (r < this.#data.length && this.#data[r] < this.#data[smallest])
        smallest = r;
      if (smallest === i) break;
      this.#swap(i, smallest);
      i = smallest;
    }
    return top;
  }

  get size() {
    return this.#data.length;
  }
}
```

## LRU Cache

```javascript
class LRUCache {
  #capacity;
  #cache = new Map();

  constructor(capacity) {
    this.#capacity = capacity;
  }

  get(key) {
    if (!this.#cache.has(key)) return undefined;
    const value = this.#cache.get(key);
    this.#cache.delete(key);
    this.#cache.set(key, value);
    return value;
  }

  set(key, value) {
    this.#cache.delete(key);
    this.#cache.set(key, value);
    if (this.#cache.size > this.#capacity) {
      this.#cache.delete(this.#cache.keys().next().value);
    }
  }
}
```

## Trie (prefix tree)

`Object.create(null)` nodes + `Symbol` terminal (no char-key collisions). Ideas: store values, `#size`, autocomplete, prune empty branches on delete:

```javascript
const VALUE = Symbol('value');

class Trie {
  #root = Object.create(null);
  #size = 0;

  insert(word, value = true) {
    let node = this.#root;
    for (const ch of word) node = node[ch] ??= Object.create(null);
    if (!Object.hasOwn(node, VALUE)) this.#size++;
    node[VALUE] = value;
  }

  has(word) {
    const n = this.#find(word);
    return n !== null && Object.hasOwn(n, VALUE);
  }

  complete(prefix) {
    const node = this.#find(prefix);
    if (!node) return [];
    const out = [];
    (function walk(n, path) {
      if (Object.hasOwn(n, VALUE)) out.push(path);
      for (const ch of Object.keys(n)) walk(n[ch], path + ch);
    })(node, prefix);
    return out;
  }

  #find(word) {
    let node = this.#root;
    for (const ch of word) {
      node = node[ch];
      if (!node) return null;
    }
    return node;
  }
}
```

Delete idea: walk path storing parents; remove `VALUE`; walk up deleting children with no `VALUE` and no keys.

## Graph (adjacency list)

```javascript
class Graph {
  #adj = new Map();

  addEdge(from, to) {
    (this.#adj.get(from) ?? this.#adj.set(from, []).get(from)).push(to);
  }

  *bfs(start) {
    const visited = new Set([start]);
    const queue = new Queue();
    queue.enqueue(start);
    while (queue.size) {
      const node = queue.dequeue();
      yield node;
      for (const n of this.#adj.get(node) ?? []) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.enqueue(n);
        }
      }
    }
  }
}
```

## Resource Pool

Ideas: parallel `#items` / `#free` arrays; round-robin `#current`; `Lease` with one-shot `release`; `WeakSet` of valid leases; when empty, queue waiters (optional timeout); on release, hand the same slot to the next waiter or mark free.

```javascript
class Lease {
  #release;
  #released = false;
  constructor(resource, release) {
    this.resource = resource;
    this.#release = release;
  }
  release() {
    if (this.#released) throw new Error('already released');
    this.#released = true;
    this.#release();
  }
}
```

## Struct (typed record factory)

Ideas: `Struct.immutable` / `Struct.mutable` from defaults; infer field types; `Object.freeze` vs `Object.seal`; `fork` = copy+updates; `branch` = prototype overlay for cheap variants; validate unknown fields / wrong types; deep-copy array/object defaults.

```javascript
class Struct {
  static immutable(name, defaults) {
    const fields = Object.keys(defaults);
    const Entity = {
      [name]: class {
        constructor(data = {}) {
          for (const k of fields)
            this[k] = Object.hasOwn(data, k) ? data[k] : defaults[k];
          Object.freeze(this);
        }
        fork(updates = {}) {
          return new Entity({ ...this, ...updates });
        }
      },
    }[name];
    return Entity;
  }
}
```

## CRDT (G-Counter)

```javascript
class GCounter {
  #id;
  #counts;

  constructor(id, size) {
    this.#id = id;
    this.#counts = new Array(size).fill(0);
  }

  inc(x = 1) {
    this.#counts[this.#id] += x;
  }

  merge(remote) {
    for (let i = 0; i < this.#counts.length; i++) {
      this.#counts[i] = Math.max(this.#counts[i], remote[i]);
    }
  }

  get value() {
    return this.#counts.reduce((a, b) => a + b, 0);
  }
}
```

## Conventions

- Prefer CircularBuffer or UnrolledList for Queue/Deque/Stack
- `Object.create(null)` for trie nodes; Symbol for reserved keys; LRU via Map order; CRDTs for distributed counters
