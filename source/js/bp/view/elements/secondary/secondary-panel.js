sitecues.def('bp/view/elements/secondary-panel', function (secondaryPanel, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform',
    'bp/view/elements/tips',
    'bp/view/elements/settings',
    'bp/view/elements/feedback',
    'bp/view/elements/about',
    function (BP_CONST, state, helper, animate, transform, tipsModule, settingsModule, feedbackModule, aboutModule) {

    var animationIds = {},
        BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        BUTTON_LEAVE_ANIMATION_DURATION = 400,
        BUTTON_CLICK_ANIMATION_DURATION = 800,
        ENABLED_PANEL_TRANSLATE_Y       = 0,
        DISABLED_PANEL_TRANSLATE_Y      = -198,
        activePanel,
        currentAnimation,
        mainPanelContentsRect,

        // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
        byId = helper.byId,
        getTransform = transform.getTransform,
        getTransformString = transform.getTransformString,

        features = {
          tips : {
            module: tipsModule,
            menuButtonId: BP_CONST.TIPS_BUTTON_ID,
            hasArrows: true,
            panelId: BP_CONST.TIPS_CONTENT_ID
          },
          settings : {
            module: settingsModule,
            menuButtonId: BP_CONST.SETTINGS_BUTTON_ID,
            hasArrows: true,
            panelId: BP_CONST.SETTINGS_CONTENT_ID
          },
          feedback : {
            module: feedbackModule,
            menuButtonId: BP_CONST.FEEDBACK_BUTTON_ID,
            panelId: BP_CONST.FEEDBACK_CONTENT_ID
          },
          about : {
            module: aboutModule,
            menuButtonId: BP_CONST.ABOUT_BUTTON_ID,
            panelId: BP_CONST.ABOUT_CONTENT_ID
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

    function onMouseEnter (e) {

      var id                  = e.target.id,
          button              = byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          targetScale         = BP_CONST.TRANSFORMS[id].scale,
          currentTransform    = getTransform(button.getAttribute('transform')),
          currentScale        = currentTransform.scale,
          translate           = currentTransform.translate,
          x                   = translate.left,
          y                   = translate.top,
          rotate              = currentTransform.rotate,
          rotateX             = currentTransform.rotateX,
          rotateY             = currentTransform.rotateY,
          width               = buttonBoundingRect.width,
          height              = buttonBoundingRect.height,
          // http://stackoverflow.com/questions/6711610/how-to-set-transform-origin-in-svg
          translateX          = (x + (width  - width  * targetScale / currentScale) / 2),
          translateY          = (y + (height - height * targetScale / currentScale) / 2);

      cancelAnimation(id);

      animationIds[id] = animate.create(button, {
        'transform'   : getTransformString(translateX, translateY, targetScale, rotate, rotateX, rotateY)
      }, {
        'duration'    : BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });
    }

    function onMouseLeave (e) {

      var id                  = e.target.id,
          button              = byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          targetScale         = 1,
          currentTransform    = getTransform(button.getAttribute('transform')),
          currentScale        = currentTransform.scale,
          translate           = currentTransform.translate,
          x                   = translate.left,
          y                   = translate.top,
          rotate              = currentTransform.rotate,
          rotateX             = currentTransform.rotateX,
          rotateY             = currentTransform.rotateY,
          width               = buttonBoundingRect.width,
          height              = buttonBoundingRect.height,
          // http://stackoverflow.com/questions/6711610/how-to-set-transform-origin-in-svg
          translateX          = (x + (width  - width  * (targetScale / currentScale)) / 2),
          translateY          = (y + (height - height * (targetScale / currentScale)) / 2);

      cancelAnimation(id);

      animationIds[id] = animate.create(button, {
        'transform'   : getTransformString(translateX, translateY, targetScale, rotate, rotateX, rotateY)
      }, {
        'duration'    : BUTTON_LEAVE_ANIMATION_DURATION,
        'useAttribute': true
      });

    }

    function onMouseClick (e) {

      var element = e.target,
          dataFeature;

      while(element.parentNode) {

        dataFeature = element.getAttribute('data-feature');
        if (dataFeature) {
          break;
        }
        element = element.parentNode;
      }

      setCurrentFeature();

      if (features[dataFeature]) {
        toggleSecondaryFeature(dataFeature);
      }

    }

    function toggleSecondaryPanel () {

      var ENABLED  = BP_CONST.SECONDARY_PANEL_ENABLED,
          DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED;

      var wasEnabled = state.get('secondaryPanelTransitionTo') === ENABLED;
      state.set('secondaryPanelTransitionTo', wasEnabled ? DISABLED : ENABLED);

      SC_DEV && console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo'));

      animateSecondaryPanel();

      sitecues.emit('bp/do-update');

    }

    function animateSecondaryPanel () {

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

    // TODO reduce
    function initStyles () {

      var moreId     = BP_CONST.MORE_ID,
          tipsId     = BP_CONST.TIPS_BUTTON_ID,
          settingsId = BP_CONST.SETTINGS_BUTTON_ID,
          feedbackId = BP_CONST.FEEDBACK_BUTTON_ID,
          aboutId    = BP_CONST.ABOUT_BUTTON_ID;

      byId(moreId).setAttribute('opacity', 0);
      byId(moreId).setAttribute(    'transform', 'translate(0, ' + BP_CONST.TRANSFORMS[moreId].translateY + ')');
      byId(tipsId).setAttribute(    'transform', 'translate('    + BP_CONST.TRANSFORMS[tipsId].translateX      + ', ' + BP_CONST.TRANSFORMS[tipsId].translateY     + ')');
      byId(settingsId).setAttribute('transform', 'translate('    + BP_CONST.TRANSFORMS[settingsId].translateX  + ', ' + BP_CONST.TRANSFORMS[settingsId].translateY + ')');
      byId(feedbackId).setAttribute('transform', 'translate('    + BP_CONST.TRANSFORMS[feedbackId].translateX  + ', ' + BP_CONST.TRANSFORMS[feedbackId].translateY + ')');
      byId(aboutId).setAttribute(   'transform', 'translate('    + BP_CONST.TRANSFORMS[aboutId].translateX     + ', ' + BP_CONST.TRANSFORMS[aboutId].translateY    + ')');

    }

    function initSecondaryPanel () {
      addMouseListeners();
      initStyles();
      mainPanelContentsRect = document.getElementById(BP_CONST.MAIN_CONTENT_FILL_ID).getBoundingClientRect();
    }

    function resetSecondaryPanel () {

      var disabled = BP_CONST.SECONDARY_PANEL_DISABLED;

      cancelAllAnimations();

      initStyles();

      state.set('currentSecondaryPanelMode',  disabled);
      state.set('secondaryPanelTransitionTo', disabled);

    }

    function addMouseListeners () {

      var tipsButton     = byId(BP_CONST.TIPS_BUTTON_ID),
          settingsButton = byId(BP_CONST.SETTINGS_BUTTON_ID),
          feedbackButton = byId(BP_CONST.FEEDBACK_BUTTON_ID),
          aboutButton    = byId(BP_CONST.ABOUT_BUTTON_ID),
          tipsLabel      = byId(BP_CONST.TIPS_LABEL_ID),
          settingsLabel  = byId(BP_CONST.SETTINGS_LABEL_ID),
          feedbackLabel  = byId(BP_CONST.FEEDBACK_LABEL_ID),
          aboutLabel     = byId(BP_CONST.ABOUT_LABEL_ID);

      tipsButton.addEventListener('mouseenter', onMouseEnter);
      tipsButton.addEventListener('mouseleave', onMouseLeave);
      tipsButton.addEventListener('click',      onMouseClick);
      tipsLabel.addEventListener( 'click',      onMouseClick);

      settingsButton.addEventListener('mouseenter', onMouseEnter);
      settingsButton.addEventListener('mouseleave', onMouseLeave);
      settingsButton.addEventListener('click',      onMouseClick);
      settingsLabel.addEventListener( 'click',      onMouseClick);

      feedbackButton.addEventListener('mouseenter', onMouseEnter);
      feedbackButton.addEventListener('mouseleave', onMouseLeave);
      feedbackButton.addEventListener('click',      onMouseClick);
      feedbackLabel.addEventListener( 'click',      onMouseClick);

      aboutButton.addEventListener('mouseenter', onMouseEnter);
      aboutButton.addEventListener('mouseleave', onMouseLeave);
      aboutButton.addEventListener('click',      onMouseClick);
      aboutLabel.addEventListener( 'click',      onMouseClick);

    }

    function toggleButton (btn, doEnable) {
      var addOrRemoveFn = doEnable ? btn.addEventListener : btn.removeEventListener;
      addOrRemoveFn('mouseenter', onMouseEnter);
      addOrRemoveFn('mouseleave', onMouseLeave);
      addOrRemoveFn('click', onMouseClick);

      cancelAllAnimations();
    }

    function forEachFeature(fn) {
      for (var feature in features) {
        if (features.hasOwnProperty(feature)) {
          fn(features[feature]);
        }
      }
    }
    function resetMenuButtonTransforms() {
      forEachFeature(function(feature) {
        var button = feature.menuButtonId,
          transform = BP_CONST.TRANSFORMS[button];
        byId(button).setAttribute('transform', getTransformString(transform.translateX, transform.translateY));
      });
    }

    /**
     *
     * @param name or null for button menu
     */
    function setCurrentFeature(name, isSecondaryExpanding) {
      currentAnimation && currentAnimation.cancel();
      state.set('secondaryPanelName', name || 'buttonmenu');
      state.set('isSecondaryExpanding', isSecondaryExpanding);
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
            'outlineHeight'           : panelContentsHeight + 93, // The outline
            'svgHeight'               : panelContentsHeight + 163, // The main SVG, allows more space
            'moreBtnTranslateX'       : 400, // The more button
            'moreBtnTranslateY'       : panelContentsHeight + 104, // The more button
            'menuBtnTranslateX'        : 26, // The about icon, which rolls to the left
            'menuBtnTranslateY'        : BP_CONST.TRANSFORMS[menuButton.id].translateY, // The about icon rotates
            'menuBtnScale'             : 1,   // About icon scales to 1
            'menuBtnRotate'            : 0,   // Roll the about icon
            'menuBtnRotateX'           : 0,   // A way to rotate around an origin
            'menuBtnRotateY'           : 0    // A way to rotate around an origin
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
            'menuBtnRotate'            : 0,  // Roll the about icon
            'menuBtnRotateX'           : 54, // A way to rotate around an origin
            'menuBtnRotateY'           : 54  // A way to rotate around an origin
          }
        };

      console.log(panelContentsHeight);

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

        targetMoreBtnRotate = state.isShrinking() ? 0 : currentMoreBtnRotate,
        targetSVGTranslateY = doEnable ? currentSVGTranslateY - (targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[false].svgTranslateY,

        ENABLE_ANIMATION_MS = 1500,
        DISABLE_ANIMATION_MS = 500,

        duration = getDuration(),

        heightTransition = {
          'from': currentSVGHeight,
          'to': targetCSSValues.svgHeight
        },

        isExpanding = heightTransition.to > heightTransition.from;

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

      function panelSizeTick(t, moreButtonRotate) {
        mainSVG.style.height = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style[helper.transformProperty] = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';
        bottomSVG.setAttribute('transform', getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute('transform',
          getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t),
            getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, moreButtonRotate));
        outlineSVG.setAttribute('d', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute('d', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0,6 -5,11 -11,11H11m797,-11v-' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
      }

      function contentsTick(t, moreButtonRotate) {
        menuButton.setAttribute('transform',
          getTransformString(getValueInTime(currentMenuBtnTranslateX, targetCSSValues.menuBtnTranslateX, t),
            getValueInTime(currentMenuBtnTranslateY, targetCSSValues.menuBtnTranslateY, t),
            getValueInTime(currentMenuBtnScale, targetCSSValues.menuBtnScale, t),
            getValueInTime(currentMenuBtnRotate, targetCSSValues.menuBtnRotate, t), targetCSSValues.menuBtnRotateX, targetCSSValues.menuBtnRotateY));


        //aboutContentImage.setAttribute('transform', getTransformString(getValueInTime(currentAboutImageTranslateX, targetCSSValues.aboutImageTranslateX, t), 0));

        //aboutButton.setAttribute('transform', getTransformString(getValueInTime(currentAboutBtnTranslateX, targetCSSValues.aboutBtnTranslateX, t), getValueInTime(currentAboutBtnTranslateY, targetCSSValues.aboutBtnTranslateY, t), getValueInTime(currentAboutBtnScale, targetCSSValues.aboutBtnScale, t), getValueInTime(currentAboutBtnRotate, targetCSSValues.aboutBtnRotate, t), targetCSSValues.aboutBtnRotateX, targetCSSValues.aboutBtnRotateY));

        panelSizeTick(t, moreButtonRotate);
      }

      function onDisabledTick(animationState) {

        contentsTick(animationState.current, targetMoreBtnRotate);
      }

      function onEnableTick(animationState) {

        contentsTick(animationState.current, currentMoreBtnRotate);
      }

      setCurrentFeature(doEnable && name, isExpanding);

      currentAnimation = animate.create(heightTransition,
        {
          'duration': duration,
          'onTick': doEnable ? onEnableTick : onDisabledTick(),
          'onFinish': function () {
            // Finished expanding now
            if (isExpanding) {
              state.set('isSecondaryExpanding', false);
              sitecues.emit('bp/do-update');
            }
          }
        });
    }

    function toggleSecondaryFeature(name) {
      var willEnable = activePanel !== name;
      animateSecondaryFeature(name, willEnable);

      // TODO we need to fire this when panel closed, right?
      sitecues.emit('did-toggle-' + name, willEnable);
    }


    // TODO not sure about this
    // From anardi:
    //      i just was taking advantage of code i already wrote that did what i needed
    //      probably a smarter way to do what i want, im sure, but i thought it was cool i guess
    //      because the disabling animation should make everything like it was the first time someone was at the secondary panel, if that makes sense
    //      but, if you are in the settings panel for example, and you click the about label, i don't bother "disabling" the settings panel, cuz then it would collapse and then expand again
    function resetSecondaryFeature() {
      if (activePanel) {
        animateSecondaryFeature(activePanel, true, true);
      }
      setCurrentFeature();
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

    sitecues.on('bp/do-toggle-button', toggleButton);

    sitecues.on('bp/will-shrink bp/do-toggle-secondary-panel', resetSecondaryFeature);

//    sitecues.on('bp/next-card', nextCard);
//    sitecues.on('bp/prev-card', prevCard);

    callback();
  });

});