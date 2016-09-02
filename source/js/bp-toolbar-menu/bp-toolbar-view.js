/**
 * Toolbar view
 */

define([
  ],
  function() {

    var menuElement,
      origClasses;

    function showHideOption(doAnimate) {
      if (doAnimate) {
        toggleClass('scp-animate-hide', true);
      }
      requestAnimationFrame(function() {
        toggleClass('scp-show-hide', true);
      });
    }

    function toggleClass(name, doForce) {
      var classList = menuElement.classList;
      if (doForce) {
        classList.add(name);
      }
      else {
        classList.remove(name);
      }
    }

    function enableBlurb(blurbName) {
      toggleClass('scp-blurb-' + blurbName, true);
      toggleClass('scp-blurb', true);
    }

    function enableFocus(isFocusEnabled) {
      toggleClass('scp-has-focus', isFocusEnabled);
      toggleClass('scp-no-focus', !isFocusEnabled);
    }

    function reset() {
      menuElement.className = origClasses;
    }

    function init(_menuElement) {
      menuElement = _menuElement;
      origClasses = menuElement.className;
    }

    return {
      reset: reset,
      showHideOption: showHideOption,
      enableBlurb: enableBlurb,
      enableFocus: enableFocus,
      init: init
    };
  });
