/**
 *  This file contains logic for the "?" button placement and functionality that opens up the
 *  help / info page to provide sitecues users with a document to learn how to use the tool, including
 *  keyboard commands.
 */

sitecues.def('bp/view/elements/more-button', function (moreButton, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'zoom', 'audio', 'animate', 'util/transform', function (BP_CONST, state, helper, zoomMod, audioMod, animate, transform) {

    var mouseEnterAnimation,
        mouseLeaveAnimation,
        BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        BUTTON_LEAVE_ANIMATION_DURATION = 400,
        NO_INPUT_TIMEOUT                = 7000,
        userInputTimeoutId,
        alwaysShowButton                = false,
        userInputOccured                = false;

    function onMouseEnter (e) {

      var id               = e.target.id,
          btn              = helper.byId(id),
          currentTranslate = transform.getTranslate(btn.getAttribute('transform'));

      if (mouseLeaveAnimation) {
        mouseLeaveAnimation.cancel();
      }

      mouseEnterAnimation = animate.create(btn, {
        'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(' + BP_CONST.TRANSFORMS[id].scale + ')'
      }, {
        'duration': BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });

    }

    function onMouseLeave (e) {

      var id               = e.target.id,
          btn              = helper.byId(id),
          currentTranslate = transform.getTranslate(btn.getAttribute('transform'));

      if (mouseEnterAnimation) {
        mouseEnterAnimation.cancel();
      }

      mouseLeaveAnimation = animate.create(btn, {
        'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(1)'
      }, {
        'duration': BUTTON_LEAVE_ANIMATION_DURATION,
        'useAttribute': true,
        'animationFn': 'linear'

      });

    }

    function onMouseClick () {
      sitecues.emit('info/help');
    }

    function initMorePanel () {

      addMouseListeners();

      // Commented out because having the "?" always in the panel makes it look bloated.

      // if (zoomMod.hasZoomEverBeenSet() || audioMod.isSpeechEnabled()) {
      //   alwaysShowButton = true;
      // }
    }

    function addMouseListeners () {

      var moreButton = helper.byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);

      moreButton.addEventListener('mouseenter', onMouseEnter);
      moreButton.addEventListener('mouseleave', onMouseLeave);
      moreButton.addEventListener('click', onMouseClick);

    }

    function showHelpButton () {

      var btnContainer           = helper.byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate       = transform.getTranslate(btnContainer.getAttribute('transform')),
          opacityTransitionClass = alwaysShowButton ? 'scp-transition-opacity' : 'scp-transition-opacity-fast';

      // The first time the "?" is presented to the user, scale the "?" to 0.5 and then animate it to a scale of 1
      if (!alwaysShowButton) {

        btnContainer.setAttribute('transform', 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(' + 0.5 + ')');

        animate.create(btnContainer, {
          'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(1)'
        }, {
          'duration': BUTTON_ENTER_ANIMATION_DURATION,
          'useAttribute': true
        });

      }

      btnContainer.setAttribute('class', opacityTransitionClass);
      btnContainer.style.opacity = 1;
      helper.byId(BP_CONST.BOTTOM_ID).removeEventListener('mousemove', showHelpButton);
      alwaysShowButton = true;
    }

    function hideHelpButton () {

      var moreButton       = helper.byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate = transform.getTranslate(moreButton.getAttribute('transform'));

      moreButton.setAttribute('class', '');
      moreButton.style.opacity = 0;

      helper.byId(BP_CONST.BOTTOM_ID).removeEventListener('mousemove', showHelpButton);

      if (mouseEnterAnimation) {
        mouseEnterAnimation.cancel();
      }

      if (mouseLeaveAnimation) {
        mouseLeaveAnimation.cancel();
      }

      mouseLeaveAnimation = animate.create(moreButton, {
        'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(1)'
      }, {
        'duration': 1,
        'useAttribute': true,
        'animationFn': 'linear'
      });

      clearTimeout(userInputTimeoutId);
    }

    function captureUserInput () {
      userInputOccured = true;
      helper.byId(BP_CONST.SVG_ID).removeEventListener('mousedown', captureUserInput);
    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initMorePanel);

    sitecues.on('bp/did-expand', function () {
      if (alwaysShowButton) {
        showHelpButton();
        return;
      }
      helper.byId(BP_CONST.BOTTOM_ID).addEventListener('mousemove', showHelpButton);
      helper.byId(BP_CONST.SVG_ID).addEventListener('mousedown', captureUserInput);
      userInputTimeoutId = setTimeout(function () {
        if (!userInputOccured) {
          showHelpButton();
        }
      }, NO_INPUT_TIMEOUT);
    });

    sitecues.on('bp/do-show-help-button', showHelpButton);


    sitecues.on('bp/will-shrink', hideHelpButton);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});