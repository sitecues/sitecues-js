// TODO
//1.) The 'Welcome' example box run really close to the bottom menu items. I have highlighted this in the attached screenshot.  Would it be possible to reduce the height of this box by about 20-30px to give more padding between the bottom of the box and the menu items?
//2.) The line and arrow below the breadcrumbs appears a little thick. That may be because of the screenshot or just because a thinner line is to hard to see. Can this be reduced in thickness, maybe by about 1px - or does it become to thin and lost?
// Design polish
//Marc wants reset
//Perkins wants faster access to colors – 3 levels deep is too much
//

define(['bp/constants',
    'bp/model/state',
    'bp/helper',
    'bp-expanded/view/svg-animate',
    'util/transform',
    'core/locale',
    'bp-secondary/insert-secondary-markup',
    'bp-secondary/tips',
    'bp-secondary/settings',
    'bp-secondary/feedback',
    'bp-secondary/about',
    'bp-secondary/cards'],
    function (BP_CONST, state, helper, animate, transform, locale, markup, tipsModule, settingsModule, feedbackModule, aboutModule, cardsModule) {

  var BUTTON_CLICK_ANIMATION_DURATION = 800,
    ENABLED_PANEL_TRANSLATE_Y = 0,
    DISABLED_PANEL_TRANSLATE_Y = -198,
    MORE_BUTTON_ROTATION_ENABLED = -180,
    runningAnimations = [],
    origPanelContentsRect,
    origOutlineHeight,
    isActive = false,
    isInitialized,
    fadeInTimer,
    animateHeightTimer,

    // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
    byId = helper.byId,
    getElemTransform = transform.getElemTransform,
    setElemTransform = transform.setElemTransform,
    setTransform = transform.setElemTransform,
    CONTENTS_HEIGHT = 780,

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
    fireBpChanged();
  }

  function fireBpChanged(isNewPanelReady) {
    sitecues.emit('bp/did-change', false, isNewPanelReady);
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

  function getOutlineSVG() {
    return byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
  }

  function updateMoreButton(outlineHeight, moreButtonRotate) {
    var MORE_BUTTON_Y_OFFSET = 10,
      moreButton = getMoreButton();

    setElemTransform(moreButton, BP_CONST.TRANSFORMS[BP_CONST.MORE_BUTTON_CONTAINER_ID].translateX,
          outlineHeight + MORE_BUTTON_Y_OFFSET, 1, moreButtonRotate);
  }

  function setPanelHeight(outlineHeight, moreButtonRotate) {
    var BOTTOM_Y_OFFSET = -188;

    // Outline
    setCurrentOutlineHeight(outlineHeight);

    // Bottom gray area
    setElemTransform(getBottom(), 0, outlineHeight + BOTTOM_Y_OFFSET);

    // More button
    updateMoreButton(outlineHeight, moreButtonRotate);
  }

  /********************** ANIMATIONS **************************/

    // When something major happens, such as an action to open a new panel, we cancel all current animations
  function finishAllAnimations() {
    runningAnimations.forEach(function (animation) {
      animation.finishNow();
    });
    clearTimeout(fadeInTimer);
    clearTimeout(animateHeightTimer);
    runningAnimations.length = 0;
  }

  // Create an animation and store it in runningAnimations so we can cancel it if need be
  function createAnimation(duration, onTickFn, onFinishFn) {
    var options = {
        duration: duration,
        onTick: onTickFn,
        onFinish: onFinishFn
      };

    var newAnimation = animate.animateViaCallbacks(options);

    runningAnimations.push(newAnimation);
  }

  function getValueInTime(from, to, time) {
    return from + (to - from) * time;
  }

  // Move up to make sure we fit onscreen when the secondary feature expands
  function getAmountToShiftSecondaryTop() {
    var
      secondaryContent = getSecondary(),
      secondaryRect = secondaryContent.getBoundingClientRect(),
      FUDGE_FACTOR = 100, // Extra space at bottom -- for more button and just space itself
      screenBottomOverlap = secondaryRect.bottom + FUDGE_FACTOR - window.innerHeight;

    // Don't shift above top of screen, and only shift up (or not at all)
    return Math.max(Math.min(screenBottomOverlap, secondaryRect.top), 0);
  }

  function getTargetSecondaryPanelTranslateY() {
    return state.isSecondaryPanelRequested() ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y;
  }

  function animateButtonMenuDrop(willEnable) {

    var secondaryId = BP_CONST.SECONDARY_ID,
      secondaryPanel = byId(secondaryId),
      secondaryPanelCurrentPos = getElemTransform(secondaryPanel).translate.top,
      targetPanelPos = getTargetSecondaryPanelTranslateY(),
      posDiff = targetPanelPos - secondaryPanelCurrentPos,
      moreBtnStartRotation = willEnable ? 0 : MORE_BUTTON_ROTATION_ENABLED,
      moreBtnEndRotation = willEnable ? MORE_BUTTON_ROTATION_ENABLED : 0;

    function onButtonMenuDropTick(time) {
      setTransform(secondaryPanel, 0, secondaryPanelCurrentPos + posDiff * time);
      var moreBtnRotation = getValueInTime(moreBtnStartRotation, moreBtnEndRotation, time);
      updateMoreButton(origOutlineHeight, moreBtnRotation);
    }

    function onFinish() {
      aboutModule.init();
      feedbackModule.init();
      settingsModule.init();
      tipsModule.init();
      cardsModule.init();

      state.set('isSecondaryPanel', willEnable);
      fireBpChanged(true);
      updateMoreButtonLabel(willEnable);
    }

    finishAllAnimations();

    createAnimation(BUTTON_CLICK_ANIMATION_DURATION, onButtonMenuDropTick, onFinish);

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
      bpContainer = getBPContainer(),

      currentBpContainerTransforms = transform.getStyleTransform(bpContainer),

      currentMenuBtnTransform = getElemTransform(menuButton),

      currentOutlineHeight = getCurrentOutlineHeight(),

      currentMenuBtnTranslateX = currentMenuBtnTransform.translate.left,
      currentMenuBtnRotate = currentMenuBtnTransform.rotate,

      geometryTargets = getGeometryTargets(name, menuButton),
      fromGeo = geometryTargets[!doEnable],
      toGeo = geometryTargets[doEnable],

      ENABLE_ANIMATION_MS = 1500,
      DISABLE_ANIMATION_MS = 500,

      isExpanding = toGeo.outlineHeight > currentOutlineHeight,

      percentRemaining = getPercentAnimationRemaining(),
      heightAnimationDuration = (doEnable ? ENABLE_ANIMATION_MS : DISABLE_ANIMATION_MS) * percentRemaining,
      heightAnimationDelay = (doEnable && isExpanding && feature.heightAnimationDelay) || 0,
      openFeatureDuration = doEnable && feature.heightAnimationDelay ? ENABLE_ANIMATION_MS : heightAnimationDuration;


    function getPercentAnimationRemaining () {
      // A multiplier used for determining where to position things when in the middle of an animation.
      return Math.abs(((toGeo.outlineHeight - currentOutlineHeight) / (toGeo.outlineHeight - fromGeo.outlineHeight)));
    }

    function panelHeightTick(time) {
      // SVG height and outline
      var newPanelHeight = getValueInTime(currentOutlineHeight, toGeo.outlineHeight, time),
        newTranslateY;
      setPanelHeight(newPanelHeight, MORE_BUTTON_ROTATION_ENABLED);
      if (toGeo.bpContainerTranslateY) {
        newTranslateY = currentBpContainerTransforms.translate.top - getValueInTime(0, toGeo.bpContainerTranslateY, time);
        transform.setStyleTransform(bpContainer, currentBpContainerTransforms.translate.left, newTranslateY, currentBpContainerTransforms.scale);
      }
    }

    function openFeatureAnimationTick(time) {
      // Menu button
      setElemTransform(menuButton, getValueInTime(currentMenuBtnTranslateX, toGeo.menuBtnTranslateX, time),
          0, 1, getValueInTime(currentMenuBtnRotate, toGeo.menuBtnRotate, time));

      // TODO: Probably remove the if check? Functions are always truthy.
      //       Not sure why this is here. Is this an API or isn't it?
      if (featureTick) {
        featureTick(time, toGeo);
      }
    }

    function fadeInTextContentWhenLargeEnough() {
      fadeInTimer = setTimeout(function () {
        state.set('isSecondaryExpanding', false);
        fireBpChanged(true);
      }, heightAnimationDelay + heightAnimationDuration * 0.7);
    }

    function animateHeight() {
      createAnimation(heightAnimationDuration, panelHeightTick);
    }

    function openFeatureAnimation() {
      createAnimation(openFeatureDuration, openFeatureAnimationTick);
    }

    finishAllAnimations();

    updateGlobalState(doEnable && name, isExpanding);

    // Animate the menu button and anything else related to opening the feature
    openFeatureAnimation();

    // Animate the height at the right time
    animateHeightTimer = setTimeout(animateHeight, heightAnimationDelay);

    fadeInTextContentWhenLargeEnough();

    sitecues.emit('bp/will-show-secondary-feature');
  }

  /********************** INTERACTIONS **************************/

  function onMenuButtonClick(e) {

    var featureName = e.currentTarget.getAttribute('data-feature');
    if (featureName) {
      toggleSecondaryFeature(featureName);
    }
  }

  function getFeaturePanelName() {
    var secondaryPanelName = state.getSecondaryPanelName();
    return features[secondaryPanelName] && secondaryPanelName;
  }

  function optimizeButtonAnimations() {
    forEachFeature(function(feature) {
      feature.menuButtonId.style.willChange = helper.transformProperty;
    });
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

    var ENABLED = BP_CONST.SECONDARY_PANEL_ENABLED,
      DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED,
      willEnable = state.get('secondaryPanelTransitionTo') !== ENABLED;

    state.set('secondaryPanelTransitionTo', willEnable ? ENABLED : DISABLED);
    updateGlobalState();

    if (SC_DEV) { console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo')); }

    animateButtonMenuDrop(willEnable);

    toggleMouseListeners(willEnable);

    if (willEnable) {
      optimizeButtonAnimations();
    }
  }

  function updateMoreButtonLabel(doPointToMainPanel) {
    setTimeout(function() {
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

  // Not really useful to call these toggle buttons
      // TODO probably remove
//  function setSelectedFeature(featureName, isEnabled) {
//    function setSelected(feature, isSelected) {
//      byId(feature.labelId).setAttribute('aria-pressed', !!isSelected);
//    }
//    // First clear selected state on all
//    forEachFeature(setSelected);
//
//    // Now set selected state if necessary
//    if (isEnabled) {
//      setSelected(features[featureName], true);
//    }
//  }

  /**
   * Toggle back and forth between button menu and a feature
   * @param featureName
   */
  function toggleSecondaryFeature(featureName) {
    var willEnable = state.getSecondaryPanelName() !== featureName;
    // TODO probably remove
//    setSelectedFeature(featureName, willEnable);
    updateMoreButtonLabel(!willEnable);
    if (willEnable && !isFeatureAvailable(featureName)) {
      // The feature was not loaded yet -- wait until loaded
      sitecues.on('bp/content-loaded', function() {
        toggleSecondaryFeature(featureName);
      });
    }
    else {
      sitecues.emit('bp/will-toggle-feature');
      animateSecondaryFeature(featureName, willEnable);
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

    var morePanelId = BP_CONST.SECONDARY_ID,
      more = byId(morePanelId);
    setElemTransform(more, 0, BP_CONST.TRANSFORMS[morePanelId].translateY);

    resetButtonStyles();

    // Clear selected state on feature button labels
    // TODO probably remove
//    setSelectedFeature();
  }

  function resetButtonStyles() {
    // Menu buttons
    forEachFeature(function(feature) {
      var button = feature.menuButtonId,
        transform = BP_CONST.TRANSFORMS[button];
      setElemTransform(byId(button), transform.translateX, 0);
    });
  }

  function onPanelClose () {

    if (state.isSecondaryPanelRequested()) {
      // Toggle current panel off
      sitecues.emit('bp/did-toggle-' + state.getSecondaryPanelName(), false);
    }

    var DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED;

    resetStyles();

    if (origOutlineHeight) {
      setPanelHeight(origOutlineHeight, 0);
    }

    state.set('secondaryPanelTransitionTo', DISABLED);

    finishAllAnimations();
    updateGlobalState();

    toggleMouseListeners(false);
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;

      // Insert the markup for the secondary panel
      markup.init();
      // Add mouse listeners once BP is ready
      resetStyles();

      sitecues.on('bp/will-shrink', onPanelClose);

      sitecues.emit('bp/did-init-secondary');
    }
  }

  return {
    init: init,
    toggleSecondaryPanel: toggleSecondaryPanel,
    toggleSecondaryFeature: toggleSecondaryFeature
  };

});