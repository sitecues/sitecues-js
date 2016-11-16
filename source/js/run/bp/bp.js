// Structure of BP:
// bp.js -- initialization and common logic for badge and panel
// badge.js -- logic specific to badge
// panel.js -- logic specific to panel
// placement.js -- logic related to placing the BP in the right place in the DOM and on the screen
//
// sitecues events used by BP
//
// Information:
// bp/did-create   -- BP inserted in page
// bp/did-complete -- BP ready for input
// bp/will-expand  -- BP is about to expand
// bp/did-expand   -- BP has finished expanding
// bp/will-shrink  -- BP is about to shrink
// bp/did-shrink   -- BP has finished shrinking

define(
  [
    'run/events',
    'run/bp/controller/expand-controller',
    'run/bp/model/state',
    'run/bp/helper',
    'run/bp/constants',
    'run/conf/site',
    'run/bp/model/classic-mode',
    'run/bp/view/badge/page-badge',
    'Promise',
    'core/native-global',
    'run/inline-style/inline-style'
  ],
  function (
    events,
    expandController,
    state,
    helper,
    BP_CONST,
    site,
    classicMode,
    pageBadgeView,
    Promise,
    nativeGlobal,
    inlineStyle
  ) {
  'use strict';

  /*
   *** Public methods ***
   */

  // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
  var
      hasFixedBody = false,
      byId = helper.byId,
      docElem,
      badgeView;

  /**
   *** Start point ***
   */

  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }

  function isToolbarUIRequested() {
    return site.get('uiMode') === 'toolbar';
  }

  /**
   * initializeBPFeature is the main initialization function that is run when the
   * BP feature is ready to be enabled.  It creates the necessary elements,
   * renders them, and emits events for the rest of the application too
   */
  function initBPView() {
    if (!SC_EXTENSION && !isToolbarUIRequested()) {
      var badgePlaceholderElem = getBadgeElement();

      // Get site's in-page placeholder badge or create our own
      if (badgePlaceholderElem) {
        badgeView = pageBadgeView;
        return pageBadgeView.init(badgePlaceholderElem);
      }
    }

    // Toolbar mode requested or no badge (toolbar is default)
    // Note: cannot use require().then because we use AMD clean in the extension
    return new Promise(function(resolve) {
      require(['bp-toolbar-badge/bp-toolbar-badge'], function (toolbarView) {
        badgeView = toolbarView;
        badgeView.init().then(resolve);
      });
    });
  }

  function initBPFeature() {
    return initBPView()
      .then(function() {
        expandController.init();
        events.on('zoom/begin', function () {
          if (!hasFixedBody) {
            fixDimensionsOfBody();
            hasFixedBody = true;
          }
        });
        return getViewInfo();
      });
  }

  /*
                         ********  INITIALIZATION **********

      - Immediately initialize if the any of the following are true:
        - If the document is interactive and the customer does not use the <img>
        - If the document is complete
      - If we can't immediately initialize, add the appropriate event listener
        - If the customer uses the <img>, attach a load event listener to the <img>
        - If the customer does NOT use the <img>, attach a readystatechange event listener to the document.
  */

  function isDocReady() {
    if (!document.body) {
      // Pages that contain parsing errors may not have a body --
      // don't load Sitecues unless there is a body
      return false;
    }
    var readyState = document.readyState;
    return readyState === 'complete' || readyState === 'interactive';
  }

  // Init BP if the badge is ready and the document is 'interactive'|'complete'
  // Return true if BP initialized
  function docReady() {
    if (isDocReady()) {
      return Promise.resolve();
    }

    return new Promise(function(resolve) {
      function onReadyStateChange() {
        if (isDocReady()) {
          resolve();
          document.removeEventListener('readystatechange', onReadyStateChange);
        }
      }

      document.addEventListener('readystatechange', onReadyStateChange);
    });
  }

  function badgeReady() {
    // If badge is already in the DOM, we can already init
    var badgeElem = getBadgeElement();
    if (badgeElem) {
      return Promise.resolve();
    }

    // No badge yet -- wait until doc is interactive or complete
    return docReady();
  }

  // The toolbar gets to init earlier than a site-provided badge
  // It's safe to init as soon as the <body> is available
  function bodyReady() {
    var CHECK_BODY_INTERVAL = 250;
    return new Promise(function(resolve) {
      function checkBody() {
        if (document.body) {
          resolve();
        } else {
          nativeGlobal.setTimeout(checkBody, CHECK_BODY_INTERVAL);
        }
      }
      checkBody();
    });
  }

  // Classic mode is where the ? shows up instead of the down pointing arrow
  // TODO remove one day, we hope
  function initClassicMode() {
    state.set('isClassicMode', classicMode());
    sitecues.toggleClassicMode = function() {
      state.set('isClassicMode', !state.get('isClassicMode'));
    };
  }

  //It's possible that the transformations we apply to the body disrupt absolutely positioned elements
  //contained by the initial containing block. This is a hacky solution to the problem, but it is much cheaper
  //than analyzing the page and manually repositioning absolute elements.
  //TODO: Check client site CNIB's absolutely positioned elements if this gets changed
  function fixDimensionsOfBody() {
    var body = document.body,
        bodyStyle   = getComputedStyle(body),
        docStyle    = getComputedStyle(docElem),
        botMargin   = parseFloat(bodyStyle.marginBottom),
        topMargin   = bodyStyle.marginTop,
        leftMargin  = bodyStyle.marginLeft,
        rightMargin = bodyStyle.marginRight;

    if (parseFloat(bodyStyle.height) < parseFloat(docStyle.height)) {
      inlineStyle.override(body, {
        height : docStyle.height
      });
    }
    if (botMargin !== 0) {
      //marginBottom doesn't override bottom margins that are set with the shorthand 'margin' style,
      //so we get all the margins and set our own inline shorthand margin
      inlineStyle.override(body, {
        margin : topMargin + ' ' + rightMargin + ' 0px ' + leftMargin
      });
    }
  }

  function getViewInfo() {
    var badgeElem = document.getElementById('sitecues-badge'),
      rect = badgeElem ? badgeElem.getBoundingClientRect() : {};

    if (!rect.height) {
      return {
        isBadgeHidden: true
      };
    }

    var isToolbar = state.get('isToolbarBadge'),
      hasCustomPalette = typeof site.get('palette') === 'object',
      viewInfo = {
        badgePalette: hasCustomPalette ? 'custom' : state.get('defaultPaletteKey') || BP_CONST.PALETTE_NAME_NORMAL
      };

    if (isToolbar) {
      viewInfo.isToolbar = true;
    }
    else {
      viewInfo.badgeHeight = Math.round(rect.height);
      viewInfo.badgeTop = Math.round(rect.top - window.pageYOffset);
      viewInfo.badgeLeft = Math.round(rect.left - window.pageXOffset);
    }

    viewInfo.sensitivity = expandController.getSensitivity();

    return viewInfo;
  }

  /**
   * init()
   *
   * @return Promise
   *
   * Looks for the badge element, or wait for it to load, and insert and display the BP based on it's position.
   *    When this is called:
   * There are many cases for badge markup or config, and we also can't be sure exactly when this function is called
   * in the lifetime of the document.
   *
   * Conditions required before we create and display BP -- any of the following:
   *   1. site.get('uiMode') = 'toolbar' AND document.body is available
   *   2. Page readyState is 'interactive' AND badge element is found (also loaded if it was an <img>)
   *   3. Page readyState is 'complete' (will use a toolbar if no badge element is found at this point)
   *
   * BP config/setup cases:
   *   1. Toolbar config (e.g. sitecues everywhere) -- allowed to load early
   *   2. Empty badge placeholder <div id="sitecues-badge"> (normal in-page customer case)
   *   3. Badge image present <img id="sitecues-badge"> (old-school, these are deprecated)
   *     a) Already loaded
   *     b) Need to wait for <img>
   *   4. Missing badge and document not complete -- need to wait to see if badge shows up
   *   5. Missing badge and document complete (causes toolbar)
   */
  function init() {
    docElem = document.documentElement;

    // Get whether the BP will run in classic mode (still needed for MS Edge)
    initClassicMode();

    // ---- Look for toolbar config ----
    if (isToolbarUIRequested()) {
      // Case 1: toolbar config -- no need to wait for badge placeholder
      if (SC_DEV) { console.log('Early initialization of toolbar.'); }
      return bodyReady()
        .then(initBPFeature);
    }

    // ---- Look for badge, fall back to toolbar if necessary ----

    // Page may still be loading -- check if the badge is available
    return badgeReady()
      .then(initBPFeature);
  }

  return {
    init: init
  };
});
