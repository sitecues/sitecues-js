// TODO rename icon menu button menu
// Auto size not right?
// Card interactions
// Feedback
// IE broken
//   -- .scp-hover-expand: no CSS transform in SVG, all versions of IE: http://stackoverflow.com/questions/21298338/css-transform-on-svg-elements-ie9
//   -- panel height issues
// Firefox
//   -- Prev, next not working

sitecues.def('bp/view/elements/secondary-panel', function (secondaryPanel, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform',
    'bp/view/elements/tips',
    'bp/view/elements/settings',
    'bp/view/elements/feedback',
    'bp/view/elements/about',
    function (BP_CONST, state, helper, animate, transform, tipsModule, settingsModule, feedbackModule, aboutModule) {

      var BUTTON_CLICK_ANIMATION_DURATION = 800,
        ENABLED_PANEL_TRANSLATE_Y = 0,
        DISABLED_PANEL_TRANSLATE_Y = -198,
        MORE_BUTTON_ROTATION_ENABLED = -180,
        runningAnimations = [],
        origPanelContentsRect,
        origOutlineHeight,

        // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
        byId = helper.byId,
        getTransformString = transform.getTransformString,

        features = {
          tips: {
            module: tipsModule,
            menuButtonId: BP_CONST.TIPS_BUTTON_ID,
            labelId: BP_CONST.TIPS_LABEL_ID,
            panelId: BP_CONST.TIPS_CONTENT_ID
          },
          settings: {
            module: settingsModule,
            menuButtonId: BP_CONST.SETTINGS_BUTTON_ID,
            labelId: BP_CONST.SETTINGS_LABEL_ID,
            panelId: BP_CONST.SETTINGS_CONTENT_ID
          },
          feedback: {
            module: feedbackModule,
            menuButtonId: BP_CONST.FEEDBACK_BUTTON_ID,
            labelId: BP_CONST.FEEDBACK_LABEL_ID,
            panelId: BP_CONST.FEEDBACK_CONTENT_ID
          },
          about: {
            module: aboutModule,
            menuButtonId: BP_CONST.ABOUT_BUTTON_ID,
            labelId: BP_CONST.ABOUT_LABEL_ID,
            panelId: BP_CONST.ABOUT_CONTENT_ID,
            heightAnimationDelay: 1200
          }
        };


      /********************** UTIL **************************/

      function forEachFeature(fn) {
        for (var feature in features) {
          if (features.hasOwnProperty(feature)) {
            fn(features[feature]);
          }
        }
      }

      /**
       * Notify the entire panel that changes have occurred
       * @param featureName or falsey value for button menu
       */
      function updateGlobalState(featureName, isSecondaryExpanding) {
        state.set('secondaryPanelName', featureName || 'button-menu');
        state.set('isSecondaryExpanding', isSecondaryExpanding);
        state.set('wasMouseInPanel', false); // When panel shrinks mouse needs to go back inside of it before mouseout closes again
        sitecues.emit('bp/do-update');
      }

      function getMoreButton() {
        return byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
      }

      function getMainSVG() {
        return byId(BP_CONST.SVG_ID);
      }

      function getBottom() {
        return byId(BP_CONST.BOTTOM_MORE_ID);
      }

      function getOutlineSVG() {
        return byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
      }

      function updateMoreButton(outlineHeight, moreButtonRotate) {
        var MORE_BUTTON_Y_OFFSET = 10,
          moreButton = getMoreButton();
        moreButton.setAttribute('transform',
          getTransformString(
            BP_CONST.TRANSFORMS[BP_CONST.MORE_BUTTON_CONTAINER_ID].translateX,
              outlineHeight + MORE_BUTTON_Y_OFFSET, 1, moreButtonRotate));
      }

      function setPanelHeight(outlineHeight, moreButtonRotate) {
        var BOTTOM_Y_OFFSET = -188;

        // Outline
        setCurrentOutlineHeight(outlineHeight);

        // Bottom gray area
        getBottom().setAttribute('transform', getTransformString(0, outlineHeight + BOTTOM_Y_OFFSET));

        // More button
        updateMoreButton(outlineHeight, moreButtonRotate);
      }

      function getTransform(elem) {
        return transform.getTransform(elem.getAttribute('transform'));
      }

      /********************** ANIMATIONS **************************/

        // When something major happens, such as an action to open a new panel, we cancel all current animations
      function cancelAllAnimations() {
        runningAnimations.forEach(function (animation) {
          animation.cancel();
        });
        runningAnimations.length = 0;
      }

      // Create an animation and store it in runningAnimations so we can cancel it if need be
      function createAnimation(duration, onTickFn) {
        var newAnimation = animate.animateViaCallbacks({
          'duration': duration,
          'onTick': onTickFn
        });
        runningAnimations.push(newAnimation);
      }

      function getValueInTime(from, to, time) {
        return from + (to - from) * time;
      }

      function getTargetMorePanelTranslateY() {
        return state.isSecondaryPanelRequested() ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y;
      }

      function animateButtonMenuDrop(willEnable) {

        var moreId = BP_CONST.MORE_ID,
          morePanel = byId(moreId),
          morePanelCurrentPos = getTransform(morePanel).translate.top,
          targetPanelPos = getTargetMorePanelTranslateY(),
          posDiff = targetPanelPos - morePanelCurrentPos,
          moreBtnStartRotation = willEnable ? 0 : MORE_BUTTON_ROTATION_ENABLED,
          moreBtnEndRotation = willEnable ? MORE_BUTTON_ROTATION_ENABLED : 0;

        function onButtonMenuDropTick(time) {
          state.set('currentSecondaryPanelMode', time);
          transform.setTransform(morePanel, 0, morePanelCurrentPos + posDiff * time);
          var moreBtnRotation = getValueInTime(moreBtnStartRotation, moreBtnEndRotation, time);
          updateMoreButton(origOutlineHeight, moreBtnRotation);
        }

        cancelAllAnimations();

        createAnimation(BUTTON_CLICK_ANIMATION_DURATION, onButtonMenuDropTick);

      }

      // Compute based on the size of the contents
      // Auto-resizing is better because the contents will always fit, even if we change them (and importantly after l10n)
      function getPanelContentsHeight(featureName) {
        var range = document.createRange(),
          contentElements = document.querySelectorAll('.scp-if-' + featureName),
          numContentElements = contentElements.length,
          maxHeight = origPanelContentsRect.height,
          normalTop = origPanelContentsRect.top,
          index = 0,
          EXTRA_SPACE = 120;

        // TODO just use selectNodeContents
        function addRect(item) {
          var thisRect = item.getBoundingClientRect(),
            height = thisRect.bottom - normalTop;
          if (height > maxHeight) {
            maxHeight = height;
          }
        }

        for (; index < numContentElements; index++) {
          var elem = contentElements[index];
          range.selectNodeContents(elem);
          addRect(range);
          addRect(elem);
        }

        return maxHeight + EXTRA_SPACE;
      }


      function getGeometryTargets(featureName, menuButton) {
        var
          feature = features[featureName],
          origMenuBtnTransforms = BP_CONST.TRANSFORMS[menuButton.id],
          panelContentsHeight = getPanelContentsHeight(featureName),
          baseGeometryTargets = {
            false: {  // Feature disabled
              outlineHeight: origOutlineHeight,
              menuBtnTranslateX: origMenuBtnTransforms.translateX,
              menuBtnRotate: 0  // Will be used by icons that roll
            },
            true: {   // Feature enabled
              outlineHeight: panelContentsHeight + 103, // The outline
              menuBtnTranslateX: 26, // The icon rolls left by default
              menuBtnRotate: 0    // Will be used by the icons that roll
            }
          };

        return feature.module.getGeometryTargets(baseGeometryTargets);
      }

      function getCurrentOutlineHeight() {
        var outlinePath = getOutlineSVG().getAttribute('d');
        return parseInt(outlinePath.split(' ')[2]);
      }

      function setCurrentOutlineHeight(height) {
        var outlineSVG = getOutlineSVG(),
          shadowSVG = byId(BP_CONST.SHADOW_ID);
        // Important: do not take the space out. We need it for parsing in getCurrentOutlineHeight()
        outlineSVG.setAttribute('d', 'M 808 ' + height + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + height);
        shadowSVG.setAttribute('d', 'm808,' + height + 'c0,6 -5,11 -11,11H11m797,-11v-' + height);
      }

      function animateSecondaryFeature(name, doEnable) {
        if (doEnable && getFeaturePanelName()) {
          // If we are switching from one panel to another, make sure buttons start from initial state
          resetButtonStyles();
        }

        var
          feature = features[name],
          featureModule = feature.module,
          featureTick = featureModule.tick,
          menuButton = byId(feature.menuButtonId),

          currentMenuBtnTransform = getTransform(menuButton),

          currentOutlineHeight = getCurrentOutlineHeight(),

          currentMenuBtnTranslateX = currentMenuBtnTransform.translate.left,
          currentMenuBtnRotate = currentMenuBtnTransform.rotate,

          geometryTargets = getGeometryTargets(name, menuButton),
          fromGeo = geometryTargets[!doEnable],
          toGeo = geometryTargets[doEnable],

          ENABLE_ANIMATION_MS = 1500,
          DISABLE_ANIMATION_MS = 500,

          duration = getDuration(),

          heightAnimationDelay = (doEnable && feature.heightAnimationDelay) || 0,

          isSlowlyExpanding = toGeo.outlineHeight > currentOutlineHeight;

        function getDuration() {
          // Use the progress of the more button to determine how far along we are in the animation,
          // and therefore how much time is left
          return animate.getDuration(doEnable ? ENABLE_ANIMATION_MS : DISABLE_ANIMATION_MS,
            fromGeo.outlineHeight, toGeo.outlineHeight, currentOutlineHeight);
        }

        function panelHeightTick(time) {
          // SVG height and outline
          setPanelHeight(getValueInTime(currentOutlineHeight, toGeo.outlineHeight, time), MORE_BUTTON_ROTATION_ENABLED);
        }

        function openFeatureAnimationTick(time) {
          // Menu button
          menuButton.setAttribute('transform',
            getTransformString(
              getValueInTime(currentMenuBtnTranslateX, toGeo.menuBtnTranslateX, time),
              0,
              1,
              getValueInTime(currentMenuBtnRotate, toGeo.menuBtnRotate, time)));

          featureTick && featureTick(time, toGeo);
        }

        function fadeInTextContentWhenLargeEnough() {
          setTimeout(function () {
            state.set('isSecondaryExpanding', false);
            sitecues.emit('bp/do-update');
          }, heightAnimationDelay + duration * 0.7);
        }

        function animateHeight() {
          createAnimation(duration, panelHeightTick);
        }

        function openFeatureAnimation() {
          createAnimation(duration, openFeatureAnimationTick);
        }

        cancelAllAnimations();

        updateGlobalState(doEnable && name, isSlowlyExpanding);

        // Let feature module know that animation is about to begin
        featureModule.onAnimationStart && featureModule.onAnimationStart();

        // Animate the menu button and anything else related to opening the feature
        openFeatureAnimation();

        // Animate the height at the right time
        setTimeout(animateHeight, heightAnimationDelay);

        fadeInTextContentWhenLargeEnough();

        suppressHoversUntilMousemove();
      }

      // Some browsers don't recompute CSS hover state unless mouse moves, so
      // hover even though a button has moved away from the mouse cursor, it will still get
      // the :hover effect unless we suppress it until the next mouse move
      function suppressHoversUntilMousemove() {
        function suppressHovers() {
          state.set('doSuppressHovers', false);
          sitecues.emit('bp/do-update');
          getMainSVG().removeEventListener('mousemove', suppressHovers);
        }

        state.set('doSuppressHovers', true);
        sitecues.emit('bp/do-update');
        getMainSVG().addEventListener('mousemove', suppressHovers);
      }

      /********************** INTERACTIONS **************************/

      function onMouseClick(e) {

        var featureName = e.currentTarget.getAttribute('data-feature');
        if (featureName) {
          toggleSecondaryFeature(featureName);
        }
      }

      function getFeaturePanelName() {
        var secondaryPanelName = state.getSecondaryPanelName();
        return features[secondaryPanelName] && secondaryPanelName;
      }

      /**
       * Toggle back and forth between main panel and secondary panel
       */
      function toggleSecondaryPanel(feature) {

        var featurePanelName = feature || getFeaturePanelName();
        if (featurePanelName) {
          toggleSecondaryFeature(featurePanelName);
          return;
        }

        origOutlineHeight = origOutlineHeight || getCurrentOutlineHeight();
        origPanelContentsRect = origPanelContentsRect || document.getElementById(BP_CONST.MAIN_CONTENT_FILL_ID).getBoundingClientRect();

        SC_DEV && console.log('outline height from gBCR = ' + getOutlineSVG().getBoundingClientRect().height);
        SC_DEV && console.log('Ratio= ' + getCurrentOutlineHeight() / getOutlineSVG().getBoundingClientRect().height);

        var ENABLED = BP_CONST.SECONDARY_PANEL_ENABLED,
          DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED,
          willEnable = state.get('secondaryPanelTransitionTo') !== ENABLED;

        state.set('secondaryPanelTransitionTo', willEnable ? ENABLED : DISABLED);
        updateGlobalState();

        SC_DEV && console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo'));

        sitecues.emit('bp/do-update');

        animateButtonMenuDrop(willEnable);
      }

      /**
       * Toggle back and forth between button menu and a feature
       * @param featureName
       */
      function toggleSecondaryFeature(featureName) {
        var willEnable = state.getSecondaryPanelName() !== featureName;
        animateSecondaryFeature(featureName, willEnable);
      }



      function addMouseListeners () {

        forEachFeature(function(feature) {
          var button = byId(feature.menuButtonId),
            label = byId(feature.labelId);
          button.addEventListener('click', onMouseClick);
          label.addEventListener('click', onMouseClick);
        });
      }

    /********************** INIT / RESET **************************/

    function resetStyles() {

      var morePanelId = BP_CONST.MORE_ID,
        more = byId(morePanelId);
      more.setAttribute('transform', getTransformString(0, BP_CONST.TRANSFORMS[morePanelId].translateY));

      resetButtonStyles();
    }

    function resetButtonStyles() {
      // Menu buttons
      forEachFeature(function(feature) {
        var button = feature.menuButtonId,
          transform = BP_CONST.TRANSFORMS[button];
        byId(button).setAttribute('transform', getTransformString(transform.translateX, 0));
      });
    }

    function initSecondaryPanel () {
      addMouseListeners();
      resetStyles();
    }

    function resetSecondaryPanel () {

      if (state.isSecondaryPanel()) {
        // Toggle current panel off
        sitecues.emit('bp/did-toggle-' + state.getSecondaryPanelName(), false);
      }

      var DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED;

      resetStyles();
      if (origOutlineHeight) {
        setPanelHeight(origOutlineHeight, 0);
      }

      state.set('currentSecondaryPanelMode',  DISABLED);
      state.set('secondaryPanelTransitionTo', DISABLED);

      cancelAllAnimations();
      updateGlobalState();
    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initSecondaryPanel);

    sitecues.on('bp/do-toggle-secondary-panel', toggleSecondaryPanel);

    sitecues.on('bp/will-shrink', resetSecondaryPanel);

    callback();
  });

});