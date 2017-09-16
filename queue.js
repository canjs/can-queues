
var noop = function(){};

var Queue = function(name, callbacks){
    this.callbacks = Object.assign({
        onFirstTask: noop,
        onComplete: noop
    }, callbacks || {})
    this.name = name;
    this.index = 0;
    this.tasks = [];
}
Queue.prototype.enqueue = function(fn, context, args, meta){
    console.log.apply(console, ["    "+this.name+" enqueue task:"].concat(meta.log))
    this.tasks.push({
        fn: fn,
        context: context,
        args: args,
        meta: meta
    });
    if(this.tasks.length === 1) {
        this.callbacks.onFirstTask(this);
    }
}
Queue.prototype._flush = function(){
    while(this.index < this.tasks.length) {
        var task = this.tasks[this.index++];
        console.log.apply(console, [this.name+" run task:"].concat(task.meta.log))
        task.fn.apply(task.context, task.args)
    }
}
Queue.prototype.flush = function(){
    this._flush();
    this.index = 0;
    this.tasks = [];
    this.callbacks.onComplete(this);
}


var PriorityQueue = function(){
    Queue.apply(this, arguments);
    this.taskMap = new Map();
}
PriorityQueue.prototype = Object.create(Queue.prototype);
PriorityQueue.prototype.enqueue = function(fn, context, args, meta){
    if(!this.taskMap.has(fn)) {
        return Queue.prototype.enqueue.apply(this, arguments);
    }
}
PriorityQueue.prototype.flush = function(){
    this._flush();
    this.index = 0;
    this.tasks = [];
    this.taskMap = new Map();
    this.callbacks.onComplete(this);
}

var batchStartCounter = 0;
var addedNotifyTask = false;

var NOTIFY_QUEUE = new Queue("NOTIFY",{
    onComplete: function(){
        //console.log("NOTIFY complete.")
        DERIVE_QUEUE.flush();
    },
    onFirstTask: function(){
        //console.log("NOTIFY first task enqueued.")
        if(!batchStartCounter) {
            NOTIFY_QUEUE.flush();
        } else {
            addedNotifyTask = true;
        }
    }
});
var DERIVE_QUEUE = new PriorityQueue("DERIVE",{
    onComplete: function(){
        //console.log("DERIVE complete.")
        MUTATE_QUEUE.flush();
    },
    onFirstTask: function(){
        //console.log("DERIVE first task enqueued.")
    }
});
var MUTATE_QUEUE = new Queue("MUTATE",{
    onComplete: function(){
        //console.log("MUTATE complete.")

    },
    onFirstTask: function(){
        //console.log("MUTATE first task enqueued.")
    }
});


module.exports = {
    Queue: Queue,
    PriorityQueue: PriorityQueue,
    NOTIFY_QUEUE: NOTIFY_QUEUE,
    DERIVE_QUEUE: DERIVE_QUEUE,
    MUTATE_QUEUE: MUTATE_QUEUE,
    batch: {
        start: function(){
            batchStartCounter++;
        },
        stop: function(){
            batchStartCounter--;
            if(batchStartCounter === 0) {
                if(addedNotifyTask) {
                    addedNotifyTask = false;
                    NOTIFY_QUEUE.flush();
                }
            }
        }
    }
};
