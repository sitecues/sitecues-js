/**
 * Tips cards, supporting demo animations
 */
define(['bp/constants', 'bp/helper'], function (BP_CONST, helper) {

  var byId = helper.byId,
    isInitialized,
    animationTimers = [],
    animationFns = {
      'scp-zoom-card': 'zoom',
      'scp-zoom-keys-card': 'zoom',
      'scp-highlight-card': 'highlight',
      'scp-lens-card': 'lens',
      'scp-speech-card': 'lens'
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

    // Run the animation function for this card (if any)
    var newAnimation = animationFns[id],
      demoPage = byId(BP_CONST.DEMO_PAGE);
    if (newAnimation) {
      animationFnMap[newAnimation](id);
    }

    // Set a class on the demo-page element so it knows what's up
    demoPage.className = 'scp-demo-' + newAnimation;
    demoPage.setAttribute('data-hasdemo', !!newAnimation);
    byId(BP_CONST.TIPS_CONTENT_ID).setAttribute('data-active', id);
  }

  function pushTimeout(fn, howLongMs) {
    animationTimers.push(setTimeout(fn, howLongMs));
  }

  // Reset demo page element back to original state
  function clearElementDemo(id) {
    var elem = byId(id);
    // Reset element back to normal position instantly (temporarily turn of animations)
    elem.setAttribute('data-demo', false);
    elem.style.transitionDuration = '0s';
    setTimeout(function () {
      elem.style.transitionDuration = '';
    }, 20); // Wait at least one frame tick to turn animations back on
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
          audio.speakHighlight(byId(BP_CONST.DEMO_PARA), true, true);
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
      sitecues.on('bp/did-show-card', cardActivated);
    }
  }

  var publics = {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
