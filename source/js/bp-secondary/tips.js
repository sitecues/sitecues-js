/**
 * Tips cards, supporting demo animations
 */
define(
  [
    'core/bp/constants',
    'core/bp/helper',
    'core/events',
    'core/native-functions',
    'core/inline-style/inline-style'
  ],
  function (
    BP_CONST,
    helper,
    events,
    nativeFn,
    inlineStyle
  ) {
  'use strict';

  var byId = helper.byId,
    isInitialized,
    animationTimers = [],
    animationFns = {
      'scp-zoom-card': 'zoom',
      'scp-zoom-keys-card': 'zoom',
      'scp-highlight-card': 'highlight',
      'scp-lens-card': 'lens',
      'scp-speech-card': 'lens',
      'scp-full-guide-card': 'none'
    },
    animationFnMap = {
      'zoom': animateZoom,
      'highlight': animateHighlight,
      'lens': animateLens
    },
    ACTORS = [
      BP_CONST.DEMO_PAGE_CONTENTS,
      BP_CONST.DEMO_PARA,
      BP_CONST.DEMO_MOUSE,
//        BP_CONST.DEMO_ZOOM_PLUS,
//        BP_CONST.DEMO_ZOOM_MINUS,
      BP_CONST.DEMO_LENS_SPACE
    ];

  function getGeometryTargets(cssValues) {
    return cssValues;
  }

  function cardActivated(id) {
    // Clear existing tips animations
    animationTimers.forEach(clearTimeout);
    animationTimers.length = 0;
    ACTORS.forEach(clearElementDemo);

    // Find an appropriate animation
    var newAnimation = animationFns[id],
      demoPage,
      hasAnimation;
    if (!newAnimation) {
      return;
    }

    demoPage = byId(BP_CONST.DEMO_PAGE);
    hasAnimation = newAnimation !== 'none';
    demoPage.setAttribute('data-hasdemo', hasAnimation);

    if (hasAnimation) {
      // Run the animation function for this card (if any)
      animationFnMap[newAnimation](id);

      // Set a class on the demo-page element so it knows what's up
      demoPage.className = 'scp-demo-' + newAnimation;
      byId(BP_CONST.TIPS_CONTENT_ID).setAttribute('data-active', id);
    }
  }

  function pushTimeout(fn, howLongMs) {
    animationTimers.push(nativeFn.setTimeout(fn, howLongMs));
  }

  // Reset demo page element back to original state
  function clearElementDemo(id) {
    var elem = byId(id);
    if (elem) {
      // Reset element back to normal position instantly (temporarily turn of animations)
      elem.setAttribute('data-demo', false);
      inlineStyle(elem).transitionDuration = '0s';
      nativeFn.setTimeout(function () {
        inlineStyle(elem).transitionDuration = '';
      }, 20); // Wait at least one frame tick to turn animations back on
    }
  }

  // Optional -- howLongMs is how long to wait before doing it
  function toggleElementDemo(id, isOn, howLongMs) {
    function toggle() {
      byId(id).setAttribute('data-demo', isOn || false);
    }
    pushTimeout(toggle, howLongMs || 0);
  }

  function animateZoom() {
    function toggleZoom(isOn, key, howLongMs) {
      toggleElementDemo(BP_CONST.DEMO_PAGE_CONTENTS, isOn, howLongMs); // Zoom page
      toggleElementDemo(BP_CONST.DEMO_SLIDER_THUMB, isOn, howLongMs);  // Move slider
      toggleElementDemo(key, true, howLongMs);                         // Push key
      toggleElementDemo(key, false, howLongMs + 2000);                 // Release key
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

    function openThenCloseLens() {
      require(['audio/audio'], function(audio) {
        function speakIt() {
          audio.speakContent(byId(BP_CONST.DEMO_PARA), true);
        }

        pushTimeout(pressSpacebar, 2000);
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 3200);  // Open lens
        if (id === 'scp-speech-card') {
          pushTimeout(speakIt, 3200);
        }
        pushTimeout(pressSpacebar, 6000);
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 7200);  // Close lens
      });
    }

    openThenCloseLens();
    pushTimeout(openThenCloseLens, 12000);
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      events.on('bp/did-show-card', cardActivated);
    }
  }

  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

});
