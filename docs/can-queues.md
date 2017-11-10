@module {Object} can-queues
@parent can-js-utilities
@collection can-infrastructure
@group can-queues.constructors 0 constructors
@group can-queues.instances 1 instances

@description A light weight task queue

@type {Object} The `can-queues` package exports an object with queue constructors, shared instances, and helpers:

```js
{
  Queue,         // The Queue type constructor
  PriorityQueue, // The PriorityQueue type constructor
  notifyQueue,   // A Queue used to tell objects that
                 //    derive a value that they should be updated.
  deriveQueue,   // A PriorityQueue used update values.
  domUIQueue,    // A Queue used for updating the DOM or other UI after
                 //    state has settled, but before user tasks
  mutateQueue,   // A Queue used to register tasks that might
                 //    update other values.
  batch: {
    start,     // A function used to prevent the automatic flushing
               //    of the NOTIFY_QUEUE.
    stop       // A function used to begin flushing the NOTIFY_QUEUE.
  },

  enqueueByQueue, // A helper function used to queue a bunch of tasks.

  stack,

  logStack
}
```
