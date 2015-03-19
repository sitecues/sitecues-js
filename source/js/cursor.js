/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor', function (cursor, callback) {

  'use strict';

  sitecues.use('jquery', 'style-service', 'conf', 'cursor/custom', 'platform',
    function (  $, styleService, conf, customCursor, platform) {

    var cursorZoom = 1,
        // Regexp is used to match URL in the string given(see below).
        URL_REGEXP = '//[a-z0-9\-_]+(\.[a-z0-9\-_]+)+([a-z0-9\-_\.,@\?^=%&;:/~\+#]*[a-z0-9\-@\?^=%&;/~\+#])?',
        CURSOR_TYPES = ['default', 'pointer' ],
        CURSOR_SYNONYMS = { _default: 'auto' },  // Map cursor: auto -> cursor: default
        SITECUES_CURSOR_CSS_ID = 'sitecues-cursor',
        SITECUES_BP_CURSOR_CSS_ID = 'sitecues-bp-cursor',
        MIN_BP_CURSOR_SIZE = 1.9,
        $stylesheet,
        $bpStylesheet,// For BP cursors, having a min size of MIN_BP_CURSOR_SIZE -- cursor is always large in BP
        cursorStylesheetObject,
        bpCursorStylesheetObject,
        isStyleServiceReady;

    /*
     * Change a style rule in the sitecues-cursor stylesheet to use the new cursor URL
     * @param {Object CSSStyleRule} rule CSSStyleRule
     * @param {String} cursorValueURL  Example: 'url(data:image/svg+xml,%3....)0 8, default'
     * @returns {void}
     */
    function setCursorStyle(rule, cursorValueURL) {
      try {
        rule.style.setProperty('cursor', cursorValueURL, 'important');
      } catch (e) {
        SC_DEV && console.log('Catch setting cursor property: %o', e);
      }
    }

    /**
     * We want to async load the cursor images before they used, for performance benefit.
     * For ex., if the image isn't available for some reason then don't wait for it,
     * go to another operation.
     *
     * @param {String} cursorValueURL  Example: "url(data:image/svg+xml,%3....)0 8, auto"
     * @param {Function} callback A function called after the ajax request completed
     * @returns {void}
     */
    function setCursorStyleWhenReady(rule, cursorValueURL) {
      if (!platform.browser.isIE) {
        // Not IE: no prefetch needed
        setCursorStyle(rule, cursorValueURL);
      }
      else {
        // Prefetch necessary
        var urlRegexp = new RegExp(URL_REGEXP, 'i'),
          cursorValueArray = urlRegexp.exec(cursorValueURL);
        try {
          $.ajax({
            url: cursorValueArray[0],
            crossDomain: true,
            type: 'GET',
            timeout: 5000,
            cache: true,
            headers: { Accept: 'application/octet-stream'},
            success: function () {
              SC_DEV && console.log('Loading of CUR file completed!');
              setCursorStyle(rule, cursorValueURL);
            },
            error: function (jqXHR) {
              jqXHR.abort();
              SC_DEV && console.log('[Error] Unable to fetch cursor image from server');
            }
          });
        }
        catch (ex) {
          SC_DEV && console.log("Catch during cursor ajax: %o", ex);
        }
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

    function setCursorsDisabled(doDisable) {
      cursorStylesheetObject.disabled = !!doDisable;
    }

    function createStyleSheet(id, cssText) {
      return $('<style>').appendTo('head')
        .attr('id', id)
        .text(cssText);
    }

    // Create a stylesheet with only the cursor-related style rules
    function constructCursorStylesheet() {
      var cursorStyleSubset = styleService.getAllMatchingStyles('cursor'),
        cssText = styleService.getStyleText(cursorStyleSubset, 'cursor');

      // Create the sitecues <style id="sitecues-cursor"> element and content
      $stylesheet = createStyleSheet(SITECUES_CURSOR_CSS_ID, cssText);

      // Now set the cursorStyles global to the rules in the cursor style sheet.
      // The refresh methods will iterate over these styles and modify them
      cursorStylesheetObject = styleService.getDOMStylesheet($stylesheet);

      if (platform.browser.isIE && platform.browser.version < 11) {
        // While zooming, turn off our CSS rules so that the browser doesn't spend
        // CPU cycles recalculating the custom cursor rules to apply during each frame
        // This makes a difference in IE 9/10 -- doesn't seem to help in other browsers.
        sitecues.on('zoom/begin', setCursorsDisabled);
      }
    }

    // Stylesheet just for BP cursors
    // The cursors have a minimum size, and are never disabled during smooth zoom for performance
    function constructBPCursorStylesheet() {
      var cssText =
        '#scp-main {cursor: default;}\n' +
        '.scp-target,.scp-hidden-target {cursor:pointer};';

      $bpStylesheet = createStyleSheet(SITECUES_BP_CURSOR_CSS_ID, cssText);
      bpCursorStylesheetObject = styleService.getDOMStylesheet($bpStylesheet);

      refreshStylesheets();

    }

    /**
     * Generates a CSS cursor property for every supported
     * cursor type at the current zoom level and then changes
     * all cursor properties in the <style id="sitecues-cursor">
     */
    function refreshStylesheets() {
      if (cursorZoom <= 1) {
        if ($stylesheet) {
          $stylesheet.remove();
          $stylesheet = null;
        }
      }
      else if (!$stylesheet && isStyleServiceReady) {
        constructCursorStylesheet();
      }

      // Get cursor URLs for current zoom levels
      var cursorTypeUrls = getCursorTypeUrls(cursorZoom),
        bpCursorTypeUrls = cursorZoom < MIN_BP_CURSOR_SIZE ? getCursorTypeUrls(MIN_BP_CURSOR_SIZE) : cursorTypeUrls;

      // Refresh document cursor stylesheet if we're using one
      if (cursorStylesheetObject) {
        refreshCursorStyles(cursorStylesheetObject, cursorTypeUrls);
        setCursorsDisabled(false);
      }

      // Refresh BP cursor stylesheet
      if (bpCursorStylesheetObject) {
        refreshCursorStyles(bpCursorStylesheetObject, bpCursorTypeUrls);
      }
    }

    /**
     * Get the cursor URLs to support the current cursorZoom level
     * @returns {Array} Array of cursor URLS
     */
    function getCursorTypeUrls(size) {
      var cursorTypeUrls = [],
        i = 0;

      // Generate cursor images for every cursor type...
      for (; i < CURSOR_TYPES.length; i ++) {
        // Don't use hotspotOffset in IE because that's part of the .cur file.
        var type = CURSOR_TYPES[i],
          css = customCursor.getCursorCss(type, size);

        cursorTypeUrls[CURSOR_TYPES[i]] = css;
      }

      return cursorTypeUrls;
    }

    sitecues.on('zoom', function (pageZoom) {
      // At page zoom level 1.0, the cursor is the default size (same as us being off).
      // After that, the cursor grows faster than the zoom level, maxing out at 4x at zoom level 3
      var newCursorZoom = customCursor.getCursorZoom(pageZoom);
      if (cursorZoom !== newCursorZoom) {
        cursorZoom = newCursorZoom;
        refreshStylesheets();
      }
    });

    sitecues.on('style-service/ready', function() {
      isStyleServiceReady = true;
      refreshStylesheets();
    });

    constructBPCursorStylesheet();

    callback();

  });
});
