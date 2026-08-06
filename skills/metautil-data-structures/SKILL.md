---
name: metautil-data-structures
description: Operate metautil package ADTs — ConsList, Struct, Queue, Stack, Deque, List, Trie, UnrolledList, CircularBuffer. Use when importing or calling these classes from metautil. For native Map/Object/Set/Array, use js-data-structures. For custom data structures, use data-structures.
---

# Metautil Data Structures

Import from the package root. Prefer these ADTs over ad-hoc `Array`/`Object` when the discipline (FIFO, LIFO, persistence, schema) matters.

```js
const metautil = require('metautil');
const { ConsList, cons, uncons, Struct, Deque, Queue, Stack } = metautil;
const { List, ListNode, CircularBuffer, UnrolledList, Trie } = metautil;
```

## Choose the right structure

- FIFO jobs / BFS / sliding failure window: `Queue`
- LIFO undo / nested layers / brackets: `Stack`
- Both ends O(1), capped window: `Deque` or `CircularBuffer`
- Index + mid-sequence edit/move/group: `List`
- Immutable history / branching / sharing: `ConsList`
- Typed sealed/frozen records: `Struct`
- Prefix autocomplete / string keys: `Trie`
- Extreme enqueue/dequeue volume only: `UnrolledList` (no peek / interop)
- Random access on a ring: `CircularBuffer.at` (not `Deque`)

## Complexity and surface

- `CircularBuffer` — ends O(1), index O(1) via `at`
- `Deque` / `Queue` / `Stack` — ends O(1); no index (`at` only on buffer)
- `UnrolledList` — ends O(1); no peek / interop
- `List` — ends O(1), index O(n)
- `ConsList` — `prepend` O(1), walk O(n)
- `Trie` — string-key prefix map

Who has what (beyond `size` / `isEmpty` where present):

- `fromArray` / `toArray` / iterator: all except `UnrolledList` (and `Trie`)
- `peek`: `Queue`, `Stack`
- `at`: `CircularBuffer` only
- `every` / `reduce`: `CircularBuffer`, `Deque`, `Stack` (not `Queue`)
- `clear` / `includes`: ring family + `List` + `Trie.clear`; not `ConsList` / `UnrolledList`

## Interoperability

Convert through Array:

```js
const list = List.fromArray([1, 2, 3, 4, 5]);
const queue = Queue.fromArray(list.filter((n) => n % 2 === 0).toArray());
const consList = ConsList.fromArray(queue.toArray());
```

`Deque`, `Queue`, and `Stack` are thin facades over `CircularBuffer` (same ring storage).

## Struct

Schema is inferred from default literals. Immutable uses `Object.freeze`; mutable uses `Object.seal`. Class name becomes `constructor.name`. Statics: `fields`, `schema`, `mutable`.

- `undefined`: schema `unknown`, accepts anything
- `null`: schema `ref`, accepts null, object, function
- `[]` / `{}`: schema `array` / `object`, accepts arrays / plain objects (**fresh copy per instance**)
- primitive: schema `typeof`, accepts that primitive

`null` (`ref`) ≠ `{}` (`object`); arrays fail `object` and plain objects fail `array`.

```js
const Money = Struct.immutable('Money', { currency: 'USD', amountCents: 0 });
const a = Money.create({ amountCents: 500 });
const b = a.fork({ amountCents: 700 }); // new frozen record
// a.update(...) throws; use fork or branch

const Reading = Struct.mutable('Reading', {
  deviceId: '',
  millicelsius: 0,
  processed: false,
});
const r = new Reading({ deviceId: 'sensor-7' });
r.update({ processed: true }); // in-place, mutable only
```

- `fork(updates)` — full shallow copy via `toObject()` + updates (independent instance)
- `branch(updates)` — `Object.create(this)` overlay; cheap sharing of unset fields
- On a **mutable** branch, `update` only works for fields the branch itself defined
- Unknown field or wrong type throws `TypeError`

## ConsList

Immutable singly-linked cons cells with structural sharing. `prepend` is O(1); never mutate. `ConsList.empty` is a **singleton** (`===`).

```js
const shared = ConsList.of(3, 4, 5);
const branch1 = shared.prepend(2).prepend(1); // [1, 2, 3, 4, 5]
const branch2 = shared.prepend(99); // [99, 3, 4, 5]
// branch1.tail.tail === shared; branch2.tail === shared

const { value, tail } = branch1.uncons(); // same as uncons(branch1)
const rebuilt = cons(value, tail); // same as tail.prepend(value)

let history = ConsList.of('draft v1');
history = history.prepend('draft v2');
const undone = history.tail; // O(1) restore; suffix still shared
```

