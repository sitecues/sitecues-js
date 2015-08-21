/**
 * IE cannot handle SVG transforms via CSS, so we do them in script
 * Currently this module implements data-hover="[transform attributes]"
 */

sitecues.def('bp/view/effects', function (effects, callback) {

  'use strict';

  sitecues.use('bp/helper', 'bp/constants', 'util/platform', 'util/transform', 'util/animate',
    function(helper, BP_CONST, platform, transform, animate) {

      var isActivePanel,
        byId = helper.byId,
        HOVER_ANIMATION_MS = 500,
        hoverElems,
        origTransforms = [],
        animations = [];

      function getContainer() {
        return byId(BP_CONST.BP_CONTAINER_ID);
      }

      function toggleHover(target, isActiveHover) {

        if (target.getAttribute('aria-disabled') === 'true') {
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

        animations[id] && animations[id].cancel();
        animations[id] = animate.animateCssProperties(target, cssProperties, options);
      }

      function onMouseOver(evt) {
        toggleHover(helper.getEventTarget(evt), true);
      }

      function onMouseOut(evt) {
        toggleHover(helper.getEventTarget(evt), false);
      }

      function toggleMouseListeners (willBeActive) {
        if (isActivePanel === willBeActive) {
          return;  // Nothing to do
        }

        isActivePanel = willBeActive;
        hoverElems = getContainer().querySelectorAll('[data-hover]');

        var addOrRemoveFn = isActivePanel ? 'addEventListener' : 'removeEventListener',
          index = hoverElems.length,
          currElem;

        function addOrRemoveHovers(elem) {
          elem.setAttribute('data-id', index);
          elem[addOrRemoveFn]('mouseenter', onMouseOver);
          elem[addOrRemoveFn]('mouseleave', onMouseOut);
        }

        while (index --) {
          currElem = hoverElems[index];
          origTransforms[index] = currElem.getAttribute('transform');
          addOrRemoveHovers(currElem);
        }
      }

      function cancelHovers() {
        var index = hoverElems.length;
        while (index --) {
          toggleHover(hoverElems[index], false);
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
        hoverElems = null;
        hoversOn();
      }

      sitecues.on('bp/did-expand', hoversOn);
      sitecues.on('bp/will-shrink', hoversOff);
      sitecues.on('bp/content-loaded', refreshHovers);
      sitecues.on('bp/do-cancel-hovers', cancelHovers);

      callback();
    });

});

