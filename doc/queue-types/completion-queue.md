@property {function} can-queues.CompletionQueue CompletionQueue
@parent can-queues/types

@description A basic FIFO queue that you can `enqueue` into and `flush`. Cannot be flushed while flushing.

@signature `new CompletionQueue(name [, callbacks])`

Creates a completion queue instance.

@param {String} [name] The name of the queue used for logging.
@param {Object} [callbacks] Optional. An object containing callbacks `onFirstTask` and/or `onComplete`.
  - `onFirstTask` - is called when the first task is added to an empty queue
  - `onComplete` - is called when the queue is empty.
@return {Object} An instance of `CompletionQueue`.

## completionQueue.enqueue( fn, context, args, meta )

Enqueues the `fn` function to be called with `context` as `this` and `args` as its arguments.

```js
completionQueue.enqueue(console.log, console, ["say hi"], {});
completionQueue.flush();
// console.logs "say hi"
```

- `meta` - An object used to give additional information.  Current properties that might be used:
  - `log` - An array of values that will be added to this task's debug output.  (You'll often want `[fn.name]`)

## completionQueue.flush()

Runs all tasks in the completionQueue. If a task causes another `flush` of the same completion queue, that flush will not happen.
