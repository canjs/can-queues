# queue

[![Build Status](https://travis-ci.org//queue.svg?branch=master)](https://travis-ci.org//queue)

Exports an object with the following:

```js
{
	Queue,         // The Queue type constructor
	PriorityQueue, // The PriorityQueue type constructor
	NOTIFY_QUEUE,  // A Queue used to tell objects that
	               //    derive a value that they should be updated.
	DERIVE_QUEUE,  // A PriorityQueue used update values.
	MUTATE_QUEUE,  // A Queue used to register tasks that might
	               //    update other values.
	batch: {
		start,     // A function used to prevent the automatic flushing
		           //    of the NOTIFY_QUEUE.
		stop       // A function used to begin flushing the NOTIFY_QUEUE.
	}
}
```

## Use

If you want to implement an observable that complies with `can-reflect`, and lets people
listen to events with `.on`, you'll want the following:

```js
var canSymbol = require("can-symbol");
var QUEUE = require("@bitovi/queue");

var observable = {
	_cid: 123142123123,
	value: undefined,
	handlers: {
		notify: [], mutate: []
	},
	[canSymbol.getKeyValue('can.onValue')]: function(handler, queueName) {
		// save handlers by their queue
		this.handlers[queueName].push(handler);
	},
	on: function(handler) {
		// these handlers should always run last because they might mutate
		this.handlers.mutate.push(handler);
	},
	[canSymbol.getKeyValue('can.setKeyValue')]: function(newValue) {
		var args = [newValue, this.value]
		this.value = newValue;
		// start a batch so we don't .flush() the NOTIFY_QUEUE until everything has been added
		QUEUE.batch.start();
		this.handlers.notify.forEach((handler) => {
			QUEUE.NOTIFY_QUEUE.enqueue(handler, this, args, {log: [handler.name+" by "+this._cid]});
		})
		this.handlers.mutate.forEach((handler) => {
			QUEUE.MUTATE_QUEUE.enqueue(handler, this, args, {log: [handler.name+" by "+this._cid]});
		})
		QUEUE.batch.stop();
	}
}
```

## API

### `new Queue(name, [callbacks])`

Creates a queue instance.  
- `name` - the name of the queue used for logging.
- `callbacks` - an object of optional callbacks like `{onFirstTask: fn(), onComplete: fn()}` where:
  - `onFirstTask` - is called when the first task is added to an empty queue
  - `onComplete` - is called when the queue is empty.

#### `queue.enqueue(fn, context, args, meta)`

Enqueues the `fn` function to be called with `context` as `this` and `args` as its arguments.

```js
// console.logs "say hi"
queue.enqueue(console.log, console, ["say hi"], {});
queue.flush();
```

- `meta` - An object used to give additional information.  Current properties that might be used:
  - `log` - An array of values that will be added to this task's debug output.  (You'll often want `[fn.name]`)

#### `queue.flush()`

Runs all tasks in the queue.  

### `new PriorityQueue(name, [callbacks])`

A PriorityQueue works just like a normal queue.  Except:
- PriorityQueues only allows one instance of a given `fn` to be enqueued at one time.  
- PriorityQueues run tasks in order of their `meta.priority`.


### `batch.start()`

### `batch.stop()`





## Todo

- [ ]
