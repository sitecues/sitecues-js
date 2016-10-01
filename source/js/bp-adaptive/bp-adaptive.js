/**
 * Handle theme changes either from website itself or from sitecues,
 * and automatically adjust the badge palette colors if the background changes (e.g. from white to black)
 *
 * For theme changes implemented by the web page itself:
 * - Listen for user input and check the page background to see if it changed via onWebPageThemeChange()
 *
 * For theme changes implemented by sitecues:
 * - Get notification of theme change via onSitecuesThemeChange()
 */
define(
  [
    'core/bp/model/state',
    'core/bp/view/view',
    'core/bp/constants',
    'mini-core/native-functions'
  ],
  function (
    state,
    bpView,
    BP_CONST,
    nativeFn
  ) {
  'use strict';

  var lastBgColor;

  function getBadgeElem() {
    return document.getElementById(BP_CONST.BADGE_ID);
  }

  function checkBackgroundColorChange(onPaletteUpdate, doForceBadgeUpdate) {
    var newBgColor = getBackgroundColor(),
      doBadgeUpdate = doForceBadgeUpdate;

    if (newBgColor !== lastBgColor) {
      lastBgColor = newBgColor;
      doBadgeUpdate = true;
    }

    if (doBadgeUpdate) {
      require(['page/util/color'], function(colorUtil) {
        if (SC_DEV) { console.log('Updating badge palette'); }
        var badgeElem = getBadgeElem();
        // TODO a very strange exception occurs here sometimes, where colorUtil is undefined. Here are 2 reports:
        //{"eventId":"2d937402-fb54-492f-b381-1d8ba4a07482","serverTs":1464011020272,"clientIp":"10.238.183.184","siteKey":"s-9afa6ab9","isTest":false,"userId":null,"clientData":{"scVersion":"4.0.73-RELEASE","metricVersion":12,"sessionId":"b23bbe86-920d-46f9-8aa6-49f0342b31bc","pageViewId":"2b8f1cd3-277a-4afe-abff-1853394c2265","siteId":"s-9afa6ab9","userId":"b4189839-09d8-4f59-b0dd-3225a4e10109","pageUrl":"http://www.perkins.org/solutions/featured-products/bus-stop-challenge","browserUserAgent":"Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0","isClassicMode":false,"clientLanguage":"en-US","source":"page","isTester":false,"name":"error","clientTimeMs":1464011020087,"zoomLevel":1,"ttsState":false,"details":{"message":"a is undefined","stack":"a/<@http://js.sitecues.com/l/s;id=s-9afa6ab9/4.0.73-RELEASE/js/bp-adaptive.js:1:351\nW@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:8:258\nO@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:9:31\nP/<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:10:28\nk@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:20:462\nO/k.then/</<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:21:72\nc/</<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:19:226\nc/<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:19:204\na@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:19:94\nwindow.setTimeout/<@http://www.perkins.org/solutions/featured-products/bus-stop-challenge:1:254\n"}}}
        //{"eventId":"c7f48c85-bc29-442d-b44a-28a2ef2157b2","serverTs":1464103968666,"clientIp":"10.235.39.83","siteKey":"s-9afa6ab9","isTest":false,"userId":null,"clientData":{"scVersion":"4.0.73-RELEASE","metricVersion":12,"sessionId":"4f5a5f25-c89f-43fe-a89e-a7696d4cf946","pageViewId":"e502e7d3-30e6-49e5-838b-0ef2020f805d","siteId":"s-9afa6ab9","userId":"3dc4aedf-3df5-4f4b-8646-debe01da031c","pageUrl":"http://www.perkins.org/solutions/featured-products/bus-stop-challenge","browserUserAgent":"Mozilla/5.0 (Windows NT 6.1; rv:45.0) Gecko/20100101 Firefox/45.0","isClassicMode":false,"clientLanguage":"en-US","source":"page","isTester":false,"name":"error","clientTimeMs":1464103967710,"zoomLevel":1,"ttsState":false,"details":{"message":"c is undefined","stack":".init/</<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:119:24\nW@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:8:258\nO@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:9:31\nP/<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:10:28\nk@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:20:462\nO/k.then/</<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:21:72\nc/</<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:19:226\nc/<@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:19:204\na@http://js.sitecues.com/l/s;id=s-9afa6ab9/js/sitecues.js:19:94\nwindow.setTimeout/<@http://www.perkins.org/solutions/featured-products/bus-stop-challenge:1:254\n"}}}
        state.set('paletteKey', colorUtil.isOnDarkBackground(badgeElem) ? BP_CONST.PALETTE_NAME_REVERSE_BLUE : getDefaultPalette());
        if (onPaletteUpdate) {
          onPaletteUpdate();
        }
      });
    }
  }

  function getDefaultPalette() {
    return state.get('defaultPaletteKey');
  }

  function getBackgroundColor() {
    return getComputedStyle(document.body).backgroundColor;
  }

  function adaptToSitecuesThemeChange(newTheme) {
    if (state.get('isToolbarBadge')) {
        return; // Toolbars don't adapt to theme changes
    }
    // If sitecues theme changes to dark, force adaptive palette. Otherwise use default palette.
    state.set('isAdaptivePalette', newTheme === 'dark');
    checkBackgroundColorChange(bpView.update, true);
  }

  // Input event has occurred that may trigger a theme change produced from the website code
  // (as opposed to sitecues-based themes). For example, harpo.com, cnib.ca, lloydsbank have their own themes.
  function onPossibleWebpageThemeChange() {
    nativeFn.setTimeout(function () {
      checkBackgroundColorChange(bpView.update);
    }, 0);
  }

  // Listen for change in the web page's custom theme (as opposed to the sitecues-based themes).
  // We don't know when they occur so we check shortly after a click or keypress.
  function initAdaptivePalette(onPaletteUpdate) {
    state.set('isAdaptivePalette', true);

    document.body.addEventListener('click', onPossibleWebpageThemeChange);
    document.body.addEventListener('keyup', onPossibleWebpageThemeChange);
    checkBackgroundColorChange(onPaletteUpdate, true);
  }

  return {
    initAdaptivePalette: initAdaptivePalette,
    adaptToSitecuesThemeChange: adaptToSitecuesThemeChange
  };
});
