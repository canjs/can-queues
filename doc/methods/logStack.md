@function can-queues.logStack logStack
@parent can-queues/methods


Logs the return value of `this.stack()`. Extremely useful in debugging during a flush.


A function that returns an array of all the instance queue tasks that ran up to this point during a flush for debugging.

The stack spans all 4 instance queues so it will show which tasks from which queues executed in what order during the flush up to that point.

Returns an empty array in production.
