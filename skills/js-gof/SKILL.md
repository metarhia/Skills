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
    createDatabase: (...args) => new FileStorage(...args),
    createCursor: (...args) => new FileLineCursor(...args),
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
```

```javascript
const query = new QueryBuilder('User')
  .where({ active: true })
  .order('name')
  .limit(10)
  .build();
```

Alternatively we can create async constructor to be invoked with `await new QueryBuilder`, or put all steps into declarative structure like:

```javascript
const query = await new QueryBuilder({
  entity: 'User',
  where: { active: true },
  order: 'name',
  limit: 10,
});
```

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
  return function () {
    return single;
  };
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
const singleton = (
  (instance) => () =>
    instance
)({});
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

## Structural patterns

### Adapter

Converts an incompatible interface into a compatible one, enabling third-party component usage without altering its code; can even transform a function contract into an object or vice versa.

Refs: https://github.com/HowProgrammingWorks/Adapter

```javascript
const promisify =
  (fn) =>
  (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, data) => (err ? reject(err) : resolve(data)));
    });
```

```javascript
const timer = new Timer(1000); // wraps setInterval
for await (const step of timer) {
  // gives [Symbol.asyncIterator] contract
  console.log({ step });
}
```

```javascript
class ArrayToQueueAdapter {
  #array = null;

  constructor(array) {
    if (!Array.isArray(array)) {
      throw new Error('Array instance expected');
    }
    this.#array = array;
  }

  enqueue(data) {
    this.#array.push(data);
  }

  dequeue() {
    return this.#array.pop();
  }

  get count() {
    return this.#array.length;
  }
}
```

### Wrapper

Function wrapper that delegates calls and adds behavior; a specialized case of Adapter.

Refs: https://github.com/HowProgrammingWorks/Wrapper

```javascript
const withLogging =
  (fn, label) =>
  (...args) => {
    console.log(`${label} called`, args);
    const result = fn(...args);
    console.log(`${label} returned`, result);
    return result;
  };
```

```javascript
const wrapInterface = (anInterface) => {
  const wrapped = {};
  for (const key in anInterface) {
    const fn = anInterface[key];
    wrapped[key] = wrapFunction(fn);
  }
  return wrapped;
};
```

```javascript
class Timeout {
  constructor(fn, msec) {
    this.function = fn;
    this.timer = setTimeout(() => {
      this.timer = null;
    }, msec);
  }

  execute(...args) {
    let result = undefined;
    if (!this.timer) return result;
    clearTimeout(this.timer);
    this.timer = null;
    result = this.function(...args);
    return result;
  }
}
```

### Boxing

Wraps primitives into object types to add methods or unify interfaces, e.g., narrowing `String` to `AddressString`.

Refs: https://github.com/HowProgrammingWorks/ADT

Box, Container or Value-Object examples:

```javascript
class AddressString {
  #value;

  constructor(value) {
    if (typeof value !== 'string') {
      throw new TypeError('Address must be a string');
    }
    const str = value.trim();
    if (str === '') throw new TypeError('Address must be a non-empty');
    this.#value = str;
  }

  get city() {
    const index = this.#value.indexOf(',');
    return this.#value.slice(0, index).trim();
  }

  toString() {
    return this.#value;
  }

  valueOf() {
    return this.#value;
  }
}

// Usage

const address = new AddressString('London, 221B Baker Street');
console.log(address.city); // 'London'
console.log(`Delivery to: ${address}`);
```

Value-Object examples:

```javascript
const KMH_TO_MPH = 0.621371;

class SpeedValue {
  #kmh;

  constructor(value, unit = 'kmh') {
    if (typeof value !== 'number') {
      throw new TypeError('Speed must be a number');
    }
    if (value < 0) throw new TypeError('Speed must be non-negative');
    if (unit !== 'kmh' && unit !== 'mph') {
      throw new TypeError('Unit must be kmh or mph');
    }
    this.#kmh = unit === 'mph' ? value / KMH_TO_MPH : value;
  }

  get kmh() {
    return this.#kmh;
  }

