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
      // Clear existing tips animations
      animationTimers.forEach(clearTimeout);
      clearElementDemo(BP_CONST.DEMO_PARA);
      clearElementDemo(BP_CONST.DEMO_MOUSE);

      // Run the animation function for this card (if any)
      var newAnimation = animationFns[id];
      if (newAnimation) {
        newAnimation();
      }

      // Set a class on the demo-page element so it knows what's up
      byId(BP_CONST.DEMO_PAGE).className = id;
    }

    // Reset demo page element back to original state
    function clearElementDemo(id) {
      var elem = byId(id);
      elem.setAttribute('data-demo', false);
      elem.style.transitionDuration = '0s';
      setTimeout(function() {
        elem.style.transitionDuration = '';
      }, 0);

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
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 2000);
        toggleElementDemo(BP_CONST.DEMO_ZOOM_PLUS, true, 1930);
        toggleElementDemo(BP_CONST.DEMO_ZOOM_PLUS, false, 3930);
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 6000);
        toggleElementDemo(BP_CONST.DEMO_ZOOM_MINUS, true, 5930);
        toggleElementDemo(BP_CONST.DEMO_ZOOM_MINUS, false, 7930);
      }

      zoomThenUnzoom();
      animationTimers.push(setTimeout(zoomThenUnzoom, 8000));

    }

    function animateHighlight() {
      function highlightThenUnhighlight() {
        toggleElementDemo(BP_CONST.DEMO_MOUSE, true, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 4000);
        toggleElementDemo(BP_CONST.DEMO_MOUSE, false, 6000);
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 6500);
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
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 3200);  // Open lens
        animationTimers.push(setTimeout(pressSpacebar, 6000));
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 7200);  // Close lens
      }

      openThenCloseLens();
      animationTimers.push(setTimeout(openThenCloseLens, 12000));
    }

    sitecues.on('did-show-card', cardActivated);

    callback();
  });
});
