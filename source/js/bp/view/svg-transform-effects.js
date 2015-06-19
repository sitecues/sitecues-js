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
        HOVER_SCALE = 1.2,
        expandHoverElems,
        animations = [];

      function getContainer() {
        return byId(BP_CONST.BP_CONTAINER_ID);
      }

      function toggleHover(target, isActiveHover) {

        var id = + target.getAttribute('data-id'),
          targetScale = isActiveHover ? HOVER_SCALE : 1,
          cssProperties = {
            transform: 'scale(' + targetScale + ')'
          },
          options = {
            duration    : HOVER_ANIMATION_MS,
            useAttribute: true,
            onFinish    : !isActiveHover && function() { target.removeAttr('transform'); }
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
        expandHoverElems = expandHoverElems || getContainer().getElementsByClassName('scp-hover-expand');

        var addOrRemoveFn = isActivePanel ? 'addEventListener' : 'removeEventListener',
          index = expandHoverElems.length;

        function addOrRemoveHovers(elem) {
          elem.setAttribute('data-id', index);
          elem[addOrRemoveFn]('mouseover', onMouseOver);
          elem[addOrRemoveFn]('mouseout', onMouseOut);
        }

        while (index --) {
          addOrRemoveHovers(expandHoverElems[index]);
        }
      }

      function cancelHovers() {
        animations.forEach(function(animation) { animation.cancel(); });

        var index = expandHoverElems.length,
          elem;
        while (index --) {
          elem = expandHoverElems[index];
          if (elem.hasAttribute('transform')) {
            toggleHover(elem, false);
          }
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

