/**
 * Tips cards, supporting demo animations
 */
sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId,
      animationTimers = [],
      animationFns = {
        'scp-zoom-card': animateZoom,
        'scp-zoom-keys-card': animateZoom,
        'scp-highlight-card': animateHighlight,
        'scp-lens-card': animateLens,
        'scp-speech-card': animateLens
      },
      ACTORS = [
        BP_CONST.DEMO_PAGE_CONTENTS,
        BP_CONST.DEMO_PARA,
        BP_CONST.DEMO_MOUSE,
        BP_CONST.DEMO_ZOOM_PLUS,
        BP_CONST.DEMO_ZOOM_MINUS,
        BP_CONST.DEMO_LENS_SPACE
      ];

    tips.getGeometryTargets = function(cssValues) {
      return cssValues;
    };

    function cardActivated(id) {
      // Clear existing tips animations
      animationTimers.forEach(clearTimeout);
      animationTimers.length = 0;
      ACTORS.forEach(clearElementDemo);

      // Run the animation function for this card (if any)
      var newAnimation = animationFns[id];
      if (newAnimation) {
        newAnimation(id);
      }

      // Set a class on the demo-page element so it knows what's up
      byId(BP_CONST.DEMO_PAGE).className = id;
      byId(BP_CONST.TIPS_CONTENT_ID).setAttribute('data-active', id);
    }

    function pushTimeout(fn, howLongMs) {
      animationTimers.push(setTimeout(fn, howLongMs));
    }

    // Reset demo page element back to original state
    function clearElementDemo(id) {
      var elem = byId(id);
      elem.setAttribute('data-demo', false);
      elem.style.transitionDuration = '0s';
      setTimeout(function() {
        elem.style.transitionDuration = '';
      }, 20);

    }

    // Optional -- howLongMs is how logn to wait before doing it
    function toggleElementDemo(id, isOn, howLongMs) {
      function toggle() {
        byId(id).setAttribute('data-demo', isOn || false);
      }
      pushTimeout(toggle, howLongMs || 0);
    }

    function animateZoom() {
      function toggleZoom(isOn, key, howLongMs) {
        var FAKE_KEY_DELAY = 70;
        toggleElementDemo(BP_CONST.DEMO_PAGE_CONTENTS, isOn, howLongMs + FAKE_KEY_DELAY); // Zoom page
        toggleElementDemo(BP_CONST.DEMO_SLIDER_THUMB, isOn, howLongMs + FAKE_KEY_DELAY);  // Move slider
        toggleElementDemo(key, true, howLongMs);                                          // Push key
        toggleElementDemo(key, false, howLongMs + 2000);                                  // Release key
      }

      function zoomThenUnzoom() {
        toggleZoom(true, BP_CONST.DEMO_ZOOM_PLUS, 2000);
        toggleZoom(false, BP_CONST.DEMO_ZOOM_MINUS, 6000);
      }

      zoomThenUnzoom();
      pushTimeout(zoomThenUnzoom, 8000);

    }

    function animateHighlight() {
      function highlightThenUnhighlight() {
        toggleElementDemo(BP_CONST.DEMO_MOUSE, true, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 4000);
        toggleElementDemo(BP_CONST.DEMO_MOUSE, false, 6000);
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 6500);
      }
      highlightThenUnhighlight();
      pushTimeout(highlightThenUnhighlight, 9999);
    }

    function animateLens(id) {
      function toggleSpacebar(isPressed) {
        toggleElementDemo(BP_CONST.DEMO_LENS_SPACE, isPressed);
        toggleElementDemo(BP_CONST.DEMO_SPEECH_SPACE, isPressed);
      }

      function pressSpacebar() {
        toggleSpacebar(true);
        pushTimeout(toggleSpacebar, 1000);
      }

      function speakIt() {
        sitecues.emit('mh/do-speak', byId(BP_CONST.DEMO_PARA), true, true);
      }

      function openThenCloseLens() {
        pushTimeout(pressSpacebar, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 3200);  // Open lens
        if (id === 'scp-speech-card') {
          pushTimeout(speakIt, 3200);
        }
        pushTimeout(pressSpacebar, 6000);
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 7200);  // Close lens
      }

      openThenCloseLens();
      pushTimeout(openThenCloseLens, 12000);
    }

    sitecues.on('did-show-card', cardActivated);

    callback();
  });
});
