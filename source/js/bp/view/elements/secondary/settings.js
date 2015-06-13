sitecues.def('bp/view/elements/settings', function (settings, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'conf', function (BP_CONST, helper, conf) {

    var byId = helper.byId;

    function onToggle(isActive) {

      var settingsCards = byId(BP_CONST.SETTINGS_CONTENT_ID);

      if (isActive) {
        // TODO why both?
//        nextBtn.addEventListener('click', nextCard);
//        prevBtn.addEventListener('click', prevCard);
//        sitecues.on('bp/next-card', nextCard);
//        sitecues.on('bp/prev-card', prevCard);
        settingsCards.addEventListener('click', onSettingsClick);
      }
      else {
//        nextBtn.removeEventListener('click', nextCard);
//        prevBtn.removeEventListener('click', prevCard);
//        sitecues.off('bp/next-card', nextCard);
//        sitecues.off('bp/prev-card', prevCard);
        settingsCards.removeEventListener('click', onSettingsClick);
      }
    }


    settings.extendCssValues = function(cssValues) {
      return cssValues;
    };

//    function nextCard () {
//
//      if (state.get('settingsMode') === SETTINGS_ENABLED) {
//
//        var activeCard = settingsCards.getElementsByClassName('scp-active')[0],
//            nextSibling = activeCard.nextElementSibling;
//
//        if (nextSibling) {
//          activeCard.setAttribute('class', activeCard.getAttribute('class').replace('scp-active', ''));
//          nextSibling.setAttribute('class', nextSibling.getAttribute('class') + ' scp-active');
//        }
//
//      }
//    }
//
//    function prevCard () {
//      if (state.get('settingsMode') === SETTINGS_ENABLED) {
//        var activeCard = settingsCards.getElementsByClassName('scp-active')[0],
//            prevSibling = activeCard.previousElementSibling;
//
//        if (prevSibling) {
//          activeCard.setAttribute('class', activeCard.getAttribute('class').replace('scp-active', ''));
//          prevSibling.setAttribute('class', prevSibling.getAttribute('class') + ' scp-active');
//        }
//      }
//    }
//

    function onSettingsClick(evt) {
      var target = evt.target;
      if (target) {
        var settingName = target.getAttribute('data-setting-name');
        if (settingName) {
          conf.set(settingName, target.getAttribute('data-setting-value'));
        }
      }
    }

    sitecues.on('bp/did-toggle-settings', onToggle);

    callback();

  });
});
