# node-cerror

Chainable Errors

```
npm install @yo1dog/cerror
```

## Quick Start

```javascript
const {CError} = require('@yo1dog/cerror');
const {MyError} = require('MyError');

const sysErr = new Error('system failure');

// chain with CError class
console.log(
  new CError(sysErr, 'Unable to do thing A.')
);

/*
CError: Unable to do thing A.
    at readme.js:6:51
    at Script.runInThisContext (vm.js:123:20)
    ...
    
----- Caused By -----

Error: system failure
    at readme.js:4:16
    at Script.runInThisContext (vm.js:123:20)
    ...
*/
```

```javascript
// chain custom/any error classes
console.log(
  CError.chain(sysErr, new MyError('Unable to do thing B.'));
)

/*
MyError: Unable to do thing B.
    at readme.js:7:34
    at Script.runInThisContext (vm.js:123:20)
    ...
    
----- Caused By -----

Error: system failure
    at readme.js:4:16
    at Script.runInThisContext (vm.js:123:20)
    ...
*/
```

```javascript
// chain non-Error instances
const errObj = {status:500};

console.log(
  new CError(errObj, 'Unable to do thing C.')
);

/*
MyError: Unable to do thing C.
    at readme.js:7:34
    at Script.runInThisContext (vm.js:123:20)
    ...
    
----- Caused By -----

(type: object, constructor: Object) {status: 500}
*/
```

# Docs

## `new CError(cause, [message])`

 param    | type   | description
----------|--------|-------------
`cause`   | Error  | The cause of this Error.
`message` | string | A human-readable description of the error.

Creates an error with a cause.

Equivalent to:
```javascript
CError.chain(cause, new Error(message))
```

-----

## `CError.prototype.getCause()`

Returns the cause of this error (the next error in the chain).

Equivalent to:
```javascript
this[CError.causeSymbol]
CError.getCause(this)
```

-----

## `CError.prototype.getUnchainedStack()`

Returns the original stack of this error before it was chained.

Equivalent to:
```javascript
this[CError.origStackSymbol]
CError.getUnchainedStack(this)
```

-----

## `CError.chain(...errs)`

 param | type    | description
-------|---------|-------------
`errs` | Error[] | Errors to chain together.

Chains together errors such that the first error is the root cause and the last error is the
result.

Returns the last error.

-----

## `CError.getCause(err)`

 param | type  | description
-------|-------|-------------
`err`  | Error | Start of error chain to traverse.

Returns the cause of the given error (the next error in the chain).

Equivalent to:
```javascript
err[CError.causeSymbol]
CError.getChain(err)[1]
```

-----

## `CError.getUnchainedStack(err)`

 param | type  | description
-------|-------|-------------
`err`  | Error | Error in chain.

Returns the original stack of the given error before it was chained.

Equivalent to:
```javascript
err[CError.origStackSymbol]
```

-----

## `CError.getRootError(err)`

 param | type  | description
-------|-------|-------------
`err`  | Error | Start of error chain to traverse.

Returns the root error of the given error's chain.

*Note:* If the given error does not have a cause, the given
error is the root and is returned.

Equivalent to
```javascript
CError.getChain(err).pop()
```

-----

## `CError.getChain(err)`

 param | type  | description
-------|-------|-------------
`err`  | Error | Start of error chain to traverse.

Returns the given error's chain of errors as an array.

*Note:* the chain contains the given error at index 0.

Equivalent to
```javascript
Array.from(CError.getChainIterator(err, true))
```

-----

## `CError.findInChain(err, callback)`

 param     | type     | description
-----------|----------|-------------
`err`      | Error    | Start of error chain to traverse.
`callback` | function | Testing function.

Callback params:
 param  | type   | description
--------|--------|-------------
`err`   | Error  | Current error in chain.
`depth` | number | Current depth in chain.

Returns the first error in the given error's chain that satisfies the
given testing function.

Similar to except the arguments passed to `callback` differ slighty:
```javascript
CError.getChain(err).find(callback)
```

---

## `CError.getFirstInstanceOf(err, constructor)`

 param        | type     | description
--------------|----------|-------------
`err`         | Error    | Start of error chain to traverse.
`constructor` | function | Testing function.

Returns the first error in the given error's chain that is an instance
of the given constructor.

Equivalent  to:
```javascript
CError.findInChain(err, err => err instanceof constructor)
```

-----

## `CError.getErrorAt(err, depth)`

 param  | type   | description
--------|--------|-------------
`err`   | Error  | Start of error chain to traverse.
`depth` | number | Depth to traverse to.

Returns the error in the given depth in the given error's chain.

A depth of 0 will return the given error. 1 will return
the given error's cause. etc.

Similar to except this function will traverse circular
references (won't throw an error):
```javascript
CError.getChain(err)[depth]
```

-----

## `CError.getChainIterator(err, [checkCircular])`

 param          | type    | description
----------------|---------|-------------
`err`           | Error   | Start of error chain to traverse.
`checkCircular` | boolean | If an error should be thrown on circular references (true) or not (false). Defaults to false.

Returns an interator that traverses the given error's chain.

-----

## `CError.isChainable(val)`

 param | type  | description
-------|-------|-------------
`val`  | any   | Value to check.

Returns if the given value can store a cause and be at the end or middle of a chain.

-----

## `CError.causeSymbol`

Symbol for accessing the cause of an error.

-----

## `CError.origStackSymbol`

Symbol for accessing the original stack of an error before it was chained.