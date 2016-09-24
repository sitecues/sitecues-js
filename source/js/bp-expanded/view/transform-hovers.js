/**
 * IE cannot handle SVG transforms via CSS, so we do them in script
 * Currently this module implements data-hover="[transform attributes]"
 */

define(
  [
    'core/bp/helper',
    'core/bp/constants',
    'bp-expanded/view/transform-util',
    'bp-expanded/view/transform-animate',
    'core/events'
  ],
  function (
    helper,
    BP_CONST,
    transformUtil,
    animate,
    events
  ) {
  'use strict';

  var isActivePanel = false,
    byId = helper.byId,
    HOVER_ANIMATION_MS = 500,
    savedHoverElems = [],
    uniqueId = 0,
    origTransforms = [],
    animations = [],
    hoverState = [];

  function getContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  function toggleHover(target, isActiveHover) {
    if (target.getAttribute('aria-disabled') === 'true' ||
      !target.hasAttribute('data-hover')) {
      return;
    }

    var id = + target.getAttribute('data-id'),
      origTransform = origTransforms[id] || '',
      transformValue = origTransform + ' ' + (isActiveHover ? target.getAttribute('data-hover') : '');

    if (hoverState[id] === isActiveHover) {
      return; // Already doing this
    }

    if (animations[id]) {
      animations[id].finishNow();
    }
    animations[id] = animate.animateTransformLinear(target, transformUtil.getTransformMap(transformValue), HOVER_ANIMATION_MS);
    hoverState[id] = isActiveHover;
  }

  function onMouseOver(evt) {
    toggleHover(helper.getEventTarget(evt), true);
  }

  function onMouseMove(evt) {
    var index = savedHoverElems.length,
      x = evt.clientX,
      y = evt.clientY;
    while (index --) {
      if (hoverState[index] && evt.target !== savedHoverElems[index] && evt.target.parentNode !== savedHoverElems[index] ) {
        var rect = savedHoverElems[index].getBoundingClientRect();
        if (x < rect.left -1 || x > rect.right + 1||
          y < rect.top -1 || y > rect.bottom + 1) {
          toggleHover(savedHoverElems[index], false);
        }
      }
    }
  }

  function toggleMouseListeners (willBeActive) {
    if (isActivePanel === willBeActive) {
      return;  // Nothing to do
    }

    storeAllHoverElements();

    isActivePanel = willBeActive;

    var addOrRemoveFn = isActivePanel ? 'addEventListener' : 'removeEventListener',
      index = savedHoverElems.length;

    function addOrRemoveHovers(elem) {
      elem[addOrRemoveFn]('mouseenter', onMouseOver);
    }

    while (index--) {
      addOrRemoveHovers(savedHoverElems[index]);
    }
    window[addOrRemoveFn]('mousemove', onMouseMove);
  }

  function storeAllHoverElements() {
    var allHoverElems = getContainer().querySelectorAll('[data-hover]'),
      index = allHoverElems.length,
      elem;
    while (index --) {
      elem = allHoverElems[index];
      if (savedHoverElems.indexOf(elem) < 0) {  // If not already saved
        savedHoverElems[uniqueId] = elem;
        elem.setAttribute('data-id', uniqueId);
        origTransforms[uniqueId] = elem.getAttribute('transform');
        ++ uniqueId;
      }
    }
  }

  function cancelHovers() {
    var index = savedHoverElems.length;
    while (index --) {
      toggleHover(savedHoverElems[index], false);
    }
  }

  function hoversOn() {
    toggleMouseListeners(true);
  }

  function hoversOff() {
    toggleMouseListeners(false);
  }

  function refreshHovers() {  // Ensure listeners are added for new content
    hoversOff();
    storeAllHoverElements();
    hoversOn();
  }

  function init() {
    refreshHovers(); // Current expansion
    events.on('bp/did-expand zoom', hoversOn); // Future expansions
    events.on('bp/will-shrink zoom/begin', hoversOff);
    events.on('bp/did-init-secondary bp/content-loaded', refreshHovers);
    events.on('bp/will-show-secondary-feature', cancelHovers);
  }

  return {
    init: init
  };
});
