---
name: js-gof
description: Apply Gang of Four and related design patterns in JavaScript and TypeScript. Use when implementing creational, structural, or behavioral patterns, or when the user mentions factories, builder, prototype, flyweight, singleton, object pool, adapter, wrapper, decorator, proxy, bridge, composite, facade, chain of responsibility, command, interpreter, iterator, mediator, memento, EventEmitter, EventTarget, state, strategy, template method, visitor, revealing constructor, actor, service locator, or any other pattern.
---

# GoF Patterns

- Use structural composition over inheritance
- Use multiparadigm code and contract-programming
- Use domain-specific languages (DSLs), prefer declarative way
- Separate and do not mix system and domain code
- Use GRASP and SOLID principles; especially reduce coupling
- Remember about referential transparency
- Prefer platform-agnostic code
- Implement isolation and layer borders with IoC & DI
- Use object/Map lookup for Strategy and polymorphic/dynamic dispatch
- Keep patterns simple
- Do not over-engineer for the sake of the pattern name

## Creational patterns

### Abstract factory

Creates related objects belonging to one family without specifying their concrete classes, e.g., UI components for different platforms.

Refs: https://github.com/HowProgrammingWorks/AbstractFactory

```javascript
const dataAccess = {
  fs: {
    createDatabase: (...args) => new FileStorage(...args),createCursor: (...args) => new FileLineCursor(...args),
  },
  minio: {
    // factories collection for minio
  },
  // other implementations
};

// Usage

const accessLayer = dataAccess.fs;
const storage = accessLayer.createDatabase('./storage.dat');
const cursor = accessLayer.createCursor({ city: 'Roma' }, storage);
for await (const record of cursor) {
  console.dir(record);
}
```

### Builder

Step-by-step assembly of a complex configurable object, often using chaining, e.g., Query Builder or Form Generator.

Refs: https://github.com/HowProgrammingWorks/Builder

```javascript
class QueryBuilder {
  #options;
  constructor(table) {
    this.#options = { table, where: {}, limit: null, order: null };
  }
  where(cond) {
    Object.assign(this.#options.where, cond);
    return this;
  }
  order(field) {
    this.#options.order = field;
    return this;
  }
  limit(n) {
    this.#options.limit = n;
    return this;
  }
  build() {
    return { ...this.#options };
  }
}

const query = new QueryBuilder('User')
  .where({ active: true })
  .order('name')
  .limit(10)
  .build();
```

Alternatively we can create async constructor to be invoked with `await new QueryBuilder`, or put all steps into declarative structure like:

const query = await new QueryBuilder({
  entity: 'User',
  where: { active: true },
  order: 'name',
  limit: 10,
});

### Factory

Function or method that creates objects using different techniques: assembling from literals and methods, mixins, `setPrototypeOf`.

Refs: https://github.com/HowProgrammingWorks/Factory

```javascript
const createUser = (name, role) => ({ name, role, createdAt: Date.now() });
const createAdmin = (name) => createUser(name, 'admin');
```

Or following:

```javascript
class Connection {
  constructor(url) {
    // implementation
  }
  // implementation
}

const factory = (() => {
  let index = 0;
  return () => new Connection(`http://10.0.0.1/${index++}`);
})();
```

### Factory Method

Chooses the correct abstraction to create an instance; in JavaScript, this can be implemented using `if`, `switch`, or selection from a collection (dictionary).

Refs: https://github.com/HowProgrammingWorks/FactoryMethod

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }

  static factory(name) {
    return new Person(name);
  }
}
```

```javascript
class Product {
  constructor(value) {
    this.field = value;
  }
}

class Creator {
  factoryMethod(...args) {
    return new Product(...args);
  }
}
```

### Prototype

Creates objects by cloning a prepared instance to save resources (not to be confused with [Prototype-programming](https://github.com/HowProgrammingWorks/Prototype), which is closer to Flyweight).

Refs: https://github.com/HowProgrammingWorks/PrototypePattern

```javascript
const proto = { type: 'widget', color: 'blue' };
const clone = () => ({ ...proto });
```

```javascript
class Point {
  #x;
  #y;

  constructor(x, y) {
    this.#x = x;
    this.#y = y;
  }

  move(x, y) {
    this.#x += x;
    this.#y += y;
  }

  clone() {
    return new Point(this.#x, this.#y);
  }
}

class Line {
  #start;
  #end;

  constructor(start, end) {
    this.#start = start;
    this.#end = end;
  }

  move(x, y) {
    this.#start.move(x, y);
    this.#end.move(x, y);
  }

  clone() {
    const start = this.#start.clone();
    const end = this.#end.clone();
    return new Line(start, end);
  }
}

// Usage

const p1 = new Point(0, 0);
const p2 = new Point(10, 20);
const line = new Line(p1, p2);
const cloned = line.clone();
cloned.move(2, 3);
```

```javascript
const point = (x, y) => {
  const move = (dx, dy) => {
    x += dx;
    y += dy;
  };
  const clone = () => point(x, y);
  return { move, clone };
};

// Usage

const { move, clone } = point(10, 20);
const c1 = clone();
move(-5, 10);
```

### Flyweight

Saves memory allocation by sharing common state among multiple instances.

Refs: https://github.com/HowProgrammingWorks/Flyweight

```javascript
const flyweightPool = new Map();

const getFlyweight = (shared) => {
  const { char, font, size } = shared;
  const key = `${char}:${font}:${size}`;
  let flyweight = flyweightPool.get(key);
  if (!flyweight) {
    flyweight = Object.freeze({ ...shared });
    flyweightPool.set(key, flyweight);
  }
  return flyweight;
};

const createChar = (char, font, size, row, col) => {
  const intrinsic = getFlyweight({ char, font, size });
  return { intrinsic, row, col };
};

const a1 = createChar('A', 'Arial', 12, 0, 0);
const a2 = createChar('A', 'Arial', 12, 0, 5);
console.log(a1.intrinsic === a2.intrinsic); // true
```

### Singleton

Provides global access to a single instance; often considered an anti-pattern, easiest implemented via ESM/CJS module caching exported refs.

Refs: https://github.com/HowProgrammingWorks/Singleton

Everywhere we import this state will be the same collection

```javascript
const connections = new Map(); // shared state
const nop = () => {}; // pure function with no state
module.exports = { connections, nop };
```

```javascript
class Singleton {
  static #instance;

  constructor() {
    const instance = Singleton.#instance;
    if (instance) return instance;
    Singleton.#instance = this;
  }
}
```

```javascript
function Singleton() {
  const { instance } = Singleton;
  if (instance) return instance;
  Singleton.instance = this;
}
```

```javascript
const Singleton = new (function () {
  const single = this;
  return function () { return single; };
})();
```

```javascript
const Singleton = (() => {
  let instance;

  class Singleton {
    constructor() {
      if (instance) return instance;
      instance = this;
    }
  }

  return Singleton;
})();
```

```javascript
const singleton = (() => {
  const instance = {};
  return () => instance;
})();
```

```javascript
const singleton = ((instance) => () => instance)({});
```

### Object Pool

Reuses pre-created objects to save resources during frequent creation and destruction.

Refs: https://github.com/HowProgrammingWorks/Pool

```javascript
class Pool {
  #available = [];
  #factory = null;
  constructor(factory, size) {
    this.#factory = factory;
    for (let i = 0; i < size; i++) this.#available.push(factory());
  }
  acquire() {
    return this.#available.pop() || this.#factory();
  }
  release(obj) {
    this.#available.push(obj);
  }
}
```
