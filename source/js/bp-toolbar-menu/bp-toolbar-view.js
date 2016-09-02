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

    function setSize(rect) {
      menuElement.style.width = rect.width + 'px';
      menuElement.style.height = rect.height + 'px';
    }

    function enableBlurb(blurbName) {
      var origRect = menuElement.getBoundingClientRect(),
        targetRect;
      toggleClass('scp-blurb-' + blurbName, true);
      toggleClass('scp-blurb', true);

      // Fix to current screen position -- don't roll up with toolbar as it slides up
      menuElement.style.position = 'fixed';
      menuElement.style.top = origRect.top + 'px';
      menuElement.style.right = (window.innerWidth - origRect.right) + 'px';
      menuElement.style.minHeight = origRect.height + 'px';

        // Animate from original width:height
      targetRect = menuElement.getBoundingClientRect();
      setSize(origRect);

      // Animate to target width:height
      // jshint -W030
      menuElement.offsetHeight; // Ask layout engine to update
      menuElement.style.transition = 'width 300ms, height 300ms';
      menuElement.offsetHeight; // Ask layout engine to update
      setSize(targetRect);
      toggleClass('scp-blurb-fade-in-text', true);
      menuElement.offsetHeight; // Ask layout engine to update
      menuElement.style.transitionDelay = '2s';  // Mousing out of blurb should keep it onscreen for just a bit
    }

    function enableFocus(isFocusEnabled) {
      toggleClass('scp-has-focus', isFocusEnabled);
      toggleClass('scp-no-focus', !isFocusEnabled);
    }

    function reset() {
      menuElement.className = origClasses;
      menuElement.style.cssText = '';
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
