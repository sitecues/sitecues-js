sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId,
      animationTimers = [],
      animationFns = {
        'scp-zoom-card': animateZoom,
        'scp-zoom-keys-card': animateZoom,
        'scp-highlight-card': animateHighlight,
        'scp-lens-card': animateLens
      };

    tips.getGeometryTargets = function(cssValues) {
      return cssValues;
    };

    function cardActivated(id) {
      animationTimers.forEach(clearTimeout);

      var newAnimation = animationFns[id];
      if (newAnimation) {
        newAnimation();
      }
    }

    // Optional -- howLongMs is how logn to wait before doing it
    function toggleElementDemo(id, isOn, howLongMs) {
      function toggle() {
        byId(id).setAttribute('data-demo', isOn);
      }
      animationTimers.push(setTimeout(toggle, howLongMs || 0));
    }

    function animateZoom() {
      function zoomThenUnzoom() {
        toggleElementDemo(BP_CONST.DEMO_PARA_ZOOM, true, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA_ZOOM, false, 6000);
      }

      zoomThenUnzoom();
      animationTimers.push(setTimeout(zoomThenUnzoom, 8000));

    }

    function animateHighlight() {
      function highlightThenUnhighlight() {
        toggleElementDemo(BP_CONST.DEMO_MOUSE, true, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA_HIGHLIGHT, true, 4000);
        toggleElementDemo(BP_CONST.DEMO_MOUSE, false, 6000);
        toggleElementDemo(BP_CONST.DEMO_PARA_HIGHLIGHT, false, 6500);
      }
      highlightThenUnhighlight();
      animationTimers.push(setTimeout(highlightThenUnhighlight, 9999));
    }

    function animateLens() {
      function toggleSpacebar(isPressed) {
        toggleElementDemo(BP_CONST.DEMO_LENS_SPACE, isPressed);
      }

      function pressSpacebar() {
        toggleSpacebar(true);
        animationTimers.push(setTimeout(toggleSpacebar, 1000));
      }

      function openThenCloseLens() {
        animationTimers.push(setTimeout(pressSpacebar, 2000));
        toggleElementDemo(BP_CONST.DEMO_PARA_HIGHLIGHT, true, 3200);  // Open lens
        animationTimers.push(setTimeout(pressSpacebar, 6000));
        toggleElementDemo(BP_CONST.DEMO_PARA_HIGHLIGHT, false, 7200);  // Close lens
      }

      openThenCloseLens();
      animationTimers.push(setTimeout(openThenCloseLens, 12000));
    }

    sitecues.on('did-show-card', cardActivated);

    callback();
  });
});
