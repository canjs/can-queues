var QUnit = require( 'steal-qunit' );
var queues = require( "can-queues" );
var canDev = require( 'can-log/dev/dev' );
var CompletionQueue = require( "./completion-queue" );

QUnit.module( 'can-queues' );

QUnit.test( 'basics', function () {
	function makeCallbackMeta ( handler, context ) {
		return {
			log: [handler.name + " by " + context.name]
		};
	}
	var callbackOrder = [];
	var gc1, gc2, derivedChild, writableChild, root;
	gc1 = {
		name: "gc1",
		notifyHandlers: [
			function derivedChild_queueUpdate () {
				callbackOrder.push( "derivedChild_queueUpdate" );
				derivedChild.queueUpdate();
			}
		],
		mutateHandlers: [function gc1_eventHandler_writableChild_dispatch () {
			callbackOrder.push( "gc1_eventHandler_writableChild_dispatch" );
			writableChild.dispatch();
		}],
		dispatch: function () {
			callbackOrder.push( "gc1.dispatch" );
			queues.enqueueByQueue( {
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, [], makeCallbackMeta );
		}
	};

	gc2 = {
		name: "gc2",
		notifyHandlers: [
			function deriveChild_queueUpdate () {
				callbackOrder.push( "deriveChild_queueUpdate" );
			}
		],
		mutateHandlers: [],
		dispatch: function () {
			callbackOrder.push( "gc2.dispatch" );
			queues.enqueueByQueue( {
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, [], makeCallbackMeta );
		}
	};

	derivedChild = {
		name: "derivedChild",
		queueUpdate: function () {
			callbackOrder.push( "derivedChild.queueUpdate" );
			queues.deriveQueue.enqueue( this.update, this, [], {
				priority: 1,
				log: ["update on " + this.name]
			});
		},
		update: function () {
			callbackOrder.push( "derivedChild.update" );
			// check value
			// value changed
			queues.enqueueByQueue( {
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, [], makeCallbackMeta );
		},
		notifyHandlers: [
			function root_queueUpdate () {
				callbackOrder.push( "root_queueUpdate" );
				root.queueUpdate();
			}
		]
	};
	derivedChild.update = derivedChild.update.bind( derivedChild );

	writableChild = {
		name: "writableChild",
		dispatch: function () {
			callbackOrder.push( "writableChild.dispatch" );
			// check value
			// value changed
			queues.enqueueByQueue( {
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, [], makeCallbackMeta );
		},
		notifyHandlers: [
			function root_queueUpdate () {
				callbackOrder.push( "root_queueUpdate" );
				root.queueUpdate();
			}
		],
		mutateHandlers: [
			function eventHandler () {
				callbackOrder.push( "writableChild.eventHandler" );
			}
		]
	};

	root = {
		name: "root",
		queueUpdate: function () {
			callbackOrder.push( "root.queueUpdate" );
			queues.deriveQueue.enqueue( this.update, this, [], {
				priority: 1,
				log: ["update on " + this.name]
			});
		},
		update: function () {
			callbackOrder.push( "root.update" );
			// check value
			// value changed
			queues.enqueueByQueue( {
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, [], makeCallbackMeta );
		},
		mutateHandlers: [function eventHandler () {
			callbackOrder.push( "root.eventHandler" );
		}]
	};
	root.update = root.update.bind( root );

	queues.batch.start();
	gc1.dispatch();
	gc2.dispatch();
	queues.batch.stop();

	QUnit.deepEqual( callbackOrder, [
		"gc1.dispatch",
		"gc2.dispatch",
		"derivedChild_queueUpdate",
		"derivedChild.queueUpdate",
		"deriveChild_queueUpdate",
		"derivedChild.update",
		"root_queueUpdate",
		"root.queueUpdate",
		"root.update",
		"gc1_eventHandler_writableChild_dispatch",
		"writableChild.dispatch",
		"root_queueUpdate",
		"root.queueUpdate",
		"root.update",
		"root.eventHandler",
		"writableChild.eventHandler",
		"root.eventHandler"
	], "abc" );
});

if ( System.env.indexOf( 'production' ) < 0 ) {
	QUnit.test( "log basics", function () {
		var oldLog = canDev.log;

		canDev.log = function ( area, name ) {
			QUnit.equal( "Test enqueuing:", area );
			QUnit.equal( "fnName", name );

			canDev.log = function ( area, name ) {
				QUnit.equal( "Test running  :", area );
				QUnit.equal( "fnName", name );
			};
		};

		var queue = new queues.Queue( "Test" );
		queue.log();

		queue.enqueue( function fnName () {}, null, [] );

		queue.flush();

		canDev.log = oldLog;
	});

	QUnit.test( "logStack", function () {
		function makeCallbackMeta( handler, context ){
			return {
				log: [handler.name + " by " + context.name]
			};
		}

		var callbackOrder = [];
		var map, fullName, mapFullName;

		// var map = new DefineMap( {first: "Justin", last: "Meyer", fullName: ""}); //map:1
		map = {
			name: "map",
			notifyHandlers: [
				function derivedChild_queueUpdate () {
					callbackOrder.push( "derivedChild_queueUpdate" );
					fullName.queueUpdate();
				}
			],
			dispatch: function () {
				callbackOrder.push( "map.dispatch" );
				queues.enqueueByQueue( {
					notify: this.notifyHandlers,
					mutate: this.mutateHandlers
				}, this, [], makeCallbackMeta, ["map.first = 'ramiya'"] );
			}
		};

		// var fullName = compute( () => {  return map.first + map.last });
		fullName = {
			name: "fullName",
			queueUpdate: function () {
				callbackOrder.push( "fullName.queueUpdate" );
				queues.deriveQueue.enqueue( this.update, this, [], {
					priority: 1,
					log: ["update on " + this.name]
				});
			},
			update: function update () {
				callbackOrder.push( "fullName.update" );
				// check value
				// value changed
				queues.enqueueByQueue( {
					notify: this.notifyHandlers,
					mutate: this.mutateHandlers
				}, this, [], makeCallbackMeta );
			},
			notifyHandlers: [],
			mutateHandlers: [
				function fullName_setFullNameProperty () {
					mapFullName.dispatch();
				}
			]
		};

		mapFullName = {
			name: "map.fullName",
			mutateHandlers: [function mapFullName_handler () {
				callbackOrder.push( "gc1_eventHandler_writableChild_dispatch" );
				var stack = queues.stack();

				QUnit.deepEqual( stack.map( function ( task ) {
					return task.meta.stack.name + " " +task.context.name + " " +
						task.fn.name;
				}), [
					"NOTIFY map derivedChild_queueUpdate",
					"DERIVE fullName update",
					"MUTATE fullName fullName_setFullNameProperty",
					"MUTATE map.fullName mapFullName_handler",
				] );

				QUnit.deepEqual( stack[0].meta.reasonLog, ["map.first = 'ramiya'"] );
			}],
			dispatch: function () {
				callbackOrder.push( "mapFullName.dispatch" );
				queues.enqueueByQueue( {
					notify: this.notifyHandlers,
					mutate: this.mutateHandlers
				}, this, [], makeCallbackMeta, ["map.fullName = 'Ramiya Meyer'"] );
			}
		};

		// map.first = 'ramiya'
		map.dispatch();
	});
}

QUnit.test( "priority queue orders tasks correctly", function () {
	var queue = new queues.PriorityQueue( "priority" );

	var order = 0;
	queue.enqueue( function () {
		order++;
		QUnit.equal( order, 3, "priority 1 ran after priority 0" );
	}, null, [], {
		priority: 1
	});

	var fn = function () {
		order++;
		QUnit.equal( order, 2, "priority 2 ran after priority 0 because it was flushed" );
	};

	queue.enqueue( function () {
		order++;
		QUnit.equal( order, 1, "priority 0 ran first" );
		queue.flushQueuedTask( fn );
	}, null, [], {
		priority: 0
	});

	queue.enqueue( fn, null, [], {
		priority: 2
	});

	queue.flush();
});

QUnit.test( "priority queue works with holes in the order", function () {
	var queue = new queues.PriorityQueue( "priority" );
	var ran = [];

	queue.enqueue( function () {
		ran.push( "priority 0" );
	}, null, [], {
		priority: 0
	});

	queue.enqueue( function () {
		ran.push( "priority 10" );
	}, null, [], {
		priority: 10
	});

	queue.flush();

	QUnit.deepEqual( ran, ["priority 0", "priority 10"] );
});

QUnit.test( "DOM_UI_QUEUE", function () {
	var ran = [];
	queues.enqueueByQueue({
		"notify": [function notify () { ran.push( "notify" ); }],
		"derive": [
			function derive1 () { ran.push( "derive1" ); },
			function derive2 () { ran.push( "derive2" ); }
		],
		"domUI": [function domUI () { ran.push( "domUI" ); }],
		"mutate": [function domUI () { ran.push( "mutate" ); }]
	});

	QUnit.deepEqual( ran, ["notify", "derive1", "derive2", "domUI", "mutate"], "ran all tasks" );
});

QUnit.test( "CompletionQueue", function () {
	var queue = new CompletionQueue( "DOM" );

	var ran = [];

	queue.enqueue( function () {
		ran.push( "task 1:a" );

		queue.enqueue( function () {
			ran.push( "task 3" );
		}, null, [], {});

		queue.flush();
		ran.push( "task 1:b" );
	}, null, [], {});

	queue.enqueue( function () {
		ran.push( "task 2" );
	}, null, [], {});

	queue.flush();
	QUnit.deepEqual( ran, ["task 1:a", "task 1:b", "task 2", "task 3"] );
});

QUnit.test( "priority queue can't flush already ran task", function () {
	var queue = new queues.PriorityQueue( "priority" );
	var ran = [];

	var task1 = function () {
		ran.push( "1" );
	};

	queue.enqueue( task1, null, [], {
		priority: 0
	});

	queue.enqueue( function () {
		QUnit.equal( queue.isEnqueued( task1 ), false, "not enqueued" );
		queue.flushQueuedTask( task1 );
		ran.push( "2" );
	}, null, [], {
		priority: 0
	});

	queue.enqueue( function () {
		ran.push( "3" );
	}, null, [], {
		priority: 0
	});

	queue.flush();

	QUnit.deepEqual( ran, ["1", "2", "3"] );
});

QUnit.test("dequeue a priority queue", 0, function(){
	var queue = new queues.PriorityQueue( "priority" );

	var task1 = function () {
		QUnit.ok(false, "this should not be called");
	};

	queue.enqueue( task1, null, [], {
		priority: 0
	});
	queue.dequeue(task1);

	queue.flush();
});
