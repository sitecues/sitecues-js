/**
 * Toolbar menu feature implementations
 */

define([
    'core/metric',
    'core/native-functions',
    'core/constants',
    'bp-toolbar-menu/bp-toolbar-view'
  ],
  function(metric,
           nativeFn,
           constants,
           bpToolbarView) {

    function hideMenu() {
      require(['bp-toolbar-menu-button/bp-toolbar-menu-button'], function(bpToolbarMenuButton) {
        bpToolbarMenuButton.toggle();
      });
    }

    function whatIsThis() {
      bpToolbarView.enableBlurb('what-is');
    }

    function share() {
      hideMenu();
    }

    function turnOff() {
      require(['page/reset/reset'], function(reset) {
        reset.init();
        reset.resetAll();
        bpToolbarView.refreshShowHide(true);
      });
    }

    function hide() {
      var sitecuesToolbar = document.getElementById('sitecues-badge');

      sitecuesToolbar.style.transition = 'transform 500ms linear';
      nativeFn.setTimeout(function() {
        sitecuesToolbar.style.transform = 'translateY(-40px)';
      });

      // Disable for next time, on this site
      localStorage.setItem('sitecues-disabled', true);

      function checkF8(event) {
        if (event.keyCode === constants.KEY_CODE.F8) {
          document.removeEventListener('keydown', checkF8);
          localStorage.removeItem('sitecues-disabled');
          sitecuesToolbar.style.transform = '';
        }
      }

      document.addEventListener('keydown', checkF8);
      bpToolbarView.enableBlurb('unhide');
    }

    function activateFeatureById(id) {
      var ALL_FEATURES = {
        'scp-toolbar-what-is': whatIsThis,
        'scp-toolbar-share': share,
        'scp-toolbar-turn-off' : turnOff,
        'scp-toolbar-hide': hide
      };

      var feature = ALL_FEATURES[id];

      if (feature) {
        new metric.OptionMenuItemSelection({ target: id }).send();
        feature();
      }
    }

    return {
      activateFeatureById: activateFeatureById
    };
  });
