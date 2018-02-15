# can-queues

[![Build Status](https://travis-ci.org//queue.svg?branch=master)](https://travis-ci.org//queue)

Exports an object with the following:

```js
{
	Queue,         // The Queue type constructor
	PriorityQueue, // The PriorityQueue type constructor
	CompletionQueue, // The CompletionQueue type constructor
	notifyQueue,   // A Queue used to tell objects that
	//    derive a value that they should be updated.
	deriveQueue,   // A PriorityQueue used to update values.
	domUIQueue,    // A CompletionQueue used for updating the DOM or other UI after
	//    state has settled, but before user tasks
	mutateQueue,   // A Queue used to register tasks that might
	//    update other values.
	batch: {
		start,     // A function used to prevent the automatic flushing
		//    of the NOTIFY_QUEUE.
		stop       // A function used to begin flushing the NOTIFY_QUEUE.
	},

	enqueueByQueue, // A helper function used to queue a bunch of tasks.

	stack,       // A function that returns an array of all the queue
	//    tasks up to this point of a flush for debugging.
	//    Returns an empty array in production.

	logStack     // A function that logs the result of `this.stack()`.
	//    Doesn't do anything in production.
}
```

## Use

If you want to implement an observable that complies with `can-reflect`, and lets people
listen to events with `.on`, you'll want the following:

```js
import canSymbol from "can-symbol";
import queues from "can-queues";

const observable = {
	_cid: 123142123123,
	value: undefined,
	handlers: {
		notify: [], mutate: []
	},
	[ canSymbol.getKeyValue( "can.onValue" ) ]: function( handler, queueName ) {

		// save handlers by their queue
		this.handlers[ queueName ].push( handler );
	},
	on: function( handler ) {

		// these handlers should always run last because they might mutate
		this.handlers.mutate.push( handler );
	},
	[ canSymbol.getKeyValue( "can.setKeyValue" ) ]: function( newValue ) {
		const args = [ newValue, this.value ];
		this.value = newValue;

		// start a batch so we don't .flush() the NOTIFY_QUEUE until everything has been added
		queues.batch.start();
		this.handlers.notify.forEach( ( handler ) => {
			queues.notifyQueue.enqueue( handler, this, args,
				{ log: [ handler.name + " by " + this._cid ] }
			);
		} );
		this.handlers.mutate.forEach( ( handler ) => {
			queues.mutateQueue.enqueue( handler, this, args,
				{ log: [ handler.name + " by " + this._cid ] }
			);
		} );
		queues.batch.stop();
	}
};
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
queue.enqueue( console.log, console, [ "say hi" ], {} );
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

- [ ] - batch numbers (basically once we did a mutate, but a new notify happened -> increment batchNum)
- [ ] Implement priority, the ability to remove,
  - and the number of items?
- [ ] A callback to know when the queue has ended.
