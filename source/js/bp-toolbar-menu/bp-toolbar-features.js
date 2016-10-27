/**
 * Toolbar menu feature implementations
 */

define([
    'run/metric/metric',
    'run/constants',
    'bp-toolbar-menu/bp-toolbar-view',
    'run/events',
    'run/dom-events',
    'mini-core/native-global'
  ],
  function(metric,
           constants,
           bpToolbarView,
           events,
           domEvents,
           nativeGlobal) {

    function hideMenu() {
      require(['bp-toolbar-menu-button/bp-toolbar-menu-button'], function(bpToolbarMenuButton) {
        bpToolbarMenuButton.toggle();
      });
    }

    // Provide basic info on Sitecues and allow user to jump directly to tips panel
    function whatIsThis() {
      var EXTRA_DELAY_BETWEEN_VIEWS = 800;

      function showTips() {
        events.off('bp/did-open-subpanel', showTips);
        require(['bp-secondary/bp-secondary'], function (bpSecondary) {
          nativeGlobal.setTimeout(function() {
            bpSecondary.toggleFeature('tips');
          }, EXTRA_DELAY_BETWEEN_VIEWS);
        });
      }

      function showSecondaryPanel() {
        events.off('bp/did-expand', showSecondaryPanel);
        require(['bp-expanded/view/more-button'], function(moreButton) {
          moreButton.init();
          moreButton.show(function() {
            nativeGlobal.setTimeout(moreButton.activate, EXTRA_DELAY_BETWEEN_VIEWS);
          });
          events.on('bp/did-open-subpanel', showTips);
        });
      }

      function beginTipsTour() {
        events.on('bp/did-expand', showSecondaryPanel);
        expandPanel();
      }

      function expandPanel() {
        hideMenu();
        require(['run/bp/controller/expand-controller'],
          function (expandController) {
            expandController.init();
            expandController.expandPanel();
          });
      }

      bpToolbarView.showBlurb('what-is');
      enableBlurbItem('scp-blurb-tour-tips', beginTipsTour);
      enableBlurbItem('scp-blurb-slider-bar', expandPanel);
    }

    // Reset Sitecues settings
    function turnOff() {
      require(['page/reset/reset'], function(reset) {
        // Reset Sitecues settings
        reset.init();
        reset.resetAll();

        // Enable option to completely hide Sitecues
        bpToolbarView.showBlurb('hide');
        enableBlurbItem('scp-blurb-hide-button', hide);
      });
    }

    // Hide Sitecues
    function hide() {
      var sitecuesToolbar = document.getElementById('sitecues-badge');

      function checkF8(event) {
        if (event.keyCode === constants.KEY_CODE.F8) {
          // Reenable Sitecues
          unhide();
        }
      }

      function unhide() {
        // Unhide Sitecues:
        // User has pressed F8 or clicked unhide option (after initially hiding Sitecues)
        document.removeEventListener('keydown', checkF8);
        localStorage.removeItem('sitecues-disabled');
        sitecuesToolbar.style.top = '';
        var currentFocus = document.activeElement;
        if (currentFocus.localName === 'sc-blurb') {
          currentFocus.blur();
        }
      }

      // Animate hiding of Sitecues toolbar
      sitecuesToolbar.style.transition = 'top 500ms linear';
      requestAnimationFrame(function() {
        sitecuesToolbar.style.top = '-40px';
      });

      // Disable for next time, on this site
      localStorage.setItem('sitecues-disabled', true);

      // F8 can reenable
      document.addEventListener('keydown', checkF8);

      // Show new blurb on how to unhide
      bpToolbarView.showBlurb('unhide');
      enableBlurbItem('scp-blurb-unhide', unhide);
    }

    function enableBlurbItem(id, activateFn) {
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
