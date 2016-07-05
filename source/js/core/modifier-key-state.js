/**
 * Track status of modifier keys
 * For now, we are only using this to track the Ctrl key (to help understand wheel events)
 */
define([ 'core/dom-events', 'core/constants' ], function(domEvents, constants) {

  var isCtrlKeyDownNow = false,
    CTRL_KEY_CODE = constants.KEY_CODE.CTRL;
  
  function onKeyDown(event) {
    if (event.keyCode === CTRL_KEY_CODE) {
      console.log('down');
      isCtrlKeyDownNow = true;
    }
  }

  function onKeyUp(event) {
    if (event.keyCode === CTRL_KEY_CODE) {
      console.log('up');
      isCtrlKeyDownNow = false;
    }
  }

  function isCtrlKeyDown() {
    console.log('isdown ' +isCtrlKeyDownNow);
    return isCtrlKeyDownNow;
  }

  function init() {
    domEvents.on(window, 'keydown', onKeyDown);
    domEvents.on(window, 'keyup', onKeyUp);
  }

  return {
    init : init,
    isCtrlKeyDown: isCtrlKeyDown
  };
});
