@module {function} can-queues.constructors.queue Queue
@parent can-queues.constructors 0

@description A basic FIFO queue that you can `enqueue` into and `flush`

@signature `new Queue(name [, callbacks])`

Creates a queue instance.

@param {String} [name] The name of the queue used for logging.
@param {Object} [callbacks] Optional. An object containing callbacks `onFirstTask` and/or `onComplete`.
  - `onFirstTask` - is called when the first task is added to an empty queue
  - `onComplete` - is called when the queue is empty.
@return {Object} An instance of `Queue`.

## queue.enqueue( fn, context, args, meta )

Enqueues the `fn` function to be called with `context` as `this` and `args` as its arguments.

```js
queue.enqueue(console.log, console, ["say hi"], {});
queue.flush();
// console.logs "say hi"
```

- `meta` - An object used to give additional information.  Current properties that might be used:
  - `log` - An array of values that will be added to this task's debug output.  (You'll often want `[fn.name]`)

## queue.flush()

Runs all tasks in the queue.
