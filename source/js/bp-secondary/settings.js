define(
  [
    'core/bp/constants',
    'core/bp/helper',
    'core/conf/user/manager',
    'core/bp/model/state',
    'core/metric',
    'core/platform',
    'page/cursor/cursor',
    'core/events',
    'core/dom-events',
    'core/native-functions',
    'core/inline-style/inline-style'
  ],
  function (
    BP_CONST,
    helper,
    conf,
    state,
    metric,
    platform,
    cursor,
    events,
    domEvents,
    nativeFn,
    inlineStyle
  ) {
  'use strict';

  var byId = helper.byId,
    isActive = false,
    isInitialized,
    settingsPanel,
    lastDragUpdateTime = 0,
    SLIDER_DRAG_UPDATE_MIN_INTERVAL= 50,
    rangeValueMap = {};

  function onPanelUpdate() {

    var willBeActive = state.getSecondaryPanelName() === 'settings' && state.get('isSecondaryExpanded'),
      settingsCards = byId(BP_CONST.SETTINGS_CONTENT_ID);

    if (isActive !== willBeActive) {
      if (willBeActive) {
        mouseSlidersInit();  // Always use current mouse size as starting point

        if (!settingsPanel) {
          initContents();
        }

        settingsCards.addEventListener('click', onSettingsClick);
        settingsCards.addEventListener('change', onSettingsNativeInputChange);
        settingsCards.addEventListener('input', onSettingsNativeInputChangeDrag);
      }
      else {
        settingsCards.removeEventListener('click', onSettingsClick);
        settingsCards.removeEventListener('change', onSettingsNativeInputChange);
        settingsCards.removeEventListener('input', onSettingsNativeInputChangeDrag);
      }
    }

    isActive = willBeActive;
  }

  function initContents() {

    settingsPanel = byId(BP_CONST.SETTINGS_CONTENT_ID);

    if (platform.featureSupport.themes) {
      // MSIE/Edge -- no support yet
      // TODO support themes in IE -- need to break up theme CSS into chunks for pages like atkratter.com,
      // otherwise it locks up the page -- 537k of styles is a lot for IE to handle
      require(['theme/theme'], function(theme) {
        theme.init(true); // Preload theme code
      });
    }

    initButtons();

    initRanges();

    themeSlidersInit();
  }

  // Set up setting synchronization
  function initButtons() {
    var allSettingNames = {},
      allSettingElems = settingsPanel.querySelectorAll('[data-setting-name]'),
      index = allSettingElems.length,
      name;

    // For each setting name, get a list of elements
    while (index --) {
      name = allSettingElems[index].getAttribute('data-setting-name');
      allSettingNames[name] = 1;
    }

    Object.keys(allSettingNames).forEach(function(name) {
      conf.get(name, function(newValue) {
        newValue = newValue || 'none';  // Will now be 'none', 'warm', 'bold' or 'dark'
        var settingElems = settingsPanel.querySelectorAll('sc-button[data-setting-name="' + name + '"]'),
          index = settingElems.length,
          elem,
          currentButtonValue,
          isCurrentValue;
        while (index -- ) {
          elem = settingElems[index];
          // This button is used for what theme? 'none', 'warm', 'bold' or 'dark'
          currentButtonValue = elem.getAttribute('data-setting-value') || 'none';
          isCurrentValue = newValue === currentButtonValue;
          elem.setAttribute('aria-pressed', isCurrentValue);
        }
      });
    });
  }

  function getThemePowerGroup() {
    return byId(BP_CONST.THEME_POWER_ID);
  }

  function getThemeTextHueGroup() {
    return byId(BP_CONST.THEME_TEXT_HUE_ID);
  }

  function getMouseSizeRange() {
    return byId(BP_CONST.MOUSE_SIZE_ID);
  }

  function initRangeListener(settingName, rangeElem) {
    conf.get(settingName, function(val) {
      rangeElem.value = val;
    });
  }

  function initRanges() {
    var rangeElems = settingsPanel.querySelectorAll('input[type="range"]'),
      index = rangeElems.length,
      rangeElem,
      settingName;

    while (index --) {
      rangeElem = rangeElems[index];
      settingName = rangeElem.getAttribute('data-setting-name');
      initRangeListener(settingName, rangeElem);
      domEvents.on(rangeElem, 'blur', fireInputRangeMetric);
      rangeValueMap[settingName] = conf.get(settingName);
      adjustRangeBackground(rangeElem);
    }

  }

  function themeSlidersInit() {
    conf.get('themeName', function (name) {
      var isThemePowerEnabled = Boolean(name),
        isThemeTextHueEnabled = name === 'dark';
      getThemePowerGroup().setAttribute('data-show', isThemePowerEnabled);
      getThemeTextHueGroup().setAttribute('data-show', isThemeTextHueEnabled);
    });
  }

  function mouseSlidersInit() {
    var size = cursor.getSize(),
      MIN_BP_CURSOR_SIZE = 1.9;

    if (!conf.get('mouseSize')) {
      // No setting, so start from current cursor size means using the BP cursor size as a minimum
      size = Math.max(size, MIN_BP_CURSOR_SIZE);
    }
    getMouseSizeRange().value = size;
  }


  function getGeometryTargets(cssValues) {
    return cssValues;
  }

  function isNativeInput(elem) {
    return typeof elem.value !== 'undefined';
  }

  function onSettingsClick(evt) {
    var target = helper.getEventTarget(evt),
      settingName;
    if (target && !isNativeInput(target)) {
      settingName = target.getAttribute('data-setting-name');
      if (settingName) {
        conf.set(settingName, target.getAttribute('data-setting-value'));
      }
    }
  }

  function fireInputRangeMetric(event) {
    var target = event.target,
      id = target.id,
      settingName = target.getAttribute('data-setting-name'),
      oldValue = rangeValueMap[settingName],
      newValue = conf.get(settingName);

    if (oldValue !== newValue) { // Only fire on change
      rangeValueMap[settingName] = newValue;
      new metric.SliderSettingChange({
        id: id.split('scp-')[1] || id,  // Trim off scp- prefix
        settingName: settingName,
        old: oldValue,
        new: newValue
      }).send();
    }
  }

  // Use native value for things like <input type="range">
  // For sliders, this occurs when user drops the thumb (lets go of mouse button)
  function onSettingsNativeInputChange(evt) {
    var target = helper.getEventTarget(evt);
    if (target) {
      var settingName = target.getAttribute('data-setting-name'),
        newValue = + target.value;
      if (settingName) {
        conf.set(settingName, newValue);
      }
    }
  }

  // Firefox doesn't have a pure CSS way of adjusting the background
  function adjustRangeBackground(slider) {
    if (platform.browser.isMS) {
      // Not needed for IE/Edge, which do this via -ms- CSS
      // We prefer CSS approach in IE, because JS may have trouble keeping up with slider thumb movements
      return;
    }

    if (slider.className.indexOf('scp-normal-range') < 0) {
      return; // Don't do for hue ranges which have a rainbow bg
    }
    var value = + slider.value,
      min = parseFloat(slider.min),
      max = parseFloat(slider.max),
      percent = (100 * (value - min) / ( max - min)) + '%',
      LEFT_COLOR = '#538eca',
      RIGHT_COLOR = '#e2e2e2',
      gradient = 'linear-gradient(to right, ' +
        LEFT_COLOR + ' 0%,' +
        LEFT_COLOR + ' ' + percent + ',' +
        RIGHT_COLOR + ' ' + percent + ',' +
        RIGHT_COLOR + ' 100%)';
    inlineStyle.set(slider, {
      backgroundImage : gradient
    });
  }

  // Native input change
  // For sliders, this occurs when thumb moves at all, it doesn't need to be dropped there
  // We don't want to update too much, hence the timer
  function onSettingsNativeInputChangeDrag(evt) {
    adjustRangeBackground(evt.target);
    var currTime = + Date.now();
    if (currTime - lastDragUpdateTime > SLIDER_DRAG_UPDATE_MIN_INTERVAL) {
      lastDragUpdateTime = currTime;
      nativeFn.setTimeout(function() { onSettingsNativeInputChange(evt);}, 0 );
    }
  }

  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    events.on('bp/did-open-subpanel', onPanelUpdate);
  }

  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

});
