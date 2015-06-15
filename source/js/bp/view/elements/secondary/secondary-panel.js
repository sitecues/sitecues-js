// TODO rename icon menu buton menu
// Auto size not right
// Card interactions
// Feedback

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
        runningAnimations = [],
        origPanelContentsRect,
        origOutlineHeight,
        origSvgHeight,

        // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
        byId = helper.byId,
        getTransform = transform.getTransform,
        getTransformString = transform.getTransformString,

        features = {
          tips: {
            module: tipsModule,
            menuButtonId: BP_CONST.TIPS_BUTTON_ID,
            labelId: BP_CONST.TIPS_LABEL_ID,
            hasArrows: true,
            panelId: BP_CONST.TIPS_CONTENT_ID
          },
          settings: {
            module: settingsModule,
            menuButtonId: BP_CONST.SETTINGS_BUTTON_ID,
            labelId: BP_CONST.SETTINGS_LABEL_ID,
            hasArrows: true,
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

      function getTransformStyle(elem) {
        return elem.style[helper.transformProperty];
      }

      function setTransformStyle(elem, value) {
        elem.style[helper.transformProperty] = value;
      }

      function isDisabled(id) {
        return byId(id).hasAttribute('aria-disabled');
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
      function createAnimation(transitionFromTo, details) {
        var newAnimation = animate.create(transitionFromTo, details);
        runningAnimations.push(newAnimation);
      }

      function getTargetMorePanelTranslateY() {
        return state.isSecondaryPanelRequested() ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y;
      }

      function animateButtonMenuDrop() {

        var moreId = BP_CONST.MORE_ID,
          morePanel = byId(moreId),
          morePanelCurrentPos = getTransform(morePanel.getAttribute('transform')).translate.top,
          targetPanelPos = getTargetMorePanelTranslateY(),
          posDiff = targetPanelPos - morePanelCurrentPos;

        function onSecondaryAnimationTick(animationState) {
          state.set('currentSecondaryPanelMode', animationState.current);
          transform.setTransform(morePanel, 0, morePanelCurrentPos + posDiff * animationState.current);
        }

        cancelAllAnimations();

        createAnimation({
          'from': morePanelCurrentPos,
          'to': targetPanelPos
        }, {
          'duration': BUTTON_CLICK_ANIMATION_DURATION,
          'onTick': onSecondaryAnimationTick
        });

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


      function getAnimationParams(featureName, menuButton, moreButton, currentOutlineHeight) {
        var
          feature = features[featureName],
          origMenuBtnTransforms = BP_CONST.TRANSFORMS[menuButton.id],
          origMoreBtnTransforms = BP_CONST.TRANSFORMS[BP_CONST.MORE_BUTTON_CONTAINER_ID],
          panelContentsHeight = getPanelContentsHeight(featureName),
          baseCssValues = {
            false: {   // Feature disabled
              'outlineHeight': origOutlineHeight,
              'svgHeight': origSvgHeight,
              'svgTranslateY': 0,
              'bottomSVGTranslateY': 0,
              'moreBtnTranslateY': origMoreBtnTransforms.translateY,
              'menuBtnTranslateX': origMenuBtnTransforms.translateX,
              'menuBtnRotate': 0  // Will be used by icons that roll
            },
            true: {   // Feature enabled
              'bottomSVGTranslateY': panelContentsHeight - 85, // The labels and grey background
              'outlineHeight': panelContentsHeight + 103, // The outline
              'svgHeight': 1200, // The main SVG, allows more space
              'moreBtnTranslateY': panelContentsHeight + 104, // The more button
              'menuBtnTranslateX': 26, // The icon rolls left by default
              'menuBtnRotate': 0    // Will be used by the icons that roll
            }
          };

        return feature.module.extendAnimationParams(baseCssValues);
      }

      function getCurrentOutlineHeight() {
        return parseInt(getOutlineSVG().getAttribute('d').split(' ')[1]);
      }

      function setCurrentOutlineHeight(height) {
        var outlineSVG = getOutlineSVG(),
          shadowSVG = byId(BP_CONST.SHADOW_ID);
        outlineSVG.setAttribute('d', 'M808 ' + height + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + height);
        shadowSVG.setAttribute('d', 'm808,' + height + 'c0,6 -5,11 -11,11H11m797,-11v-' + height);
      }

      function animateSecondaryFeature(name, doEnable) {
        if (doEnable && getFeaturePanelName()) {
          // If we are switching from one panel to another, make sure buttons start from initial state
          resetButtonStyles();
        }

        var
          mainSVG = getMainSVG(),
          bottomSVG = getBottom(),
          moreButton = getMoreButton(),

          feature = features[name],
          featureModule = feature.module,
          featureTick = featureModule.tick,
          menuButton = byId(feature.menuButtonId),

          currentMenuBtnTransform = getTransform(menuButton.getAttribute('transform')),

          currentOutlineHeight = getCurrentOutlineHeight(),
          currentSVGHeight = parseFloat(mainSVG.style.height),
          currentSVGTranslateY = getTransform(getTransformStyle(mainSVG)).translate.top,
          currentBottomSVGTranslateY = getTransform(bottomSVG.getAttribute('transform')).translate.top,
          currentMoreBtnTransform = getTransform(moreButton.getAttribute('transform')),
          currentMoreBtnTranslate = currentMoreBtnTransform.translate,
          currentMoreBtnTranslateX = currentMoreBtnTranslate.left,
          currentMoreBtnTranslateY = currentMoreBtnTranslate.top,
          currentMoreBtnRotate = currentMoreBtnTransform.rotate,
          currentMenuBtnTranslateX = currentMenuBtnTransform.translate.left,
          currentMenuBtnRotate = currentMenuBtnTransform.rotate,

          cssValues = getAnimationParams(name, menuButton, moreButton, currentOutlineHeight),
          fromCSSValues = cssValues[!doEnable],
          targetCSSValues = cssValues[doEnable],

          targetSVGTranslateY = doEnable ? currentSVGTranslateY - (targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[false].svgTranslateY,

          ENABLE_ANIMATION_MS = 1500,
          DISABLE_ANIMATION_MS = 500,

          duration = getDuration(),

          heightTransition = {
            'from': currentSVGHeight,
            'to': targetCSSValues.svgHeight
          },

          heightAnimationDelay = (doEnable && feature.heightAnimationDelay) || 0,

          isSlowlyExpanding = heightTransition.to > heightTransition.from;

        function getDuration() {
          // Use the progress of the more button to determine how far along we are in the animation,
          // and therefore how much time is left
          return animate.getDuration(doEnable ? ENABLE_ANIMATION_MS : DISABLE_ANIMATION_MS,
            fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY);
        }

        function getValueInTime(from, to, time) {
          return from + (to - from) * time;
        }

        function panelHeightTick(animationState) {
          var t = animationState.current;
          // SVG height and outline
          mainSVG.style.height = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
          setTransformStyle(mainSVG, 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)');
          setCurrentOutlineHeight(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t);

          // Bottom gray area
          bottomSVG.setAttribute('transform',
            getTransformString(0,
              getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));

          // More button
          moreButton.setAttribute('transform',
            getTransformString(
              BP_CONST.TRANSFORMS[BP_CONST.MORE_BUTTON_CONTAINER_ID].translateX,
              getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t),
              1,
              currentMoreBtnRotate));
        }

        function openFeatureAnimationTick(animationState) {
          var t = animationState.current;

          // Menu button
          menuButton.setAttribute('transform',
            getTransformString(
              getValueInTime(currentMenuBtnTranslateX, targetCSSValues.menuBtnTranslateX, t),
              0,
              1,
              getValueInTime(currentMenuBtnRotate, targetCSSValues.menuBtnRotate, t)));

          featureTick && featureTick(t, targetCSSValues);
        }

        function fadeInTextContentWhenLargeEnough() {
          setTimeout(function () {
            state.set('isSecondaryExpanding', false);
            sitecues.emit('bp/do-update');
          }, heightAnimationDelay + duration * 0.7);
        }

        function animateHeight() {
          createAnimation(
            heightTransition, {
              'duration': duration,
              'onTick': panelHeightTick
            });
        }

        function openFeatureAnimation() {
          createAnimation(
            heightTransition,
            {
              'duration': duration,
              'onTick': openFeatureAnimationTick
            });
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
      function toggleSecondaryPanel() {

        var featurePanelName = getFeaturePanelName();
        if (featurePanelName) {
          toggleSecondaryFeature(featurePanelName);
          return;
        }

        if (getOrigPanelGeometry()) {
          resetPanelGeometry();
        }

        var ENABLED = BP_CONST.SECONDARY_PANEL_ENABLED,
          DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED;

        var willEnable = state.get('secondaryPanelTransitionTo') !== ENABLED;
        state.set('secondaryPanelTransitionTo', willEnable ? ENABLED : DISABLED);
        updateGlobalState();

        SC_DEV && console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo'));

        sitecues.emit('bp/do-update');

        animateButtonMenuDrop();
      }

      /**
       * Toggle back and forth between button menu and a feature
       * @param featureName
       */
      function toggleSecondaryFeature(featureName) {
        var willEnable = state.getSecondaryPanelName() !== featureName;
        animateSecondaryFeature(featureName, willEnable);
      }

      function getActiveCard() {
        var featureName = state.getSecondaryPanelName(),
          feature = features[featureName];

        return feature && feature.hasArrows && byId(feature.panelId).getElementsByClassName('scp-active')[0];
      }

      function switchCard(direction) {
        var activeCard = getActiveCard(),
            cardToSelect,
            allCards;
        if (activeCard) {
          cardToSelect = direction === 1 ? activeCard.nextElementSibling : activeCard.previousElementSibling;
          if (!cardToSelect) {
            allCards = activeCard.parentElement;
            cardToSelect = direction === 1 ? allCards.firstElementChild : allCards.lastElementChild;
          }

          if (cardToSelect) {
            activeCard.className = activeCard.className.replace('scp-active', '');
            cardToSelect.className = cardToSelect.className + ' scp-active';
          }
        }
      }

      function nextCard() {
        switchCard(1);
        // At first, back button is disabled when on first card
        // However, once we've gone forward we allow backwards cycling
        byId(BP_CONST.PREV_ID).removeAttribute('aria-disabled');
      }

      function prevCard() {
        if (!isDisabled(BP_CONST.PREV_ID)) {
          switchCard(-1);
        }
      }

      function addMouseListeners () {

        forEachFeature(function(feature) {
          var button = byId(feature.menuButtonId),
            label = byId(feature.labelId);
          button.addEventListener('click', onMouseClick);
          label.addEventListener('click', onMouseClick);
        });


        // Some panels have cards
        byId(BP_CONST.PREV_ID).addEventListener('click', prevCard);
        byId(BP_CONST.NEXT_ID).addEventListener('click', nextCard);
      }

    /********************** INIT / RESET **************************/

    function resetStyles() {

      // TODO rename
      var morePanelId = BP_CONST.MORE_ID,
        more = byId(morePanelId);
      more.setAttribute('opacity', 0);
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

    function getOrigPanelGeometry() {
      if (origSvgHeight) {
        return true; // Already initialized
      }
      var mainSvg = getMainSVG();
      origSvgHeight = parseFloat(mainSvg.style.height);
      origOutlineHeight = getCurrentOutlineHeight();
      origPanelContentsRect = document.getElementById(BP_CONST.MAIN_CONTENT_FILL_ID).getBoundingClientRect();
    }

    function resetPanelGeometry() {
      if (origSvgHeight) {  // Was initialized
        var mainSvg = getMainSVG();
        mainSvg.style.height = origSvgHeight + 'px';
        setTransformStyle(mainSvg, '');

        setCurrentOutlineHeight(origOutlineHeight);
        getBottom().removeAttribute('transform');
      }
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
      resetPanelGeometry();

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