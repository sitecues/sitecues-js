/**
 * Toolbar menu feature implementations
 */

define([
    'core/metric',
    'core/constants',
    'bp-toolbar-menu/bp-toolbar-view',
    'core/events',
    'core/dom-events',
    'core/native-functions',
    'core/conf/user/manager'
  ],
  function(metric,
           constants,
           bpToolbarView,
           events,
           domEvents,
           nativeFn,
           conf) {

    var EXTRA_DELAY_BETWEEN_VIEWS = 800;

    function hideMenu() {
      require(['bp-toolbar-menu-button/bp-toolbar-menu-button'], function(bpToolbarMenuButton) {
        bpToolbarMenuButton.toggle();
      });
    }

    function whatIsThis() {
      bpToolbarView.enableBlurb('what-is');

      function showTips() {
        events.off('bp/did-open-subpanel', showTips);
        require(['bp-secondary/bp-secondary'], function (bpSecondary) {
          nativeFn.setTimeout(function() {
            bpSecondary.toggleFeature('tips');
          }, EXTRA_DELAY_BETWEEN_VIEWS);
        });
      }

      function showSecondaryPanel() {
        events.off('bp/did-expand', showSecondaryPanel);
        require(['bp-expanded/view/more-button'], function(moreButton) {
          moreButton.init();
          moreButton.show(function() {
            nativeFn.setTimeout(moreButton.activate, EXTRA_DELAY_BETWEEN_VIEWS);
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
        require(['core/bp/controller/expand-controller'],
          function (expandController) {
            expandController.init();
            expandController.expandPanel();
          });
      }

      enableActivation('scp-blurb-tour-tips', beginTipsTour);
      enableActivation('scp-blurb-slider-bar', expandPanel);
    }

    // function share() {
    //   hideMenu();
    // }
    //
    function turnOff() {
      if (conf.isSitecuesUser()) {
        require(['page/reset/reset'], function(reset) {
          reset.init();
          reset.resetAll();

          bpToolbarView.enableBlurb('hide');
          enableActivation('scp-blurb-hide-button', hide);
        });
      }
      else {
        hide();
      }
    }

    function hide() {
      var sitecuesToolbar = document.getElementById('sitecues-badge');

      function unhide() {
        document.removeEventListener('keydown', checkF8);
        localStorage.removeItem('sitecues-disabled');
        sitecuesToolbar.style.top = '';
        var currentFocus = document.activeElement;
        if (currentFocus.localName === 'sc-blurb') {
          currentFocus.blur();
        }
      }

      function checkF8(event) {
        if (event.keyCode === constants.KEY_CODE.F8) {
          // Reenable Sitecues
          unhide();
        }
      }

      // Animate toolbar hiding
      sitecuesToolbar.style.transition = 'top 500ms linear';
      requestAnimationFrame(function() {
        sitecuesToolbar.style.top = '-40px';
      });

      // Disable for next time, on this site
      localStorage.setItem('sitecues-disabled', true);

      // F8 can reenable
      document.addEventListener('keydown', checkF8);

      // Show new blurb on how to unhide
      bpToolbarView.enableBlurb('unhide');
      enableActivation('scp-blurb-unhide', unhide);
    }

    function enableActivation(id, activateFn) {
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
        // 'scp-toolbar-share': share,
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
