/**
 * Secondary panel including animations
 */
define(
  [
    'core/bp/constants',
    'core/bp/model/state',
    'core/bp/view/view',
    'core/bp/helper',
    'bp-expanded/view/transform-animate',
    'bp-expanded/view/transform-util',
    'core/locale',
    'core/platform',
    'bp-secondary/insert-secondary-markup',
    'bp-secondary/bp-secondary-features',
    'core/events',
    'mini-core/native-global',
    'core/inline-style/inline-style'
  ],
  function (
    BP_CONST,
    state,
    view,
    helper,
    animate,
    transformUtil,
    locale,
    platform,
    markup,
    secondaryFeatures,
    events,
    nativeGlobal,
    inlineStyle
  ) {
  'use strict';

  var BUTTON_DROP_ANIMATION_MS = 800,
    ENABLED_PANEL_TRANSLATE_Y = 0,
    DISABLED_PANEL_TRANSLATE_Y = -198,
    MORE_BUTTON_ROTATION_ENABLED = -180,
    runningAnimations = [],
    origPanelContentsRect,
    origOutlineHeight,
    origFillHeight,
    isActive = false,
    isInitialized,
    hasOpened,
    fadeInTimer,
    animateHeightTimer,
    animationsCompleteTimer,
    features = secondaryFeatures.featureDefs,

    // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
    byId = helper.byId,
    CONTENTS_HEIGHT = 780;

  /********************** UTIL **************************/

  // TODO code related to the individual features should move into bp-secondary-features.js
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
    view.update();
  }

  function getBPContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  function getSecondary() {
    return byId(BP_CONST.SECONDARY_ID);
  }

  function getMoreButton() {
    return byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
  }

  function getBottom() {
    return byId(BP_CONST.BOTTOM_MORE_ID);
  }

  function getShadow() {
    return byId('scp-shadow');
  }

  function getOutlineFill() {
    return byId('scp-secondary-fill');
  }

  function getSecondaryOutline() {
    return byId('scp-secondary-outline');
  }

  /********************** ANIMATIONS **************************/

  // When something major happens, such as an action to open a new panel, we cancel all current animations
  function finishAllAnimations() {
    runningAnimations.forEach(function (animation) {
      animation.finishNow();
    });
    clearTimeout(fadeInTimer);
    clearTimeout(animateHeightTimer);
    clearTimeout(animationsCompleteTimer);
    runningAnimations.length = 0;
  }

  // Create an animation and store it in runningAnimations so we can cancel it if need be
  function createAnimation(elems, values, duration, onFinishFn) {
    nativeGlobal.setTimeout(function() {
      var newAnimation = animate.animateTransforms(elems, values, duration, onFinishFn);
      runningAnimations.push(newAnimation);
  }, 18); // Wait one frame, for Firefox

}

  // Move up to make sure we fit onscreen when the secondary feature expands
  function getAmountToShiftSecondaryTop() {
    var
      panelTop = byId(BP_CONST.MAIN_OUTLINE_ID).getBoundingClientRect().top,
      secondaryBottom = panelTop + CONTENTS_HEIGHT,
      FUDGE_FACTOR = 190, // Extra space at bottom -- for more button and just space itself
      MIN_TOP = 10,
      screenBottomOverlap = secondaryBottom - FUDGE_FACTOR - window.innerHeight;

    // Don't shift above top of screen, and only shift up (or not at all)
    return Math.max(Math.min(screenBottomOverlap, panelTop - MIN_TOP), 0);
  }

  function animateButtonMenuDrop(willEnable) {

    var secondaryId = BP_CONST.SECONDARY_ID,
      secondaryPanel = byId(secondaryId),
      fromTranslateY = willEnable? DISABLED_PANEL_TRANSLATE_Y : ENABLED_PANEL_TRANSLATE_Y,
      toTranslateY = willEnable? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y,
      moreBtnEndRotation = willEnable ? MORE_BUTTON_ROTATION_ENABLED : 0,
      moreButtonTransform = {
        translateY: willEnable ? toTranslateY : 0,
        rotate: moreBtnEndRotation
      },
      secondaryPanelTransform = {
        translateY: toTranslateY
      };


    function onFinish() {
      secondaryFeatures.init();
      state.set('isSecondaryPanel', willEnable);
      view.update(true);
      updateMoreButtonLabel(willEnable);
    }

    finishAllAnimations();

    transformUtil.setElemTransform(secondaryPanel, { translateY : fromTranslateY}); // Starting point

    createAnimation(
      [secondaryPanel, getMoreButton()],
      [secondaryPanelTransform, moreButtonTransform],
      BUTTON_DROP_ANIMATION_MS, onFinish);
  }

  function getGeometryTargets(featureName, menuButton) {
    var
      feature = features[featureName],
      origMenuBtnTransforms = BP_CONST.TRANSFORMS[menuButton.id],
      panelContentsHeight = CONTENTS_HEIGHT,
      baseGeometryTargets = {
        false: {  // Feature disabled
          outlineHeight: origOutlineHeight,
          menuBtnTranslateX: origMenuBtnTransforms.translateX,
          menuBtnRotate: 0,  // Will be used by icons that roll
          bpContainerTranslateY: 0
        },
        true: {   // Feature enabled
          outlineHeight: panelContentsHeight + 103, // The outline
          menuBtnTranslateX: 26, // The icon rolls left by default
          menuBtnRotate: 0,    // Will be used by the icons that roll
          bpContainerTranslateY: getAmountToShiftSecondaryTop()
        }
      };

    return feature.module.getGeometryTargets(baseGeometryTargets);
  }

  function getCurrentOutlineHeight() {
    function getOutlineSVG() {
      return byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
    }
    var outlinePath = getOutlineSVG().getAttribute('d');
    return parseInt(outlinePath.split(' ')[2]);
  }

  function animateFeature(name, doEnable) {
    var
      feature = features[name],
      animatedImageElem = byId(feature.animatedImageId),
      rotationHelperElem = byId(feature.menuButtonHelperId),
      menuButton = byId(feature.menuButtonId),
      bpContainer = getBPContainer(),

      currentBpContainerTransforms = transformUtil.getStyleTransformMap(bpContainer),

      geometryTargets = getGeometryTargets(name, menuButton),
      toGeo = geometryTargets[doEnable],

      ENABLE_ANIMATION_MS = 1500,
      DISABLE_ANIMATION_MS = 750,

      wasEnabled = !!getFeaturePanelName(),
      percentRemaining = (wasEnabled === doEnable) ? 0 : 1,
      heightAnimationDuration = (doEnable ? ENABLE_ANIMATION_MS : DISABLE_ANIMATION_MS) * percentRemaining,
      heightAnimationDelay = (doEnable  && feature.heightAnimationDelay) || 0,
      openFeatureDuration = doEnable && feature.heightAnimationDelay ? ENABLE_ANIMATION_MS : heightAnimationDuration,
      animationsCompleteMs = Math.max(openFeatureDuration, heightAnimationDelay + heightAnimationDuration);  // When is feature fully visible

    function fadeInTextContentWhenLargeEnough() {
      fadeInTimer = nativeGlobal.setTimeout(function () {
        state.set('isSecondaryExpanding', false);
        view.update();
      }, heightAnimationDelay + heightAnimationDuration * 0.7);
    }

    function onAnimationsComplete() {
      state.set('isSecondaryExpanded', doEnable);
      view.update(true);
    }

    function animateHeight() {
      var newPanelHeight = toGeo.outlineHeight,
        newTranslateY = currentBpContainerTransforms.translateY - toGeo.bpContainerTranslateY,
        bottomTranslateY = newPanelHeight - origOutlineHeight,
        BOTTOM_Y_OFFSET = -188,
        moreButtonTransform = {
          translateY: newPanelHeight + BOTTOM_Y_OFFSET
        },
        bottomTransform = {
          translateY: newPanelHeight + BOTTOM_Y_OFFSET
        },
        outlineFillTransform = {
          scale: (newPanelHeight / origFillHeight),
          scaleType: 'scaleY'
        },
        secondaryOutlineTransform = {
          translateY: bottomTranslateY
        },
        shadowTransform = {
          translateY: doEnable ? 435 : 0// bottomTranslateY

        },
        bpContainerTransform = {
          translateY: newTranslateY

        };
      createAnimation(
        [getMoreButton(), getBottom(), getOutlineFill(), getSecondaryOutline(), getShadow(), bpContainer],
        [moreButtonTransform, bottomTransform, outlineFillTransform, secondaryOutlineTransform, shadowTransform, bpContainerTransform ],
        heightAnimationDuration
      );
    }

    function openFeatureAnimation() {
      var
        // Rotations (for the about button) need to be done half and half, otherwise the rotation does not happen
        // Basically, the browser optimizes a -360deg rotation as 0!
        // So we do -180 on the parent and -180 on the child
        // Don't need to use in IE where CSS transitions aren't used with SVG
        toRotation = toGeo.menuBtnRotate / 2,
        menuButtonTransform = {
          translateX: toGeo.menuBtnTranslateX,
          rotate: toRotation
        },
        rotationHelperTransform = {
          rotate: toRotation
        },
        animatedImageTransform = {
          translateX: toGeo.menuImageTranslateX
        };
      createAnimation(
        [menuButton, rotationHelperElem, animatedImageElem],
        [menuButtonTransform, rotationHelperTransform, animatedImageTransform],
        openFeatureDuration);
    }

    finishAllAnimations();

    if (doEnable && getFeaturePanelName()) {
      // If we are switching from one panel to another, make sure buttons start from initial state
      resetButtonStyles();
    }

    updateGlobalState(doEnable && name, doEnable);

    // Animate the menu button and anything else related to opening the feature
    openFeatureAnimation();

    // Animate the height at the right time
    animateHeightTimer = nativeGlobal.setTimeout(animateHeight, heightAnimationDelay);

    animationsCompleteTimer = nativeGlobal.setTimeout(onAnimationsComplete, animationsCompleteMs);

    fadeInTextContentWhenLargeEnough();

    events.emit('bp/will-show-secondary-feature', name);
  }

  /********************** INTERACTIONS **************************/

  function onMenuButtonClick(e) {

    var featureName = e.currentTarget.getAttribute('data-feature');
    if (featureName) {
      toggleFeature(featureName);
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
      toggleFeature(featurePanelName);
      return;
    }

    var ENABLED = BP_CONST.SECONDARY_PANEL_ENABLED,
      DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED,
      willEnable = state.get('secondaryPanelTransitionTo') !== ENABLED;

    state.set('secondaryPanelTransitionTo', willEnable ? ENABLED : DISABLED);
    updateGlobalState();

    if (SC_DEV) { console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo')); }

    //Text anchors don't work in Edge, and furthermore the secondary panel isn't rendered in Edge until it is enabled
    //So this is where we have access to the length of the string and can reposition the text elements correctly
    if (!hasOpened) {
      hasOpened = true;
      if (platform.browser.isEdge) {
        helper.fixTextAnchors(byId(BP_CONST.SECONDARY_ID));
      }
    }

    animateButtonMenuDrop(willEnable);

    toggleMouseListeners(willEnable);
  }

  function updateMoreButtonLabel(doPointToMainPanel) {
    nativeGlobal.setTimeout(function() {
      var labelName = doPointToMainPanel ? 'sitecues_main_panel' : 'more_features',
        localizedLabel = locale.translate(labelName);
      byId(BP_CONST.MORE_BUTTON_GROUP_ID).setAttribute('aria-label', localizedLabel);
    }, 500); // Defer until after focus changes
  }

  /**
   * Return truthy value if feature is loaded and available
   * @param featureName
   * @returns {*|HTMLElement}
   */
  function isFeatureAvailable(featureName) {
    return byId(features[featureName].panelId);
  }

  /**
   * Toggle back and forth between button menu and a feature
   * @param featureName
   */
  function toggleFeature(featureName) {
    var willEnable = state.getSecondaryPanelName() !== featureName;
    updateMoreButtonLabel(!willEnable);
    if (willEnable && !isFeatureAvailable(featureName)) {
      // The feature was not loaded yet -- wait until loaded
      events.on('bp/content-loaded', function() {
        if (state.isButtonMenu()) {  // Make sure user hasn't left the 4 button menu while we waited
          toggleFeature(featureName);
        }
      });
    }
    else {
      events.emit('bp/will-toggle-feature');
      animateFeature(featureName, willEnable);
    }
  }

  function toggleMouseListeners (willBeActive) {
    if (isActive === willBeActive) {
      return;  // Nothing to do
    }

    isActive = willBeActive;

    var addOrRemoveFn = isActive ? 'addEventListener' : 'removeEventListener';

    function addOrRemoveClick(id) {
      var elem = byId(id);
      elem[addOrRemoveFn]('click', onMenuButtonClick);
    }

    forEachFeature(function(feature) {
      addOrRemoveClick(feature.menuButtonId);
      addOrRemoveClick(feature.labelId);
    });

  }

  /********************** INIT / RESET **************************/

  function resetStyles() {
    var moreButton = getMoreButton(),
      HEIGHT_RELATED_ELEMS = [ getSecondary(), moreButton, getBottom(), getOutlineFill(), getSecondaryOutline(), getShadow()];

    HEIGHT_RELATED_ELEMS.forEach(function(elem) {
      transformUtil.setElemTransform(elem, {});
      if (!platform.browser.isFirefox) {
        // Do not use will-change in Firefox as it caused SC-3421 on some sites
        inlineStyle(elem).willChange = 'transform';
      }
    });

    resetWebKitLayout(moreButton);

    resetButtonStyles();
  }

  function resetWebKitLayout(elem) {
    // Hack to fix Chrome/Safari bug where the more button was in the wrong place after resetting styles
    // This forces WebKit to reflow the element's layout.
    var
      style   = inlineStyle(elem),
      display = style.display;
    style.display = 'none';
    // jshint unused:false
    var unused = getBPContainer().offsetHeight; // Force layout refresh
    style.display = display;
  }

  function resetButtonStyles() {
    // Menu buttons
    forEachFeature(function(feature) {
      var button = feature.menuButtonId,
        transform = BP_CONST.TRANSFORMS[button],
        buttonElem = byId(button);
      transformUtil.setElemTransform(buttonElem, transform);
      if (feature.menuButtonHelperId) {
        transformUtil.setElemTransform(byId(feature.menuButtonHelperId), {});
      }
      if (feature.animatedImageId) {
        transformUtil.setElemTransform(byId(feature.animatedImageId), {});
      }
      resetWebKitLayout(buttonElem);
    });
  }

  function onPanelClose() {

    if (state.isSecondaryPanelRequested()) {
      // Toggle current panel off
      events.emit('bp/did-toggle-' + state.getSecondaryPanelName(), false);
    }

    finishAllAnimations();
    resetStyles();

    // Next time panel opens, it will be at the main panel;
    // Therefore, the more button label for screen readers needs to indicate the secondary panel will open
    updateMoreButtonLabel();

    state.set('secondaryPanelTransitionTo', BP_CONST.SECONDARY_PANEL_DISABLED);

    updateGlobalState();

    toggleMouseListeners(false);
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;

      // Insert the markup for the secondary panel
      markup.init();
      resetButtonStyles();

      origOutlineHeight = getCurrentOutlineHeight();
      origFillHeight = parseFloat(getOutlineFill().getAttribute('height'));
      origPanelContentsRect = document.getElementById(BP_CONST.MAIN_CONTENT_FILL_ID).getBoundingClientRect();

      events.on('bp/will-shrink', onPanelClose);

      events.emit('bp/did-init-secondary');
    }
  }

  return {
    init: init,
    toggleSecondaryPanel: toggleSecondaryPanel,
    toggleFeature: toggleFeature
  };

});
