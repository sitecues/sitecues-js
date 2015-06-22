/**
 * IE cannot handle SVG transforms via CSS, so we do them in script
 * Currently this module implements .scp-expand-hover, but it can implement more
 */

// TODO do we still need .scp-hovers?

sitecues.def('bp/view/effects', function (effects, callback) {

  'use strict';

  sitecues.use('bp/helper', 'bp/constants', 'platform', 'util/transform', 'animate',
    function(helper, BP_CONST, platform, transform, animate) {

      var isActivePanel,
        byId = helper.byId,
        HOVER_ANIMATION_MS = 500,
        expandHoverElems,
        animations = [];

      function getContainer() {
        return byId(BP_CONST.BP_CONTAINER_ID);
      }

      function toggleHover(target, isActiveHover) {

        var id = + target.getAttribute('data-id'),
          cssProperties = {
            transform: isActiveHover ? target.getAttribute('data-hover') : ' ' // Setting to space is like no transform
          },
          options = {
            duration    : HOVER_ANIMATION_MS,
            useAttribute: target instanceof SVGElement
//            onFinish: function() {
//              animations[id] = null;
//            }
          };

        animations[id] && animations[id].cancel();
        animations[id] = animate.animateCssProperties(target, cssProperties, options);
      }

      function onMouseOver(evt) {
        toggleHover(evt.currentTarget, true);
      }

      function onMouseOut(evt) {
        toggleHover(evt.currentTarget, false);
      }

      function toggleMouseListeners (willBeActive) {
        if (isActivePanel === willBeActive) {
          return;  // Nothing to do
        }

        isActivePanel = willBeActive;
        expandHoverElems = expandHoverElems || getContainer().querySelectorAll('[data-hover]');

        var addOrRemoveFn = isActivePanel ? 'addEventListener' : 'removeEventListener',
          index = expandHoverElems.length;

        function addOrRemoveHovers(elem) {
          elem.setAttribute('data-id', index);
          elem[addOrRemoveFn]('mouseenter', onMouseOver);
          elem[addOrRemoveFn]('mouseleave', onMouseOut);
        }

        while (index --) {
          addOrRemoveHovers(expandHoverElems[index]);
        }
      }

      function cancelHovers() {
        var index = expandHoverElems.length;
        while (index --) {
          toggleHover(expandHoverElems[index], false);
        }
      }

      function onDidExpand() {
        toggleMouseListeners(true);
      }

      function onWillShrink() {
        toggleMouseListeners(false);
      }

      sitecues.on('bp/did-expand', onDidExpand);
      sitecues.on('bp/will-shrink', onWillShrink);
      sitecues.on('bp/do-cancel-hovers', cancelHovers);

      callback();
    });

});
