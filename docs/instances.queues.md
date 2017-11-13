@property {instances} can-queues.instances.queues queues
@parent can-queues.instances 0

@description A set of instantiated queues with a predefined interplay between them.

@type {instances}

```js
var notifyQueue = canQueues.notifyQueue;
var deriveQueue = canQueues.deriveQueue;
var domUIQueue = canQueues.domUIQueue;
var mutateQueue = canQueues.mutateQueue;
```

@body


## notifyQueue

A Queue used to tell objects that derive a value that they should be updated.

When this queue is emptied (`onComplete`), it calls `flush()` on the `deriveQueue`.

This queue will flush automatically every time an item is enqueued - unless it is in a batch.


## deriveQueue

A PriorityQueue used to update values.

When this queue is emptied (`onComplete`), it calls `flush()` on the `domUIQueue`.

This queue is flushed automatically when `notifyQueue` is emptied.


## domUIQueue

A CompletionQueue used for updating the DOM or other UI after state has settled, but before user tasks.

When this queue is emptied (`onComplete`), it calls `flush()` on the `mutateQueue`.

This queue is flushed automatically when `deriveQueue` is emptied.


## mutateQueue

A Queue used to register tasks that might update other values.

This queue is flushed automatically when `domUIQueue` is emptied.
