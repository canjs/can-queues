var Queue = require( "./queue" );

var PriorityQueue = function () {
	Queue.apply( this, arguments );
	this.taskMap = new Map();
	this.curPriorityIndex = Infinity;
	this.curPriorityMax = 0;
	this.taskContainersByPriority = [];
	this.isFlushing = false;
	this.tasksRemaining = 0;
};
PriorityQueue.prototype = Object.create( Queue.prototype );
PriorityQueue.prototype.constructor = PriorityQueue;

PriorityQueue.prototype.enqueue = function ( fn, context, args, meta ) {
	if ( !this.taskMap.has( fn ) ) {
		this.tasksRemaining++;
		var isFirst = this.taskContainersByPriority.length === 0;

		var task = {
			fn: fn,
			context: context,
			args: args,
			meta: meta || {}
		};

		var taskContainer = this.getTaskContainerAndUpdateRange( task );
		taskContainer.tasks.push( task );
		this.taskMap.set( fn, task );

		//!steal-remove-start
		this._logEnqueue( task );
		//!steal-remove-end

		if ( isFirst ) {
			this.callbacks.onFirstTask( this );
		}
	}
};

PriorityQueue.prototype.isEnqueued = function ( fn ) {
	return this.taskMap.has( fn );
};

PriorityQueue.prototype.flush = function () {
	if ( this.isFlushing ) {
		// only allow access at one time to this method.
		// This is because when calling .update ... that compute should be only able
		// to cause updates to other computes it directly reads.  It's possible that
		// reading other computes could call `updateAndNotify` again.
		// If we didn't return, it's possible that other computes could update unrelated to the
		// execution flow of the current compute being updated.  This would be very unexpected.
		return;
	}
	this.isFlushing = true;
	while ( true ) {
		if ( this.curPriorityIndex <= this.curPriorityMax ) {
			var taskContainer = this.taskContainersByPriority[this.curPriorityIndex];
			if ( taskContainer && ( taskContainer.tasks.length > taskContainer.index ) ) {
				var task = taskContainer.tasks[taskContainer.index++];
				//!steal-remove-start
				this._logFlush( task );
				//!steal-remove-end
				this.tasksRemaining--;
				this.taskMap["delete"]( task.fn );
				task.fn.apply( task.context, task.args );
			} else {
				this.curPriorityIndex++;
			}
		} else {
			this.taskMap = new Map();
			this.curPriorityIndex = Infinity;
			this.curPriorityMax = 0;
			this.taskContainersByPriority = [];
			this.isFlushing = false;
			this.callbacks.onComplete( this );
			return;
		}
	}
};

PriorityQueue.prototype.flushQueuedTask = function ( fn ) {
	var task = this.taskMap.get( fn );
	if ( task ) {
		var priority = task.meta.priority || 0;
		var taskContainer = this.taskContainersByPriority[priority];
		var index = taskContainer.tasks.indexOf( task, taskContainer.index );

		if ( index >= 0 ) {
			taskContainer.tasks.splice( index, 1 );

			//!steal-remove-start
			this._logFlush( task );
			//!steal-remove-end
			this.tasksRemaining--;
			this.taskMap["delete"]( task.fn );
			task.fn.apply( task.context, task.args );
		}
	}
};

PriorityQueue.prototype.getTaskContainerAndUpdateRange = function ( task ) {
	var priority = task.meta.priority || 0;

	if ( priority < this.curPriorityIndex ) {
		this.curPriorityIndex = priority;
	}

	if ( priority > this.curPriorityMax ) {
		this.curPriorityMax = priority;
	}

	var tcByPriority = this.taskContainersByPriority;
	if ( !tcByPriority[priority] ) {
		tcByPriority[priority] = {tasks: [], index: 0};
	}

	return tcByPriority[priority];
};

PriorityQueue.prototype.tasksRemainingCount = function () {
	return this.tasksRemaining;
};

module.exports = PriorityQueue;
