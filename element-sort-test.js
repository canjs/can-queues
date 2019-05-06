var QUnit = require('steal-qunit');
var elementSort = require("./element-sort");

QUnit.module('can-scheduler/element-sort');

var createElement = document.createElement.bind(document);

QUnit.test("can compare elements in a document fragment", function(){

	var outer = createElement("div"),
		inner = createElement("div");

	outer.appendChild(inner);

	
	var result = elementSort.sortOrder(outer, inner);
	QUnit.equal(result, -1);
});