  get mph() {
    return this.#kmh * KMH_TO_MPH;
  }

  toString() {
    return `${this.#kmh} km/h`;
  }

  valueOf() {
    return this.#kmh;
  }
}
```

### Decorator

Dynamically extends behavior without inheritance, typically via composition and declarative syntax, effectively adding metadata.

Refs: https://github.com/HowProgrammingWorks/Decorator

```javascript
const add = (a, b) => a + b;
const loggedAdd = withLogging(add, 'add');
```

Not a good idea to use classical decorator in JavaScript/TypeScript

```javascript
const validator = new MinLengthValidator(
  new EmailValidator(new RequiredValidator(new BaseValidator())),
  20,
);

const input = 'timur.shemsedinov@gmail.com';
const result = validator.validate(input);
```

We can add metadata to an instance in several JS-idiomatic ways:

Symbol property on instance:

```javascript
const VALIDATOR_META = Symbol('validatorMeta');

class EmailValidator {
  constructor(next) {
    this.next = next;
    this[VALIDATOR_META] = { type: 'email' };
  }
}
```

Wrapper that attaches metadata as own property.

JSDoc annotation (zero runtime cost):

```javascript
/**
 * @typedef {{ type: string, label: string }} ValidatorMeta
 * @typedef {{ validate(v: string): boolean, meta: ValidatorMeta }} Validator
 */

/** @type {Validator} */
const validator = Object.assign(
  new EmailValidator(new RequiredValidator(new BaseValidator())),
  { meta: { type: 'email', label: 'Email field' } },
);
```

Module-local WeakMap (fully private, no shape pollution):

```javascript
const metadata = new WeakMap();

const createValidator = ({ args, meta }) => {
  const instance = new Validator(...args);
  metadata.set(instance, meta);
  return instance;
};

module.exports = { createValidator };
```

### Proxy

Controls access to an object by intercepting calls, reads, and writes; useful for lazy initialization, caching, and security; can be implemented via GoF or native JavaScript Proxy.

Refs: https://github.com/HowProgrammingWorks/Proxy

Do not use the built-in JS `Proxy` class unless a developer asks
you directly because of deopts. Use GoF Proxy instead as a container
with additional behavior.

```javascript
const fs = require('node:fs');

const statistics = { bytes: 0, chunks: 0, events: {} };

class StatReadStream extends fs.ReadStream {
  emit(name, data) {
    if (name === 'data') {
      statistics.bytes += data.length;
      statistics.chunks++;
    }
    const counter = statistics.events[name] || 0;
    statistics.events[name] = counter + 1;
    super.emit(name, data);
  }
}

const getStatistics = () => structuredClone(statistics);

const createReadStream = (path, options) => new StatReadStream(path, options);

module.exports = { ...fs, createReadStream, getStatistics };
```

### Bridge

Separates two or more abstraction hierarchies via composition or aggregation, allowing them to evolve independently.

Refs: https://github.com/HowProgrammingWorks/Bridge

```js
class CommunicationProtocol {
  sendCommand(device, command) {
    console.log({ device, command });
    throw new Error('sendCommand() must be implemented');
  }
}

class MQTTProtocol extends CommunicationProtocol {
  sendCommand(device, command) {
    console.log(`[MQTT] Sending '${command}' to ${device}`);
  }
}

class HTTPProtocol extends CommunicationProtocol {
  sendCommand(device, command) {
    console.log(`[HTTP] Sending '${command}' to ${device}`);
  }
}

class IoTDevice {
  constructor(name, protocol) {
    this.name = name;
    this.protocol = protocol;
  }

  operate(command) {
    this.protocol.sendCommand(this.name, command);
  }
}

class SmartLight extends IoTDevice {
  turnOn() {
    this.operate('Turn On Light');
  }

  turnOff() {
    this.operate('Turn Off Light');
  }
}

