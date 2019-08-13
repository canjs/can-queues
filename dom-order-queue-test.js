var QUnit = require('steal-qunit');
var DomOrderQueue = require("./dom-order-queue");
var canSymbol = require("can-symbol");

QUnit.module('can-queues/dom-order-queue');

var createElement = document.createElement.bind(document);

QUnit.test("can associate function with element", function(assert){

	var outer = createElement("div"),
		middle = createElement("div"),
		inner = createElement("div");

	outer.appendChild(middle);
	middle.appendChild(inner);

	var queue = new DomOrderQueue("dom");

	var calls = [];
	var prev;
	var fns = ["outer","middle","inner"].map(function(name){
		var element = createElement("div");
		var fn = function(){
			calls.push(name);
		};
		fn[canSymbol.for("can.element")] = element;
		if(prev) {
			prev.appendChild(element);
		}
		prev = element;
		return fn;
	});

	fns.forEach(function(fn){
		queue.enqueue(fn,null, []);
	});
	queue.flush();

	assert.deepEqual(calls,["outer","middle","inner"], "right order when enqueued in order");
	calls = [];


	fns.reverse().forEach(function(fn){
		queue.enqueue(fn,null, []);
	});
	queue.flush();

	assert.deepEqual(calls,["outer","middle","inner"], "right order when enqueued in reverse");
});

QUnit.test("Functions call multiple times retain their element", function(assert) {
	var queue = new DomOrderQueue("dom");
	var element = createElement("span");
	var fn = function(){
		assert.ok(true, "called this function");
	};
	fn[canSymbol.for("can.element")] = element;
	queue.enqueue(fn, null, {});
	queue.enqueue(fn, null, {});

	var otherFn = function(){};
	otherFn[canSymbol.for("can.element")] = createElement("li");
	queue.enqueue(otherFn, null, {});
	queue.flush();
});
