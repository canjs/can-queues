@function can-queues.enqueueByQueue enqueueByQueue
@parent can-queues/methods


A helper function used to queue a bunch of tasks.

All tasks passed in are done in a single batch.

```js
var ran = [];

canQueues.enqueueByQueue({
  "notify": [function notify () { ran.push( "notify" ); }],
  "derive": [
    function derive1 () { ran.push( "derive1" ); },
    function derive2 () { ran.push( "derive2" ); }
  ],
  "domUI": [function domUI () { ran.push( "domUI" ); }],
  "mutate": [function domUI () { ran.push( "mutate" ); }]
});

console.log( ran ); // -> ["notify", "derive1", "derive2", "domUI", "mutate"]
```

**canQueues.enqueueByQueue( fnByQueue [, context [, args [, makeMeta [, reasonLog ]]]] )**

Params:
 * **fnByQueue** {Object}: An object with keys of "notify", "derive", "domUI", and/or "mutate" that have Arrays of Functions (`task`s) as a value.
 * **context** {Object}: Optional. The `this` context to call each `task` fn with.
 * **args** {Array}: Optional. The arguments to `apply` to each task fn.
 * **makeMeta** {Function}: Optional. A function that takes ( `task`, `context`, `args` ) and returns an Object that will be the `meta` argument when the task is called.
 * **reasonLog** {Object}: Optional. A property attached to the `meta` object as `meta.reasonLog` before `task` is called.
