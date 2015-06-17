sitecues.def('bp/view/elements/settings', function (settings, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'conf', 'bp/model/state', 'bp/view/elements/cards',
    function (BP_CONST, helper, conf, state, cards) {

    var byId = helper.byId;

    function onPanelUpdate() {

      var isActive = state.getSecondaryPanelName() === 'settings',
        settingsCards = byId(BP_CONST.SETTINGS_CONTENT_ID);

      if (isActive) {
        settingsCards.addEventListener('click', onSettingsClick);
      }
      else {
        settingsCards.removeEventListener('click', onSettingsClick);
      }
      cards.toggleActive(isActive, 'settings');
    }


    settings.getGeometryTargets = function(geometryTargets) {
      return geometryTargets;
    };

    function onSettingsClick(evt) {
      var target = evt.target;
      if (target) {
        var settingName = target.getAttribute('data-setting-name');
        if (settingName) {
          conf.set(settingName, target.getAttribute('data-setting-value'));
        }
      }
    }

    sitecues.on('bp/do-update', onPanelUpdate);

    callback();

  });
});
