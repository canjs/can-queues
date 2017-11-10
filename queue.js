var queueState = require( "./queue-state" );
var canDev = require( 'can-util/js/dev/dev' );

function noOperation () {}

var Queue = function ( name, callbacks ) {
	this.callbacks = Object.assign( {
		onFirstTask: noOperation,
		// default clears the last task
		onComplete: function () {
			queueState.lastTask = null;
		}
	}, callbacks || {});
	this.name = name;
	this.index = 0;
	this.tasks = [];
	this._log = false;
};
Queue.prototype.constructor = Queue;

Queue.noop = noOperation;

Queue.prototype.enqueue = function ( fn, context, args, meta ) {
	var len = this.tasks.push({
		fn: fn,
		context: context,
		args: args,
		meta: meta || {}
	});
	//!steal-remove-start
	this._logEnqueue( this.tasks[len - 1] );
	//!steal-remove-end

	if ( len === 1 ) {
		this.callbacks.onFirstTask( this );
	}
};

//!steal-remove-start
Queue.prototype._logEnqueue = function ( task ) {
	task.meta.stack = this;
	task.meta.parentTask = queueState.lastTask;

	if ( this._log === true || this._log === "enqueue" ) {
		var log = task.meta.log ? task.meta.log.concat( task ) : [task.fn.name, task];
		canDev.log.apply( canDev, [this.name + " enqueuing:"].concat( log ));
	}
};

Queue.prototype._logFlush = function ( task ) {
	if ( this._log === true || this._log === "flush" ) {
		var log = task.meta.log ? task.meta.log.concat( task ) : [task.fn.name, task];
		canDev.log.apply( canDev, [this.name + " running  :"].concat( log ));
	}
	queueState.lastTask = task;
};
//!steal-remove-end

Queue.prototype.flush = function () {
		while ( this.index < this.tasks.length ) {
		var task = this.tasks[this.index++];
		//!steal-remove-start
		this._logFlush( task );
		//!steal-remove-end
		task.fn.apply( task.context, task.args );
	}
	this.index = 0;
	this.tasks = [];
	this.callbacks.onComplete( this );
};

Queue.prototype.log = function () {
	this._log = arguments.length ? arguments[0] : true;
};

module.exports = Queue;
