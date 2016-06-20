define(
  [],
  function () {

  'use strict';

  var
    refreshFlags       = {},
    cachedWindowValues = {};

  function getWindowProperty(property) {
    if (typeof cachedWindowValues[property] === 'undefined' || refreshFlags[property]) {
      cachedWindowValues[property] = window[property];
      refreshFlags[property] = false;
    }
    return cachedWindowValues[property];
  }

  function getPageXOffset() {
    return getWindowProperty('pageXOffset');
  }

  function getPageYOffset() {
    return getWindowProperty('pageYOffset');
  }

  function getInnerWidth() {
    return getWindowProperty('innerWidth');
  }

  function getInnerHeight() {
    return getWindowProperty('innerHeight');
  }

  function getOuterWidth() {
    return getWindowProperty('outerWidth');
  }

  function getOuterHeight() {
    return getWindowProperty('outerHeight');
  }

  function getPageOffsets() {
    return {
      x: getPageXOffset(),
      y: getPageYOffset()
    };
  }

  function getInnerDimensions() {
    return {
      width: getInnerWidth(),
      height: getInnerHeight()
    };
  }

  function getOuterDimensions() {
    return {
      width: getOuterWidth(),
      height: getOuterHeight()
    };
  }

  // After the user's initial zoom we need to realign any location hash target to the top of the screen
  function jumpToLocationHash() {
    var hash = document.location.hash,
      EXTRA_SPACE_SCROLL_TOP = 60;
    if (hash) {
      try {  // Not all ids are necessarily valid -- protect against that
        var elem = document.querySelector(hash + ',[name="' + hash.substring(1) + '"]');
        if (elem) {
          elem.scrollIntoView(true);
          window.scrollBy(0, -EXTRA_SPACE_SCROLL_TOP);
        }
      }
      catch(ex) {}
    }
  }

  function init() {
    window.addEventListener('scroll', function () {
      refreshFlags.pageXOffset = true;
      refreshFlags.pageYOffset = true;
    }, true);

    window.addEventListener('resize', function () {
      cachedWindowValues = {};
    }, true);
  }

  return {
    getPageOffsets: getPageOffsets,
    getPageXOffset: getPageXOffset,
    getPageYOffset: getPageYOffset,
    getInnerDimensions: getInnerDimensions,
    getInnerWidth: getInnerWidth,
    getInnerHeight: getInnerHeight,
    getOuterDimensions: getOuterDimensions,
    getOuterWidth: getOuterWidth,
    getOuterHeight: getOuterHeight,
    jumpToLocationHash: jumpToLocationHash,
    init: init
  };
});
