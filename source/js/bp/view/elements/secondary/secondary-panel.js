// TODO
// Design polish
//Adjust -> Settings
//Magnify -> Lens
//Listen -> Speech
//Seth wants mockups of breadcrumb design
//Marc wants reset
//Perkins wants faster access to colors – 3 levels deep is too much
//Change to Open Sans?
//

// UX testing
// IE
// - feedback page issues
// -- no caret visible in IE9
// -- stars not activating via enter key in IE9
// -- Sliders ugly in IE10
// -- Performance bad in IE10 with nytimes.com
// Beta testing
// Applause testing
// / Localization
// Provisional patents  -- who can help? Jeff? Ai2?
// Accessibility
//
// Later
// About: Get it now
//

define(['bp/constants', 'bp/model/state', 'bp/helper', 'util/animate', 'util/transform',
    'bp/view/elements/tips',
    'bp/view/elements/settings',
    'bp/view/elements/feedback',
    'bp/view/elements/about',
    'locale/locale'],
    function (BP_CONST, state, helper, animate, transform, tipsModule, settingsModule, feedbackModule, aboutModule, locale) {

  var BUTTON_CLICK_ANIMATION_DURATION = 800,
    ENABLED_PANEL_TRANSLATE_Y = 0,
    DISABLED_PANEL_TRANSLATE_Y = -198,
    MORE_BUTTON_ROTATION_ENABLED = -180,
    runningAnimations = [],
    origPanelContentsRect,
    origOutlineHeight,
    isActive = false,
    isCssLoaded,

    // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
    byId = helper.byId,
    getElemTransform = transform.getElemTransform,
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
    sitecues.emit('bp/did-change');
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
    var options = {
        'duration': duration,
        'onTick': onTickFn
      };

    var newAnimation = animate.animateViaCallbacks(options);

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
      morePanelCurrentPos = getElemTransform(morePanel).translate.top,
      targetPanelPos = getTargetMorePanelTranslateY(),
      posDiff = targetPanelPos - morePanelCurrentPos,
      moreBtnStartRotation = willEnable ? 0 : MORE_BUTTON_ROTATION_ENABLED,
      moreBtnEndRotation = willEnable ? MORE_BUTTON_ROTATION_ENABLED : 0;

    function onButtonMenuDropTick(time) {
      transform.setTransform(morePanel, 0, morePanelCurrentPos + posDiff * time);
      var moreBtnRotation = getValueInTime(moreBtnStartRotation, moreBtnEndRotation, time);
      updateMoreButton(origOutlineHeight, moreBtnRotation);
    }

    cancelAllAnimations();

    createAnimation(BUTTON_CLICK_ANIMATION_DURATION, onButtonMenuDropTick);

  }

  // For each SVG pixel of size, how many screen pixels do we get?
  function getSVGExpansionRatio() {
    var heightInSvgPixels = getCurrentOutlineHeight(),
      heightInScreenPixels = byId(BP_CONST.MAIN_OUTLINE_ID).getBoundingClientRect().height;
    return heightInScreenPixels / heightInSvgPixels;
  }

  // Compute based on the size of the contents
  // Auto-resizing is better because the contents will always fit, even if we change them (and importantly after l10n)
  function getPanelContentsHeight(featureName) {
    var contentElements = document.querySelectorAll('.scp-if-' + featureName),
      feature = features[featureName],
      numContentElements = contentElements.length,
      maxHeight = origPanelContentsRect.height,
      normalTop = origPanelContentsRect.top,
      index = 0;

    function addRect(item) {
      var thisRect = item.getBoundingClientRect(),
        height = thisRect.bottom - normalTop;
      if (height > maxHeight) {
        maxHeight = height;
      }
    }

    if (!feature.contentsHeight) {
      for (; index < numContentElements; index++) {
        var elem = contentElements[index],
          children = elem.children || [],
          childIndex = children.length;
        addRect(elem);
        while (childIndex--) {
          addRect(children[childIndex]);
        }
      }

      feature.contentsHeight = maxHeight / getSVGExpansionRatio();
    }

    return feature.contentsHeight;
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
        sitecues.emit('bp/did-change');
      }, heightAnimationDelay + heightAnimationDuration * 0.7);
    }

    function animateHeight() {
      createAnimation(heightAnimationDuration, panelHeightTick);
    }

    function openFeatureAnimation() {
      createAnimation(openFeatureDuration, openFeatureAnimationTick);
    }

    cancelAllAnimations();

    updateGlobalState(doEnable && name, isExpanding);

    // Animate the menu button and anything else related to opening the feature
    openFeatureAnimation();

    // Animate the height at the right time
    setTimeout(animateHeight, heightAnimationDelay);

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

    SC_DEV && console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo'));

    sitecues.emit('bp/did-change');

    animateButtonMenuDrop(willEnable);

    toggleMouseListeners(willEnable);

    sitecues.on('bp/will-toggle-secondary-panel', toggleSecondaryPanel);
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
  function toggleSecondaryFeature(featureName) {
    var willEnable = state.getSecondaryPanelName() !== featureName;
    if (willEnable && !isFeatureAvailable(featureName)) {
      sitecues.emit('info/help'); // The feature was not loaded -- punt and go to help page
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

  function onPanelOpen() {
    function insertCss(name) {
      var cssLink = document.createElement('link'),
        cssUrl = sitecues.resolveSitecuesUrl('../css/' + name + '.css');
      cssLink.setAttribute('rel', 'stylesheet');
      cssLink.setAttribute('href', cssUrl);
      document.querySelector('head').appendChild(cssLink);
    }
    if (!isCssLoaded) {
      isCssLoaded = true;
      insertCss('secondary');
      var extendedFontCharsetName = locale.getExtendedFontCharsetName();
      if (extendedFontCharsetName) {
        insertCss(extendedFontCharsetName);
      }
    }
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

    cancelAllAnimations();
    updateGlobalState();

    toggleMouseListeners(false);
  }

  // Add mouse listeners once BP is ready
  sitecues.on('bp/did-complete', resetStyles);

  sitecues.on('bp/did-expand', onPanelOpen);

  sitecues.on('bp/will-shrink', onPanelClose);

  var publics = {
    toggleSecondaryPanel: toggleSecondaryPanel
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
