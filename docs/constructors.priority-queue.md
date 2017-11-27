@module {function} can-queues.constructors.priorityQueue PriorityQueue
@parent can-queues.constructors 1

@description A queue that you can `enqueue` into (with priority) and `flush`

@signature `new PriorityQueue(name [, callbacks])`

Creates a priority queue instance.

A PriorityQueue works just like a normal queue.  Except:
- PriorityQueues only allows one instance of a given `fn` to be enqueued at one time.  
- PriorityQueues run tasks in order of their `meta.priority`.

@param {String} [name] The name of the queue used for logging.
@param {Object} [callbacks] Optional. An object containing callbacks `onFirstTask` and/or `onComplete`.
  - `onFirstTask` - is called when the first task is added to an empty queue
  - `onComplete` - is called when the queue is empty.
@return {Object} An instance of `PriorityQueue`.

## priorityQueue.enqueue( fn, context, args, meta )

Enqueues the `fn` function to be called with `context` as `this` and `args` as its arguments.

```js
priorityQueue.enqueue(console.log, console, ["world"], { priority: 5 });
priorityQueue.enqueue(console.log, console, ["hello"], { priority: 1 });
priorityQueue.enqueue(console.log, console, ["!"], { priority: 7 });

priorityQueue.flush();
// console.logs "hello"
// console.logs "world"
// console.logs "!"
```

- `meta` - An object used to give additional information.  Current properties that might be used:
  - `priority` - A number that specifies when the task should be ran on a flush. 0 is default, bigger numbers run later.
  - `log` - An array of values that will be added to this task's debug output.  (You'll often want `[fn.name]`)

## priorityQueue.flush()

Runs all tasks in the queue.

## priorityQueue.isEnqueued( fn )

Return `boolean` true/false if the task `fn` is in the queue.

## priorityQueue.flushQueuedTask( fn )

Runs the specific `fn` and removes it from the queue.