- `merge(...lists)` — join in argument order; shares the **last** list as suffix; O(n) over all but the last
- `member(value)` — first **shared suffix** whose head `===` value, or `empty` (not a boolean)
- `equals` / `includes` — element-wise `===`
- Also: `of` / `fromArray` / `fromIterable`, `map` / `filter` / `find` / `some` / `every`, `reverse`, `toArray`
- Empty `reduce` without seed throws `TypeError`; empty `every` is `true`

## CircularBuffer / Deque / Queue / Stack

Growable power-of-two ring (initial capacity 16, doubles on full). End ops O(1); `CircularBuffer.at(i)` is O(1) (`-1` = last). `clear()` resets capacity to initial.

```js
const WINDOW = 5;
const trace = new Deque();
trace.push(point);
if (trace.size > WINDOW) trace.shift();

const q = Queue.fromArray(jobs);
q.enqueue(job);
const next = q.dequeue(); // undefined if empty
q.peek();

const undo = new Stack();
undo.push(command);
const last = undo.pop();
undo.peek();
```

- `CircularBuffer` / `Deque`: `unshift` / `push`, `shift` / `pop`; index only on buffer via `at`
- `Queue`: `enqueue` / `dequeue` / `peek` (front)
- `Stack`: `push` / `pop` / `peek` (back)
- Empty `every` is `true`; empty `reduce` without seed throws `TypeError`

## List / ListNode

Mutable doubly-linked sequence. Ends O(1); index ops O(n). Public API is value/index based. Non-integer indexes are no-ops; negatives count from the end.

```js
const route = List.of(a, b, c);
route.insert(1, rush);
route.move(from, to);
route.rotate(1); // default 1; positive = left
const { before, after } = route.splitAt(2);
const byZone = route.groupBy((stop) => stop.zone);
const removed = route.remove(x, y); // count removed
route.sum((x) => x.cents);
```

Mutating vs copying:

- Mutate: `append` / `prepend` / `insert` / `delete` / `drop` / `rotate` / `swap` / `move` / `reverse` / `sort` / `replace` / `clear`
- Copy: `take` / `slice` / `splitAt` / `map` / `flatMap` / `filter` / `toReversed` / `toSorted` / `clone` / `merge`
- `take` / `slice` return `null` for empty range, `take(0)`, or bad bounds; `drop` mutates in place
- `insert` clamps out-of-range indexes; `delete` / `swap` / `move` out-of-range are no-ops
- `reduce(fn, initial)` — **initial is required** (unlike ConsList / CircularBuffer)
- `avg` on empty is `0`; `min` / `max` on empty are `undefined`
- Also: `at` / `set`, `indexOf` / `lastIndexOf`, `includes`, `some` / `every` / `find` / `findIndex`

`ListNode` is low-level (`create` / `append` / `prepend` / `unlink` / `seek` / `fromArray` / `copy` / `link`) for custom structures that own head/tail/size. `seek` non-integer returns `null`. Do not mutate `prev`/`next` of nodes owned by a `List`.

## UnrolledList

High-throughput FIFO: pooled fixed-size array nodes. Use when volume is high and you only need enqueue/dequeue.

```js
const pending = new UnrolledList({ nodeSize: 256, poolSize: 4 });
pending.enqueue(task);
let task = pending.dequeue();
while (task !== undefined) {
  task();
  task = pending.dequeue();
}
```

- Defaults: `nodeSize: 1024`, `poolSize: 2`
- Raise `nodeSize` for larger bursts; raise `poolSize` if drain/refill churns nodes
- No `peek`, `fromArray`, iterator, or `includes`
- `enqueue(undefined)` is a real item — empty `dequeue()` is indistinguishable from that value

## Trie

Prefix tree for **string** keys.

```js
const trie = new Trie();
trie.insert('cat');
trie.insert('car', 42);
trie.insert('gone', undefined);
trie.has('gone'); // true — present; get returns undefined
trie.get('car'); // 42
trie.complete('ca'); // order may vary
trie.delete('car'); // prunes empty branches
```

- Default value is `true` when omitted; re-insert same key does not bump `size`
- Empty string `''` is a valid key
- `insert` non-string throws `TypeError`; `has` / `get` / `delete` non-string soft-fail (`false` / `undefined` / `false`)
- Use `has` to distinguish missing from stored `undefined`

## Contracts

- Empty `pop` / `dequeue` / `shift` return `undefined`
- Empty `reduce` without seed throws `TypeError` (ConsList / CircularBuffer family); List always needs a seed
- Equality / `includes` / `member` use strict `===` (`NaN` does not match)
- Prefer structure APIs over inventing Array adapters; convert via `toArray` / `fromArray` when crossing types