class SmartThermostat extends IoTDevice {
  setTemperature(temp) {
    this.operate(`Set Temperature to ${temp}°C`);
  }
}
```

### Composite

Implements a common interface to uniformly handle individual objects and their tree structures, e.g., DOM or file systems.

Refs: https://github.com/HowProgrammingWorks/Composite

Recursive composite with reduce:

```js
const calculateTotal = (order) => {
  const items = Array.isArray(order) ? order : Object.values(order);
  return items.reduce((sum, item) => {
    if (typeof item.price === 'number') return sum + item.price;
    else return sum + calculateTotal(item);
  }, 0);
};
```

JSON as a nested composite structure:

```javascript
const json = `{
  "electronics": {
    "laptop": { "price": 1200 },
    "accessories": {
      "mouse": { "price": 25 },
      "keyboard": { "price": 75 }
    }
  },
  "books": {
    "fiction": { "price": 15 },
    "technical": { "price": 60 }
  }
}`;

const order = JSON.parse(json);
console.log(calculateTotal(order));
```

### Facade

Simplifies access to a complex system, providing a unified and clear interface, hiding and protecting internal complexity.

Refs: https://github.com/HowProgrammingWorks/Facade

```javascript
const createApi = (db, cache, logger) => ({
  async getUser(id) {
    const cached = cache.get(id);
    if (cached) return cached;
    const user = await db.row('User', ['*'], { id });
    cache.set(id, user);
    logger.info(`User ${id} loaded`);
    return user;
  },
});
```

This hides classes Timer, Logger, Task and so on:

```js
scheduler.task('name2', '2019-03-12T14:37Z', (done) => {
  setTimeout(() => {
    done(new Error('task failed'));
  }, 1100);
});
```

### Context

Exchanges state and dependencies between different components (abstractions, modules, layers) that do not share a common environment, without tightly coupling them.

Refs: https://github.com/HowProgrammingWorks/Context

```js
class AccountService {
  constructor(context) {
    this.context = context;
  }

  getBalance(accountId) {
    const { console, accessPolicy, user } = this.context;
    console.log(`User ${user.name} requesting balance for ${accountId}`);
    if (!accessPolicy.check(user.role, 'read:balance')) {
      console.error('Access denied: insufficient permissions');
      return null;
    }
    const balance = 15420.5;
    console.log('Access granted');
    return balance;
  }
}

class AccessPolicy {
  constructor() {
    this.permissions = {
      admin: ['read:balance', 'read:transactions', 'write:transactions'],
      user: ['read:balance'],
      guest: [],
    };
  }

  check(role, permission) {
    return this.permissions[role]?.includes(permission);
  }
}

class User {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }
}

const accessPolicy = new AccessPolicy();
const user = new User('Marcus', 'admin');
const context = { console, accessPolicy, user };

const accountService = new AccountService(context);
const balance = accountService.getBalance('Account-123');
console.log(`Balance = $${balance}`);
```

Alternative way with closure:

```js
const createAccountService = (context) => {
  const { console, accessPolicy, user } = context;

  const getBalance = (accountId) => {
    console.log(`User ${user.name} requesting balance for ${accountId}`);
    if (!accessPolicy.check(user.role, 'read:balance')) {
      console.error('Access denied: insufficient permissions');
      return null;
    }
    return 15420.5;
  };

  const getTransactions = (accountId) => {
    if (!accessPolicy.check(user.role, 'read:transactions')) {
      console.error('Access denied: insufficient permissions');
      return null;
    }
    console.log(`User ${user.name} reading transactions for ${accountId}`);
    return ['TR-123', 'TR-456', 'TR-789'];
  };

  return { getBalance, getTransactions };
};

const accessPolicy = {
  permissions: {
    admin: ['read:balance', 'read:transactions', 'write:transactions'],
    user: ['read:balance'],
    guest: [],
  },
  check: (role, permission) =>
    accessPolicy.permissions[role]?.includes(permission),
};

const context = {
  console,
  accessPolicy,
  user: { name: 'Marcus', role: 'admin' },
};

const accountService = createAccountService(context);

console.log('Balance:', accountService.getBalance('ACC-001'));
console.log('Transactions:', accountService.getTransactions('ACC-001'));
```
