/**
 * Toolbar menu feature implementations
 */

define([
    'core/metric',
    'core/constants',
    'core/bp/constants',
    'bp-toolbar-menu/bp-toolbar-view',
    'core/dom-events',
    'core/conf/user/manager'
  ],
  function(metric,
           constants,
           bpConstants,
           bpToolbarView,
           domEvents,
           conf) {

    function hideMenu() {
      require(['bp-toolbar-menu-button/bp-toolbar-menu-button'], function(bpToolbarMenuButton) {
        bpToolbarMenuButton.toggle();
      });
    }

    function whatIsThis() {
      bpToolbarView.enableBlurb('what-is');

      function showTips() {
        require(['core/bp/controller/expand-controller'], function (expandController) {
          expandController.expandPanel();
          setTimeout(function() {
            document.getElementById(bpConstants.MORE_BUTTON_CONTAINER_ID).click();
          });
        });

      }

      if (!whatIsThis.isInitialized) {
        whatIsThis.isInitialized = true;
        setTimeout(function() {
          enableButtonActivation('scp-blurb-what-is', showTips);
        }, 100);
      }
    }

    function share() {
      hideMenu();
    }

    function turnOff() {
      if (conf.isSitecuesUser()) {
        require(['page/reset/reset'], function(reset) {
          reset.init();
          reset.resetAll();

          bpToolbarView.showHideOption(true);
        });
      }
      else {
        hide();
      }
    }

    function hide() {
      var sitecuesToolbar = document.getElementById('sitecues-badge');

      sitecuesToolbar.style.transition = 'top 500ms linear';
      requestAnimationFrame(function() {
        sitecuesToolbar.style.top = '-40px';
      });

      // Disable for next time, on this site
      localStorage.setItem('sitecues-disabled', true);

      function checkF8(event) {
        if (event.keyCode === constants.KEY_CODE.F8) {
          // Reenable Sitecues
          document.removeEventListener('keydown', checkF8);
          localStorage.removeItem('sitecues-disabled');
          sitecuesToolbar.style.top = '';
          var currentFocus = document.activeElement;
          if (currentFocus.localName === 'sc-blurb') {
            currentFocus.blur();
          }
        }
      }

      document.addEventListener('keydown', checkF8);
      bpToolbarView.enableBlurb('unhide');
    }

    function enableButtonActivation(id, activateFn) {
      var blurb = document.getElementById(id);
      domEvents.on(blurb, 'click', activateFn);
      domEvents.on(blurb, 'keydown', function(event) {
        if (event.keyCode === constants.KEY_CODE.ENTER ||
          event.keyCode === constants.KEY_CODE.SPACE) {
          activateFn();
        }
      });
    }

    function activateFeatureById(id, hasFocus) {
      var ALL_FEATURES = {
        'scp-toolbar-what-is': whatIsThis,
        'scp-toolbar-share': share,
        'scp-toolbar-turn-off' : turnOff
      };

      var feature = ALL_FEATURES[id];

      if (feature) {
        new metric.OptionMenuItemSelection({ target: id }).send();
        feature(hasFocus);
      }
    }

    return {
      activateFeatureById: activateFeatureById
    };
  });
