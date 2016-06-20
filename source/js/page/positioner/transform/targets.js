/*
* Targets
*
* This modules keeps track of absolute and fixed transform targets, and applies and removes the styles necessary for the transform logic
* to function correctly. Targets are 'cleaned' when removed, we clear all of its cached information and remove transform and transformOrigin.
* Transform handlers are fun when we add targets.
* */
define(
  [
    'page/positioner/util/array-utility'
  ],
  function (
    arrayUtil
  ) {

  var
    addHandler,
    removeHandler,
    fixedTargets;

  function removeTarget(element) {
    if (fixedTargets.has(element)) {
      fixedTargets.delete(element);
      removeHandler(element);
    }
  }

  function addTarget(element) {
    fixedTargets.add(element);
    addHandler(element);
  }

  function getTargets() {
    return arrayUtil.fromSet(fixedTargets);
  }

  function getCount() {
    return fixedTargets.size;
  }

  function registerAddHandler(fn) {
    addHandler = fn;
  }

  function forEach(fn) {
    fixedTargets.forEach(fn);
  }

  function registerRemoveHandler(fn) {
    removeHandler = fn;
  }

  function init() {
    var noop      = function () {};
    addHandler    = noop;
    removeHandler = noop;
    fixedTargets  = new Set();
  }

  return {
    init                  : init,
    add                   : addTarget,
    get                   : getTargets,
    forEach               : forEach,
    remove                : removeTarget,
    registerAddHandler    : registerAddHandler,
    registerRemoveHandler : registerRemoveHandler,
    getCount              : getCount
  };
});