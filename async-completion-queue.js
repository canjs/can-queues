var Queue = require( "./queue" );

// This queue does not allow another task to run until this one is complete
var AsyncCompletionQueue = function () {
	Queue.apply( this, arguments );
	this.flushCount = 0;
};
AsyncCompletionQueue.prototype = Object.create( Queue.prototype );
AsyncCompletionQueue.prototype.constructor = AsyncCompletionQueue;

AsyncCompletionQueue.prototype.flush = function () {
	if ( this.flushCount === 0 ) {
		this.flushCount ++;

        var runTask = (function runTask(){
            if(this.index < this.tasks.length) {
                var task = this.tasks[this.index++];
    			//!steal-remove-start
    			this._logFlush( task );
    			//!steal-remove-end
    			task.fn.apply( task.context, task.args ); // when this runs ... everything should be "finished" before the next step

            } else {
                this.index = 0;
        		this.tasks = [];
        		this.flushCount--;
        		this.callbacks.onComplete( this );
            }
        }).bind(this);


	}
};

module.exports = AsyncCompletionQueue;
