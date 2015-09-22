/**
 * IE cannot handle SVG transforms via CSS, so we do them in script
 * Currently this module implements data-hover="[transform attributes]"
 */

define(['bp/helper', 'bp/constants', 'core/platform', 'bp-expanded/view/svg-animate'],
  function(helper, BP_CONST, platform, animate) {

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
      cssProperties = {
        transform: origTransform + ' ' + (isActiveHover ? target.getAttribute('data-hover') : '')
      },
      options = {
        duration    : HOVER_ANIMATION_MS,
        useAttribute: target instanceof SVGElement
      };

    if (hoverState[id] === isActiveHover) {
      return; // Already doing this
    }

    if (animations[id]) {
      animations[id].cancel();
    }
    animations[id] = animate.animateCssProperties(target, cssProperties, options);
    hoverState[id] = isActiveHover;
  }

  function onMouseOver(evt) {
    toggleHover(helper.getEventTarget(evt), true);
  }

  function onMouseOut(evt) {
    var target = helper.getEventTarget(evt),
      rect = target.getBoundingClientRect();
    if (evt.clientX < rect.left || evt.clientX  > rect.right ||
      evt.clientY < rect.top || evt.clientY  > rect.bottom) {
      // Sanity check necessary for IE, which fired spurious mouseleave events during other animations (e.g. tips animations)
      toggleHover(target, false);
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
      elem[addOrRemoveFn]('mouseleave', onMouseOut);
    }

    while (index--) {
      addOrRemoveHovers(savedHoverElems[index]);
    }
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
    sitecues.on('bp/did-expand', hoversOn); // Future expansions
    sitecues.on('bp/will-shrink', hoversOff);
    sitecues.on('bp/content-loaded', refreshHovers);
    sitecues.on('bp/will-show-secondary-feature', cancelHovers);
  }

  var publics = {
    init: init
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
