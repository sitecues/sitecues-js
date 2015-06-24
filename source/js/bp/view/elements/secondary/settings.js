sitecues.def('bp/view/elements/settings', function (settings, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'conf', 'bp/model/state', 'cursor/css',
    function (BP_CONST, helper, conf, state, cursorCss) {

    var byId = helper.byId,
      isActive = false,
      settingsPanel;

    function onPanelUpdate() {

      var willBeActive = state.getSecondaryPanelName() === 'settings',
        settingsCards = byId(BP_CONST.SETTINGS_CONTENT_ID);

      if (isActive !== willBeActive) {
        if (willBeActive) {
          if (!settingsPanel) {
            init();
          }
          settingsCards.addEventListener('click', onSettingsClick);
          settingsCards.addEventListener('change', onSettingsNativeInputChange);
        }
        else {
          settingsCards.removeEventListener('click', onSettingsClick);
          settingsCards.removeEventListener('change', onSettingsNativeInputChange);
        }
      }

      isActive = willBeActive;
    }

    function init() {
      settingsPanel = byId(BP_CONST.SETTINGS_CONTENT_ID);

      generalInit();

      initRanges();

      themePowerInit();
    }

    // Set up setting synchronization
    function generalInit() {
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
          var settingElems = settingsPanel.querySelectorAll('[data-setting-name="' + name + '"]'),
            index = settingElems.length,
            elem,
            isCurrentValue;
          while (index -- ) {
            elem = settingElems[index];
            isCurrentValue = elem.getAttribute('data-setting-value') === newValue;
            elem.setAttribute('data-setting-current', isCurrentValue);
          }
        });
      });
    }

    function getThemePowerRangeInput() {
      return byId(BP_CONST.THEME_POWER_ID);
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
      }

    }

    function themePowerInit() {
      conf.get('themeName', function (name) {
        var isThemePowerEnabled = name !== null;
        getThemePowerRangeInput().setAttribute('data-show', isThemePowerEnabled);
      });
    }


    settings.getGeometryTargets = function(cssValues) {
      cssValues[true].focusOutlineTranslateX = -130;
      return cssValues;
    };

    function isNativeInput(elem) {
      return typeof elem.value !== 'undefined';
    }

    function onSettingsClick(evt) {
      var target = evt.target,
        settingName;
      if (target && !isNativeInput(target)) {
        settingName = target.getAttribute('data-setting-name');
        if (settingName) {
          conf.set(settingName, target.getAttribute('data-setting-value'));
        }
      }
    }

    // Use native value for things like <input type="range">
    function onSettingsNativeInputChange(evt) {
      var target = evt.target;
      if (target) {
        var settingName = target.getAttribute('data-setting-name');
        if (settingName) {
          conf.set(settingName, + target.value);
        }
      }
    }

    sitecues.on('bp/do-update', onPanelUpdate);

    callback();

  });
});
