/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
define(
  [
    '$',
    'page/style-service/style-service',
    'core/conf/user/manager',
    'page/cursor/cursor-css',
    'core/platform',
    'core/events',
    'core/native-functions'
  ],
  function (
    $,
    styleService,
    conf,
    cursorCss,
    platform,
    events,
    nativeFn
  ) {
  'use strict';

  var isInitialized,
      // Regexp is used to match URL in the string given(see below).
      URL_REGEXP = '//[a-z0-9\-_]+(\.[a-z0-9\-_]+)+([a-z0-9\-_\.,@\?^=%&;:/~\+#]*[a-z0-9\-@\?^=%&;/~\+#])?',
      CURSOR_TYPES = ['default', 'pointer' ],
      CURSOR_SYNONYMS = { _default: 'auto' },  // Map cursor: auto -> cursor: default
      SITECUES_CURSOR_CSS_ID = 'sitecues-js-cursor',
      SITECUES_BP_CURSOR_CSS_ID = 'sitecues-js-bp-cursor',
      MIN_BP_CURSOR_SIZE = 1.9,
      REENABLE_CURSOR_MS = 20,
      ajaxCursors = {}, // URLs for IE cursors that have already been fetched via AJAX
      $stylesheet,
      $bpStylesheet,// For BP cursors, having a min size of MIN_BP_CURSOR_SIZE -- cursor is always large in BP
      cursorStylesheetObject,
      bpCursorStylesheetObject,
      MAX_USER_SPECIFIED_CURSOR_SIZE = 3.5,
      MAX_USER_SPECIFIED_MOUSE_HUE = 1.09,// If > 1.0 then use white
      autoSize,
      pageZoom,
      shakeVigorPercent,
      userSpecifiedSize,
      userSpecifiedHue;

  /*
   * Change a style rule in the sitecues-cursor stylesheet to use the new cursor URL
   * @param {Object CSSStyleRule} rule CSSStyleRule
   * @param {String} cursorValueURL  Example: 'url(data:image/svg+xml,%3....)0 8, default'
   * @returns {void}
   */
  function setCursorStyle(rule, cursorValueURL) {
    try {
      if (platform.browser.isWebKit) {
        // Hack .. wake up Chrome and Safari! They weren't refreshing the rule on hue-only changes
        // E.g. when you drag the mouse hue slider you should see instant changes
        rule.style.setProperty('cursor', '', 'important');
      }
      rule.style.setProperty('cursor', cursorValueURL, 'important');
    } catch (e) {
      if (SC_DEV) { console.log('Catch setting cursor property: %o', e); }
    }
  }

  function isCursorReadyToUse(url) {
    if (!ajaxCursors[url]) {
      return false;   // Has never been fetched, so isn't ready-to-use
    }

    // Ready to use if it's fetch is complete
    return ajaxCursors[url].isComplete;
  }

  function flushPendingCursorRules(url) {
    var ajaxCursor = ajaxCursors[url],
      cursorValue = ajaxCursor.cursorValue;
    ajaxCursor.isComplete = true;
    ajaxCursor.pendingRules.forEach(function(rule) {
      setCursorStyle(rule, cursorValue);
    });
  }

  // Begin to fetch the cursor if it's the first
  // attempt to use
  function beginCursorFetchIfFirst(rule, url, cursorValue) {
    if (ajaxCursors[url]) {
      // Fetch for this URL has already begin, don't start another one
      ajaxCursors[url].pendingRules.push(rule);
      return;
    }

    ajaxCursors[url] = {
      isFetched: false,
      cursorValue: cursorValue,
      pendingRules: [ rule ]
    };

    require(['core/util/xhr'], function (xhr) {
      xhr.get({
        url: url,
        crossDomain: true,
        headers: { Accept: 'application/octet-stream'},
        success: function () {
          if (SC_DEV) { console.log('Loading of CUR file completed!'); }
          flushPendingCursorRules(url);
        },
        error: function () {
          if (SC_DEV) { console.log('[Error] Unable to fetch cursor image from server: ' + url); }
        }
      });
    });
  }

  /**
   * We want to async load the cursor images before they used, for performance benefit.
   * For ex., if the image isn't available for some reason then don't wait for it,
   * go to another operation.
   *
   * @param {String} cursorValue  Example: "url(data:image/svg+xml,%3....)0 8, auto"
   * @param {Function} callback A function called after the ajax request completed
   * @returns {void}
   */
  function setCursorStyleWhenReady(rule, cursorValue) {
    function getUrlFromCursorValue() {
      var urlRegexp = new RegExp(URL_REGEXP, 'i'),
        cursorValueArray = urlRegexp.exec(cursorValue);
      return cursorValueArray[0];
    }

    var url = getUrlFromCursorValue();

    if (!platform.browser.isMS || isCursorReadyToUse(url)) {
      // No prefetch needed
      setCursorStyle(rule, cursorValue);
    }
    else {
      beginCursorFetchIfFirst(rule, url, cursorValue);
    }
  }

  /**
   * Does the given URL value match the cursor type?
   * @param cursorType
   * @param url
   * @returns {boolean}
   */
  function isCursorOfType(cursorType, url) {
    if (url.indexOf(cursorType) > -1) {
      return true;
    }
    var synonym = CURSOR_SYNONYMS['_' + cursorType];
    return synonym && url.indexOf(synonym) > -1;
  }

  /**
   * Refresh all cursor rules in the sitecues-cursor stylesheet, mapping them to cursorTypeUrls
   * @param cursorTypeUrls
   */
  function refreshCursorStyles(styleSheet, cursorTypeUrls) {
    if (!styleSheet || !styleSheet.cssRules) {
      return;
    }
    var rules = styleSheet.cssRules,
      numRules = rules.length,
      ruleIndex = 0,
      cursorTypeIndex,
      cursorType;

    for (; ruleIndex < numRules; ruleIndex ++) {
      var rule = rules[ruleIndex],
        value = rule.style.cursor;

      // Find the cursor type (auto, pointer, etc) and replace the style with our generated image.
      for (cursorTypeIndex = 0; cursorTypeIndex < CURSOR_TYPES.length; cursorTypeIndex ++) {
        cursorType = CURSOR_TYPES[cursorTypeIndex];
        if (isCursorOfType(cursorType, value)) {
          var cursorValueURL = cursorTypeUrls[cursorType];
          setCursorStyleWhenReady(rule, cursorValueURL);
        }
      }
    }
  }

  // Turning off custom cursor improves zoom animation in IE
  function toggleZoomOptimization(doDisable) {
    if (platform.browser.isMS) { // Only necessary for MS Browsers
      // Still seems to help in Edge as of version 13
      // The style service may not have initialized
      if (cursorStylesheetObject) {
        cursorStylesheetObject.disabled = Boolean(doDisable);
      }
    }
  }

  function createStyleSheet(id, cssText) {
    return $('<style>').appendTo('head')
      .attr('id', id)
      .text(cssText);
  }

  function getCursorStylesAsText() {
    // Use all cursor styles from the user agent stylesheet and the page
    var cursorStyleSubset = styleService.getAllMatchingStyles('cursor');
    return styleService.getStyleText(cursorStyleSubset, 'cursor');
  }

  // Create a stylesheet with only the cursor-related style rules
  function constructCursorStylesheet(callback) {
    var cssText = getCursorStylesAsText();

    // Create the sitecues <style id="sitecues-js-cursor"> element and content
    $stylesheet = createStyleSheet(SITECUES_CURSOR_CSS_ID, cssText);

    // Now set the cursorStyles global to the rules in the cursor style sheet.
    // The refresh methods will iterate over these styles and modify them
    styleService.getDOMStylesheet($stylesheet, function(styleSheetObject) {
      cursorStylesheetObject = styleSheetObject;
      callback();
    });

    // While zooming, turn off our CSS rules so that the browser doesn't spend
    // CPU cycles recalculating the custom cursor rules to apply during each frame
    // This makes a difference in IE 9/10 -- doesn't seem to help in other browsers.
    events.on('zoom/begin', function() {toggleZoomOptimization(true); });
  }

  // Stylesheet just for BP cursors
  // The cursors have a minimum size, and are NOT disabled during smooth zoom for performance,
  // as opposed to the page cursors, which can be disabled during smooth zoom for performance
  function constructBPCursorStylesheet() {
    var cssText =
      '#scp-bp-container,.scp-toolbar {cursor:default;}\n' +
      '.scp-hand-cursor {cursor:pointer}';

    $bpStylesheet = createStyleSheet(SITECUES_BP_CURSOR_CSS_ID, cssText);

    styleService.getDOMStylesheet($bpStylesheet, function(styleSheetObject) {
      bpCursorStylesheetObject = styleSheetObject;
    });
  }

  /**
   * Generates a CSS cursor property for every supported
   * cursor type at the current zoom level and then changes
   * all cursor properties in the <style id="sitecues-js-cursor">
   */
  function doRefresh() {
    // Get cursor URLs for current zoom levels
    var useCursorZoom = userSpecifiedSize || autoSize,
      cursorTypeUrls = getCursorTypeUrls(useCursorZoom),
      useDifferentBpSizes = !userSpecifiedSize && autoSize < MIN_BP_CURSOR_SIZE,
      bpCursorTypeUrls = useDifferentBpSizes ? getCursorTypeUrls(MIN_BP_CURSOR_SIZE) : cursorTypeUrls;

    // Refresh document cursor stylesheet if we're using one
    if (cursorStylesheetObject) {
      refreshCursorStyles(cursorStylesheetObject, cursorTypeUrls);
      nativeFn.setTimeout(toggleZoomOptimization, REENABLE_CURSOR_MS);
    }

    // Refresh BP cursor stylesheet
    if (bpCursorStylesheetObject) {
      refreshCursorStyles(bpCursorStylesheetObject, bpCursorTypeUrls);
    }
  }

  function isCustomCursorNeeded() {
    return autoSize > 1 || userSpecifiedSize || userSpecifiedHue;
  }

  function refreshStylesheetsIfNecessary() {
    if (!isCustomCursorNeeded()) {
      // Cursor is normal size or no custom cursor allowed right now
      if ($stylesheet) {
        $stylesheet.remove();
        $stylesheet = null;
      }
      doRefresh();
    }
    else if (!$stylesheet) {
      styleService.init(function () {
        constructCursorStylesheet(doRefresh);
      });
    }
    else {
      doRefresh();
    }
  }

  /**
   * Get the cursor URLs to support the current cursorZoom level
   * @returns {Array} Array of cursor URLS
   */
  function getCursorTypeUrls(size) {
    var cursorTypeUrls = [],
      i = 0,
      doUseMSCursors = platform.browser.isMS;

    // Generate cursor images for every cursor type...
    for (; i < CURSOR_TYPES.length; i ++) {
      // Don't use hotspotOffset in IE because that's part of the .cur file.
      var type = CURSOR_TYPES[i],
        css = cursorCss.getCursorCss(type, size, doUseMSCursors, getHue(), shakeVigorPercent);

      cursorTypeUrls[CURSOR_TYPES[i]] = css;
    }

    return cursorTypeUrls;
  }

  function onMouseSizeSetting(size) {
    userSpecifiedSize = size;
    styleService.init(refreshStylesheetsIfNecessary);
  }

  function onMouseHueSetting(hue) {
    userSpecifiedHue = hue;
    styleService.init(refreshStylesheetsIfNecessary);
  }

  function sanitizeMouseSize(size) {
    return Math.min(Math.max(size, 1), MAX_USER_SPECIFIED_CURSOR_SIZE);
  }

  function sanitizeMouseHue(hue) {
    if (!hue || hue < 0 || hue > MAX_USER_SPECIFIED_MOUSE_HUE) {
      return 0;
    }
    return hue;
  }

  function getHue() {
    return userSpecifiedHue > 0 && userSpecifiedHue <= 1 ? userSpecifiedHue : 0;
  }

  // Get the auto size for the cursor at the supplied page zoom level, or at the current page zoom if none supplied
  function getSize(pageZoom) {
    return userSpecifiedSize || cursorCss.getCursorZoom(pageZoom || conf.get('zoom') || 1);
  }

  function onPageZoom(_pageZoom) {
    pageZoom = _pageZoom;
    onInputsChanged();
  }

  function onInputsChanged() {
    if (userSpecifiedSize) {
      toggleZoomOptimization(); // Re-enable cursors -- they were disabled for zoom performance in IE
      return;
    }
    // At page zoom level 1.0, the cursor is the default size (same as us being off).
    // After that, the cursor grows faster than the zoom level, maxing out at 4x at zoom level 3
    var newCursorZoom = cursorCss.getCursorZoom(pageZoom, shakeVigorPercent);
    if (autoSize !== newCursorZoom) {
      autoSize = newCursorZoom;
      refreshStylesheetsIfNecessary();
    }
  }

  function onShakeChange(_shakeVigorPercent) {
    shakeVigorPercent = _shakeVigorPercent;
    onInputsChanged();
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    conf.def('mouseSize', sanitizeMouseSize);
    conf.def('mouseHue', sanitizeMouseHue);
    conf.get('mouseSize', onMouseSizeSetting);
    conf.get('mouseHue', onMouseHueSetting);

    events.on('zoom', onPageZoom);

    events.on('shake/did-change', onShakeChange);

    constructBPCursorStylesheet();
    autoSize = getSize();
    refreshStylesheetsIfNecessary();
  }

  return {
    init: init,
    getSize: getSize
  };
});
