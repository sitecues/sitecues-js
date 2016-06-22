define(
  [
    'core/bp/helper',
    'page/positioner/style-lock/style-listener/style-listener'
  ],
  function (
    helper,
    styleListener
  ) {

  'use strict';

  var
    // For convenience this map keeps track of which elements we're currently observing
    observedElementMap = new WeakMap(),
    // This map caches the bounding rectangle for each element
    elementToRectMap   = new WeakMap();

  function getRect(element) {
    var
      rect              = elementToRectMap.get(element),
      isElementObserved = observedElementMap.get(element);

    console.log('getRect:', element);
    console.log('rect:', rect);

    if (rect) {
      return rect;
    }

    rect = helper.getRect(element);
    console.log('new rect:', rect);

    if (!isElementObserved) {
      listenForRectangleMutations(element);
    }
    else {
      elementToRectMap.set(element, rect);
    }

    return rect;
  }

  function updateRect(element, rect) {
    var currentRect = elementToRectMap.get(element);
    if (currentRect) {
      elementToRectMap.set(element, rect);
    }
  }

  // We need to listen for style mutations that will impact the
  function listenForRectangleMutations(element) {
    styleListener.init(function () {
      styleListener.registerElementMutationHandler(element, 'display', function () {
        elementToRectMap.set(element, null);
      });
      styleListener.registerElementMutationHandler(element, 'position', function () {
        console.log('position change:', element);
        elementToRectMap.set(element, null);
      });
      observedElementMap.set(element, true);
    });
  }

  return {
    get: getRect,
    update: updateRect
  };
});