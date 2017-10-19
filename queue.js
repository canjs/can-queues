var queueState = require("./queue-state");
var canDev = require('can-util/js/dev/dev');

var noop = function() {};

var Queue = function(name, callbacks) {
	this.callbacks = Object.assign({
		onFirstTask: noop,
		// default clears the last task
		onComplete: function(){
			queueState.lastTask = null;
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
    this._logEnqueue(this.tasks[this.tasks.length - 1]);
	//!steal-remove-end

	if (this.tasks.length === 1) {
		this.callbacks.onFirstTask(this);
	}
};

//!steal-remove-start
Queue.prototype._logEnqueue = function(task){
    task.meta.stack = this;
    task.meta.parentTask = queueState.lastTask;

    if(this._log === true || this._log === "enqueue") {
        var log = task.meta.log ? task.meta.log.concat(task) : [task.fn.name, task];
        canDev.log.apply(canDev, [this.name + " enqueuing:"].concat(log));
    }
};

Queue.prototype._logFlush = function(task){
    if(this._log === true || this._log === "flush") {
        var log = task.meta && task.meta.log ? task.meta.log : [task.fn.name, task];
        canDev.log.apply(canDev, [this.name + " running  :"].concat(log));
    }
    queueState.lastTask = task;

};
//!steal-remove-end
Queue.prototype.flush = function() {
    while (this.index < this.tasks.length) {
		var task = this.tasks[this.index++];
        //!steal-remove-start
		this._logFlush(task);
        //!steal-remove-end
		task.fn.apply(task.context, task.args);
	}
	this.index = 0;
	this.tasks = [];
	this.callbacks.onComplete(this);
};
Queue.prototype.log = function(){
	this._log = arguments.length ? arguments[0] : true;
};

module.exports = Queue;
