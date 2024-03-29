/**
 * Toolbar view
 */

define([
    'core/native-global'
  ],
  function(nativeGlobal) {

    var menuElement,
      origClasses,
      closeDelay;

    function toggleClass(name, doForce) {
      var classList = menuElement.classList;
      if (doForce) {
        classList.add(name);
      }
      else {
        classList.remove(name);
      }
    }

    function setSize(rect) {
      menuElement.style.width = rect.width + 'px';
      menuElement.style.height = rect.height + 'px';
    }

    function showBlurb(blurbName) {
      var BLURB_ANIMATION_MS = 300,
        origRect = menuElement.getBoundingClientRect(),
        targetRect,
        blurbElement = document.getElementById('scp-blurb-' + blurbName),
        previouslyVisibleBlurb = menuElement.getAttribute('data-blurb');

      function updateDomForBlurb() {
        if (previouslyVisibleBlurb) {
          toggleClass('scp-blurb-' + previouslyVisibleBlurb, false);
        }
        toggleClass('scp-blurb-' + blurbName, true);
        toggleClass('scp-blurb', true);
        menuElement.setAttribute('data-blurb', blurbName);
        blurbElement.removeAttribute('data-blurb-ready');
      }
      // Fix to current screen position -- don't roll up with toolbar as it slides up
      function fixScreenPosition() {
        menuElement.style.position = 'fixed';
        menuElement.style.top = origRect.top + 'px';
        menuElement.style.right = (window.innerWidth - origRect.right) + 'px';
      }

      function animateToTargetSize() {
        // Animate from original width:height
        targetRect = menuElement.getBoundingClientRect();
        setSize(origRect);

        // Animate to target width:height
        // jshint -W030
        menuElement.offsetHeight; // Ask layout engine to update
        menuElement.style.transition = 'width ' + BLURB_ANIMATION_MS + 'ms, height ' + BLURB_ANIMATION_MS + 'ms';
        menuElement.offsetHeight; // Ask layout engine to update

        // Set target size
        setSize(targetRect);
        toggleClass('scp-blurb-fade-in-text', true);
        menuElement.offsetHeight; // Ask layout engine to update
        // jshint +W030
      }

      function enableKeyboard() {
        // Focus the blurb so that it is spoken
        // Pressing escape or clicking outside will close it
        // (Mousing out won't close while focus is there)
        // Overall, the experience of the blurb is that it stays on screen unless intentionally dismissed with click/Escape,
        // to ensure that it is read before accidentally disappearing.
        blurbElement.setAttribute('tabindex', '-1');
        blurbElement.focus();
      }

      function onAnimationComplete() {
        blurbElement.setAttribute('data-blurb-ready', '');
      }

      updateDomForBlurb();
      menuElement.style.cssText = '';  // Reset styles
      fixScreenPosition();
      animateToTargetSize();
      enableKeyboard();
      nativeGlobal.setTimeout(onAnimationComplete, BLURB_ANIMATION_MS);
    }

    function enableFocus(isFocusEnabled) {
      toggleClass('scp-has-focus', isFocusEnabled);
      toggleClass('scp-no-focus', !isFocusEnabled);
    }

    function reset() {
      menuElement.className = origClasses;
      menuElement.style.cssText = '';
      menuElement.removeAttribute('data-blurb');
      closeDelay = 0;
    }

    function init(_menuElement) {
      menuElement = _menuElement;
      origClasses = menuElement.className;
    }

    return {
      reset: reset,
      showBlurb: showBlurb,
      enableFocus: enableFocus,
      init: init
    };
  });
