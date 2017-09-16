var QUnit = require('steal-qunit');
var queue = require("queue");

QUnit.module('queue');

QUnit.test('basics', function() {

	function queueHandlers(handlersByQueue, context, args) {
		queue.batch.start();
		["notify", "derive", "mutate"].forEach(function(queueName) {
			var name = queueName.toUpperCase() + "_QUEUE";
			var QUEUE = queue[name];
			(handlersByQueue[queueName] || []).forEach(function(handler) {
				QUEUE.enqueue(handler, context, args, {
					log: [handler.name + " by " + context.name]
				})
			})
		})
		queue.batch.stop();
	}

	var gc1 = {
		name: "gc1",
		notifyHandlers: [
			function derivedChild_queueUpdate() {
				derivedChild.queueUpdate();
			}
		],
		mutateHandlers: [function gc1_eventHandler_writableChild_dispatch(a, b) {
			writableChild.dispatch();
		}],
		dispatch: function() {
			queueHandlers({
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, []);
		}
	};

	var gc2 = {
		name: "gc2",
		notifyHandlers: [
			function deriveChild_queueUpdate() {
				// derivedChild.update
			}
		],
		mutateHandlers: [],
		dispatch: function() {
			queueHandlers({
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, []);
		}
	}

	var derivedChild = {
		name: "derivedChild",
		queueUpdate: function() {
			queue.DERIVE_QUEUE.enqueue(this.update, this, [], {
				priority: 1,
				log: ["update on " + this.name]
			})
		},
		update: function() {
			// check value
			// value changed
			queueHandlers({
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, []);
		},
		notifyHandlers: [
			function root_queueUpdate() {
				root.queueUpdate();
			}
		]
	}
	derivedChild.update = derivedChild.update.bind(derivedChild);

	var writableChild = {
		name: "writableChild",
		dispatch: function() {
			// check value
			// value changed
			queueHandlers({
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, []);
		},
		notifyHandlers: [
			function root_queueUpdate() {
				root.queueUpdate();
			}
		],
		mutateHandlers: [
			function eventHandler() {}
		]
	}

	var root = {
		name: "root",
		queueUpdate: function() {
			queue.DERIVE_QUEUE.enqueue(this.update, this, [], {
				priority: 1,
				log: ["update on " + this.name]
			})
		},
		update: function() {
			// check value
			// value changed
			queueHandlers({
				notify: this.notifyHandlers,
				mutate: this.mutateHandlers
			}, this, []);
		},
		mutateHandlers: [function eventHandler() {}]
	};
	root.update = root.update.bind(root);


	queue.batch.start();
	gc1.dispatch()
	gc2.dispatch()
	queue.batch.stop();


});
