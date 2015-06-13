// TODO rename icon menu buton menu
// About
// Feedback
// Toggle feature off
// Auto size
// Cards

sitecues.def('bp/view/elements/secondary-panel', function (secondaryPanel, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform',
    'bp/view/elements/tips',
    'bp/view/elements/settings',
    'bp/view/elements/feedback',
    'bp/view/elements/about',
    function (BP_CONST, state, helper, animate, transform, tipsModule, settingsModule, feedbackModule, aboutModule) {

    var animationIds = {},
        BUTTON_CLICK_ANIMATION_DURATION = 800,
        ENABLED_PANEL_TRANSLATE_Y       = 0,
        DISABLED_PANEL_TRANSLATE_Y      = -198,
        featureAnimation,
        heightAnimation,
        mainPanelContentsRect,

        // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
        byId = helper.byId,
        getTransform = transform.getTransform,
        getTransformString = transform.getTransformString,

        features = {
          tips : {
            module: tipsModule,
            menuButtonId: BP_CONST.TIPS_BUTTON_ID,
            labelId: BP_CONST.TIPS_LABEL_ID,
            hasArrows: true,
            panelId: BP_CONST.TIPS_CONTENT_ID
          },
          settings : {
            module: settingsModule,
            menuButtonId: BP_CONST.SETTINGS_BUTTON_ID,
            labelId: BP_CONST.SETTINGS_LABEL_ID,
            hasArrows: true,
            panelId: BP_CONST.SETTINGS_CONTENT_ID
          },
          feedback : {
            module: feedbackModule,
            menuButtonId: BP_CONST.FEEDBACK_BUTTON_ID,
            labelId: BP_CONST.FEEDBACK_LABEL_ID,
            panelId: BP_CONST.FEEDBACK_CONTENT_ID
          },
          about : {
            module: aboutModule,
            menuButtonId: BP_CONST.ABOUT_BUTTON_ID,
            labelId: BP_CONST.ABOUT_LABEL_ID,
            panelId: BP_CONST.ABOUT_CONTENT_ID,
            heightAnimationDelay: 1200
          }
        };


    function cancelAnimation (id) {
      animationIds[id] && animationIds[id].cancel();
    }

    function cancelAllAnimations () {
      for (var animationId in animationIds) {
        if (animationIds.hasOwnProperty(animationId)) {
          animationIds[animationId].cancel();
        }
      }
    }

    function getTargetMorePanelTranslateY () {
      return state.isSecondaryPanelRequested() ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y;
    }

    function onMouseClick (e) {

      var featureName = e.currentTarget.getAttribute('data-feature');
      if (featureName) {
        toggleSecondaryFeature(featureName);
      }
   }

    function toggleSecondaryPanel () {

      var ENABLED  = BP_CONST.SECONDARY_PANEL_ENABLED,
          DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED;

      var wasEnabled = state.get('secondaryPanelTransitionTo') === ENABLED;
      state.set('secondaryPanelTransitionTo', wasEnabled ? DISABLED : ENABLED);

      SC_DEV && console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo'));

      animateButtonMenuDrop();

      sitecues.emit('bp/do-update');

    }

    function animateButtonMenuDrop () {

      var moreId              = BP_CONST.MORE_ID,
          morePanel           = byId(moreId),
          morePanelCurrentPos = getTransform(morePanel.getAttribute('transform')).translate.top,
          targetPanelPos      = getTargetMorePanelTranslateY(),
          posDiff             = targetPanelPos - morePanelCurrentPos;

      cancelAnimation(moreId);

      function onSecondaryAnimationTick (animationState) {
        state.set('currentSecondaryPanelMode', animationState.current);
        transform.setTransform(morePanel, 0, morePanelCurrentPos + posDiff * animationState.current);
      }

      animationIds[moreId] = animate.create({
        'from'    : morePanelCurrentPos,
        'to'      : targetPanelPos
      }, {
        'duration': BUTTON_CLICK_ANIMATION_DURATION,
        'onTick'  : onSecondaryAnimationTick
      });

    }

    function resetStyles() {

      // More button
      var moreId = BP_CONST.MORE_ID,
        moreButton = byId(moreId);
      moreButton.setAttribute('opacity', 0);
      moreButton.setAttribute('transform', getTransformString(0, BP_CONST.TRANSFORMS[moreId].translateY));

      // Menu button
      forEachFeature(function(feature) {
        var button = feature.menuButtonId,
          transform = BP_CONST.TRANSFORMS[button];
        byId(button).setAttribute('transform', getTransformString(transform.translateX, transform.translateY));
      });
    }

    function initSecondaryPanel () {
      addMouseListeners();
      resetStyles();
      mainPanelContentsRect = document.getElementById(BP_CONST.MAIN_CONTENT_FILL_ID).getBoundingClientRect();
    }

    function resetSecondaryPanel () {

      var DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED,
        activePanel = state.getSecondaryPanelName();

      cancelAllAnimations();

      resetStyles();

      state.set('currentSecondaryPanelMode',  DISABLED);
      state.set('secondaryPanelTransitionTo', DISABLED);

      if (features[activePanel]) {
        animateSecondaryFeature(activePanel, true, true);
      }

      setCurrentFeature();
    }

    function addMouseListeners () {

      forEachFeature(function(feature) {
        var button = byId(feature.menuButtonId),
          label = byId(feature.labelId);
        button.addEventListener('click', onMouseClick);
        label.addEventListener('click', onMouseClick);
      });
    }

    function forEachFeature(fn) {
      for (var feature in features) {
        if (features.hasOwnProperty(feature)) {
          fn(features[feature]);
        }
      }
    }

    /**
     *
     * @param name or null for button menu
     */
    function setCurrentFeature(name, isSecondaryExpanding) {
      featureAnimation && featureAnimation.cancel();
      state.set('secondaryPanelName', name || 'button-menu');
      state.set('isSecondaryExpanding', isSecondaryExpanding);
      state.set('isAnimating', true);
      sitecues.emit('bp/do-update');
    }

    function getValueInTime(from, to, time) {
      return from + (to - from) * time;
    }

    function getNumberFromString (str) {
      return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
    }

    // Compute based on the size of the contents
    // Auto-resizing is better because the contents will always fit, even if we change them (and importantly after l10n)
    function getPanelContentsHeight(featureName) {
      var range = document.createRange(),
        contentElements = document.querySelectorAll('.scp-if-' + featureName),
        numContentElements = contentElements.length,
        maxHeight = mainPanelContentsRect.height,
        normalTop = mainPanelContentsRect.top,
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

      for (; index < numContentElements; index ++) {
        var elem = contentElements[index];
        range.selectNodeContents(elem);
        addRect(range);
        addRect(elem);
      }

      return maxHeight + EXTRA_SPACE;
    }


    function getCssValues(featureName, menuButton, moreButton, currentOutlineHeight) {
      var
        feature = features[featureName],
        moreBtnTranslate = getTransform(moreButton.getAttribute('transform')).translate,
        menuButtonTransform = getTransform(menuButton.getAttribute('transform')),
        mainSVG                     = byId(BP_CONST.SVG_ID),
        bottomSVG                   = byId(BP_CONST.BOTTOM_MORE_ID),
        panelContentsHeight         = getPanelContentsHeight(featureName),
        baseCssValues = {
          true: {
            'bottomSVGTranslateY'     : panelContentsHeight - 85, // The labels and grey background
            'outlineHeight'           : panelContentsHeight + 103, // The outline
            'svgHeight'               : 1200, // The main SVG, allows more space
            'moreBtnTranslateX'       : 400, // The more button
            'moreBtnTranslateY'       : panelContentsHeight + 104, // The more button
            'menuBtnTranslateX'        : 26, // The icon rolls left by default
            'menuBtnTranslateY'        : BP_CONST.TRANSFORMS[menuButton.id].translateY,
            'menuBtnScale'             : 1,   // Icon scales to 1
            'menuBtnRotate'            : 0    // Will be used by the icons that roll
          },
          false: {
            'outlineHeight'            : currentOutlineHeight,
            'svgHeight'                : parseFloat(mainSVG.style.height),
            'svgTranslateY'            : getTransform(mainSVG.getAttribute('transform')).translate.top,
            'bottomSVGTranslateY'      : getTransform(bottomSVG.getAttribute('transform')).translate.top,
            'moreBtnTranslateX'        : moreBtnTranslate.left,
            'moreBtnTranslateY'        : moreBtnTranslate.top,
            'menuBtnTranslateX'        : menuButtonTransform.translate.left,
            'menuBtnTranslateY'        : menuButtonTransform.translate.top,
            'menuBtnScale'             : menuButtonTransform.scale,
            'menuBtnRotate'            : 0  // Will be used by icons that roll
          }
        };

      return feature.module.extendCssValues(baseCssValues);
    }

    function animateSecondaryFeature(name, doEnable, isInstant) {
      var
        mainSVG = byId(BP_CONST.SVG_ID),
        outlineSVG = byId(BP_CONST.MAIN_OUTLINE_BORDER_ID),
        shadowSVG = byId(BP_CONST.SHADOW_ID),
        bottomSVG = byId(BP_CONST.BOTTOM_MORE_ID),
        moreButton = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),

        feature = features[name],
        featureModule = feature.module,
        featureTick = featureModule.tick,
        menuButton = byId(feature.menuButtonId),

        currentMenuBtnTransform = getTransform(menuButton.getAttribute('transform')),

        currentOutlineHeight = getCurrentOutlineHeight(),
        currentSVGHeight = parseFloat(mainSVG.style.height),
        currentSVGTranslateY = getTransform(mainSVG.style[helper.transformProperty]).translate.top,
        currentBottomSVGTranslateY = getTransform(bottomSVG.getAttribute('transform')).translate.top,
        currentMoreBtnTransform = getTransform(moreButton.getAttribute('transform')),
        currentMoreBtnTranslate = currentMoreBtnTransform.translate,
        currentMoreBtnTranslateX = currentMoreBtnTranslate.left,
        currentMoreBtnTranslateY = currentMoreBtnTranslate.top,
        currentMoreBtnScale = currentMoreBtnTransform.scale,
        currentMoreBtnRotate = currentMoreBtnTransform.rotate,
        currentMenuBtnTranslateX = currentMenuBtnTransform.translate.left,
        currentMenuBtnTranslateY = currentMenuBtnTransform.translate.top,
        currentMenuBtnScale = currentMenuBtnTransform.scale,
        currentMenuBtnRotate = currentMenuBtnTransform.rotate,

        cssValues = getCssValues(name, menuButton, moreButton, currentOutlineHeight),
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

        isSlowlyExpanding = !isInstant && heightTransition.to > heightTransition.from;

      function getDuration() {
        if (isInstant) {
          return 1;
        }

        // Use the progress of the more button to determine how far along we are in the animation,
        // and therefore how much time is left
        return animate.getDuration(doEnable ? ENABLE_ANIMATION_MS : DISABLE_ANIMATION_MS,
          fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY);
      }

      function getCurrentOutlineHeight() {
        return getNumberFromString(outlineSVG.getAttribute('d').split(' ').pop());
      }

      function panelHeightTick(animationState) {
        var t = animationState.current;
        mainSVG.style.height = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style[helper.transformProperty] = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';
        bottomSVG.setAttribute('transform', getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute('transform',
          getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t),
            getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));
        outlineSVG.setAttribute('d', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute('d', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0,6 -5,11 -11,11H11m797,-11v-' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
      }

      function contentsTick(animationState) {
        var t = animationState.current;
        menuButton.setAttribute('transform',
          getTransformString(getValueInTime(currentMenuBtnTranslateX, targetCSSValues.menuBtnTranslateX, t),
            getValueInTime(currentMenuBtnTranslateY, targetCSSValues.menuBtnTranslateY, t),
            getValueInTime(currentMenuBtnScale, targetCSSValues.menuBtnScale, t),
            getValueInTime(currentMenuBtnRotate, targetCSSValues.menuBtnRotate, t), BP_CONST.MENU_BUTTON_ROTATE_XY, BP_CONST.MENU_BUTTON_ROTATE_XY));

        featureTick && featureTick(t, targetCSSValues);
      }

      setCurrentFeature(doEnable && name, isSlowlyExpanding);

      featureModule.onAnimationStart && featureModule.onAnimationStart();

      featureAnimation = animate.create(
        heightTransition,
        {
          'duration': duration,
          'onTick': contentsTick
        });

      setTimeout(function() {
        if (isSlowlyExpanding) {
          setTimeout(function() {
            state.set('isSecondaryExpanding', false);
            state.set('isAnimating', false);
            sitecues.emit('bp/do-update');
          }, duration * 0.7);
        }

        heightAnimation = animate.create(
          heightTransition,
          {
            'duration': duration,
            'onTick': panelHeightTick
          });
        },
        feature.heightAnimationDelay || 0);

    }

    function toggleSecondaryFeature(name) {
      var willEnable = state.getSecondaryPanelName() !== name;
      animateSecondaryFeature(name, willEnable);

      // TODO we need to fire this when panel closed, right?
      sitecues.emit('did-toggle-' + name, willEnable);
    }

//    function switchCard(direction) {
//      if (activePanel && features[activePanel].hasArrows) {
//        featureModule.switchCard(direction);
//      }
//    }
//
//    function nextCard () {
//      switchCard(1);
//    }
//
//    function prevCard () {
//      switchCard(-1);
//    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initSecondaryPanel);

    sitecues.on('bp/do-toggle-secondary-panel', toggleSecondaryPanel);

    sitecues.on('bp/will-shrink', resetSecondaryPanel);

//    sitecues.on('bp/next-card', nextCard);
//    sitecues.on('bp/prev-card', prevCard);

    callback();
  });

});