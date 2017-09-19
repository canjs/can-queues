var canDev = require('can-util/js/dev/dev');

var noop = function() {};
var lastTask;

var Queue = function(name, callbacks) {
	this.callbacks = Object.assign({
		onFirstTask: noop,
		// default clears the last task
		onComplete: function(){
			lastTask = null;
		}
	}, callbacks || {});
	this.name = name;
	this.index = 0;
	this.tasks = [];
	this._log = false;
};
Queue.prototype.enqueue = function(fn, context, args, meta) {
	this.tasks.push({
		fn: fn,
		context: context,
		args: args,
		meta: meta || {}
	});
	//!steal-remove-start
	var task = this.tasks[this.tasks.length - 1];
	task.meta.stack = this;
	task.meta.parentTask = lastTask;

	if(this._log) {
		var log = task.meta.log ? meta.log : [fn.name, task];
		canDev.log.apply(canDev, [this.name + " enqueue task:"].concat(log));
	}
	//!steal-remove-end

	if (this.tasks.length === 1) {
		this.callbacks.onFirstTask(this);
	}
};
Queue.prototype._flush = function() {
	while (this.index < this.tasks.length) {
		var task = this.tasks[this.index++];
		//!steal-remove-start
		if(this._log) {
			var log = task.meta && task.meta.log ? task.meta.log : [task.fn.name, task];
			canDev.log.apply(canDev, [this.name + " run task:"].concat(log));
		}
		//!steal-remove-end
		lastTask = task;
		task.fn.apply(task.context, task.args);
	}
};
Queue.prototype.flush = function() {
	this._flush();
	this.index = 0;
	this.tasks = [];
	this.callbacks.onComplete(this);
};
Queue.prototype.log = function(){
	this._log = true;
};



var PriorityQueue = function() {
	Queue.apply(this, arguments);
	this.taskMap = new Map();
};
PriorityQueue.prototype = Object.create(Queue.prototype);
PriorityQueue.prototype.enqueue = function(fn) {
	if (!this.taskMap.has(fn)) {
		return Queue.prototype.enqueue.apply(this, arguments);
	}
};
PriorityQueue.prototype.flush = function() {
	this._flush();
	this.index = 0;
	this.tasks = [];
	this.taskMap = new Map();
	this.callbacks.onComplete(this);
};

var batchStartCounter = 0;
var addedNotifyTask = false;


var NOTIFY_QUEUE, DERIVE_QUEUE, MUTATE_QUEUE;
NOTIFY_QUEUE = new Queue("NOTIFY", {
	onComplete: function() {
		//console.log("NOTIFY complete.")
		DERIVE_QUEUE.flush();
	},
	onFirstTask: function() {
		//console.log("NOTIFY first task enqueued.")
		if (!batchStartCounter) {
			NOTIFY_QUEUE.flush();
		} else {
			addedNotifyTask = true;
		}
	}
});
DERIVE_QUEUE = new PriorityQueue("DERIVE", {
	onComplete: function() {
		//console.log("DERIVE complete.")
		MUTATE_QUEUE.flush();
	},
	onFirstTask: function() {
		//console.log("DERIVE first task enqueued.")
	}
});
MUTATE_QUEUE = new Queue("MUTATE", {
	onComplete: function() {
		//console.log("MUTATE complete.")
		lastTask = null;
	},
	onFirstTask: function() {
		//console.log("MUTATE first task enqueued.")
	}
});


var queues = {
	Queue: Queue,
	PriorityQueue: PriorityQueue,
	notifyQueue: NOTIFY_QUEUE,
	deriveQueue: DERIVE_QUEUE,
	mutateQueue: MUTATE_QUEUE,
	batch: {
		start: function() {
			batchStartCounter++;
		},
		stop: function() {
			batchStartCounter--;
			if (batchStartCounter === 0) {
				if (addedNotifyTask) {
					addedNotifyTask = false;
					NOTIFY_QUEUE.flush();
				}
			}
		}
	},
	enqueueByQueue: function enqueueByQueue(fnByQueue, context, args, makeMeta, reasonLog) {
		queues.batch.start();
		["notify", "derive", "mutate"].forEach(function(queueName) {
			var name = queueName + "Queue";
			var QUEUE = queues[name];
			(fnByQueue[queueName] || []).forEach(function(handler) {
				var meta = makeMeta(handler, context, args);
				meta.reasonLog = reasonLog;
				QUEUE.enqueue(handler, context, args, meta);
			});
		});
		queues.batch.stop();
	},
	stack: function(){
		var current = lastTask;
		var stack = [];
		while(current) {
			stack.push(current);
			current = current.meta.parentTask;
		}
		return stack;
	},
	logStack: function(){
		var stack = this.stack();
		stack.forEach(function(task){
			var log = task.meta && task.meta.log ? task.meta.log : [task.fn.name, task];
			canDev.log.apply(canDev, [task.meta.stack.name + " ran task:"].concat(log));
		});
	},

};

module.exports = queues;
