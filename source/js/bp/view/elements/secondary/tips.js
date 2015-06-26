sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId,
      animationTimers = [],
      animationFns = {
        'scp-highlight-demo': animateHighlight,
        'scp-lens-demo': animateLens
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

    function animateHighlight() {
      function doIt() {
        toggleElementDemo(BP_CONST.DEMO_MOUSE, true, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA_HIGHLIGHT, true, 4000);
        toggleElementDemo(BP_CONST.DEMO_MOUSE, false, 6000);
        toggleElementDemo(BP_CONST.DEMO_PARA_HIGHLIGHT, false, 6500);
      }
      doIt();
      animationTimers.push(setTimeout(doIt, 9999));
    }

    function animateLens() {
      function toggleSpacebar(isPressed) {
        toggleElementDemo(BP_CONST.LENS_SPACE, isPressed);
      }

      function pressSpacebar() {
        toggleSpacebar(true);
        animationTimers.push(setTimeout(toggleSpacebar, 1000));
      }

      animationTimers.push(setTimeout(pressSpacebar, 2000));
      animationTimers.push(setTimeout(pressSpacebar, 6000));
    }

    sitecues.on('did-show-card', cardActivated);

    callback();
  });
});
