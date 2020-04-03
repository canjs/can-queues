"use strict";
module.exports = {
	lastTask: null,
	remainingTasksCount: Infinity,
	taskBreakpoints: new WeakMap(),
	taskNameBreakpoints: new Set()
};
