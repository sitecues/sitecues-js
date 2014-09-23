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

  sitecues.use('jquery', 'style-service', 'conf', 'cursor/custom', 'platform', 'zoom',
    function (  $, styleService, conf, customCursor, platform, zoomModule) {

    var cursorZoom,
        // Regexp is used to match URL in the string given(see below).
        URL_REGEXP = '//[a-z0-9\-_]+(\.[a-z0-9\-_]+)+([a-z0-9\-_\.,@\?^=%&;:/~\+#]*[a-z0-9\-@\?^=%&;/~\+#])?',
        CURSOR_TYPES = ['default', 'pointer' ],
        CURSOR_SYNONYMS = { _default: 'auto' },  // Map cursor: auto -> cursor: default
        SITECUES_CURSOR_CSS_ID = 'sitecues-cursor',
        $stylesheet,
        cursorStylesheetObject,
        isInitComplete,
        CURSOR_OFFSETS = {
          _default : {x: 0,  y: 5, xStep: 0, yStep: 2.5},
          _pointer : {x: 10, y: 5, xStep: 3.5, yStep: 1.7}
        };

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
        // rule.style.cursor = cursorValueURL;  // TODO do we still need this?
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
    function refreshCursorStyles(cursorTypeUrls) {
      var rules = cursorStylesheetObject.cssRules,
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

    // Create a stylesheet with only the cursor-related style rules
    function constructCursorStylesheet() {
      var cursorStyleSubset = styleService.getAllMatchingStyles('cursor'),
        cssText = styleService.getStyleText(cursorStyleSubset, 'cursor');

      // Create the sitecues <style id="sitecues-cursor"> element and content
      $stylesheet = $('<style>').appendTo('head')
        .attr('id', SITECUES_CURSOR_CSS_ID)
        .text(cssText);

      // Now set the cursorStyles global to the rules in the cursor style sheet.
      // The refresh methods will iterate over these styles and modify them
      cursorStylesheetObject = styleService.getDOMStylesheet($stylesheet);

      if (platform.browser.isIE) {
        // While zooming, turn off our CSS rules so that the browser doesn't spend
        // CPU cycles recalculating the custom cursor rules to apply during each frame
        // This makes a difference in IE -- doesn't seem to help in other browsers.
        sitecues.on('zoom/begin', setCursorsDisabled);
      }
    }

    /**
     * Generates a CSS cursor property for every supported
     * cursor type at the current zoom level and then changes
     * all cursor properties in the <style id="sitecues-cursor">
     */
    function refreshStylesheet() {
      if (cursorZoom <= 1) {
        if ($stylesheet) {
          $stylesheet.remove();
          $stylesheet = null;
        }
        return;
      }

      if (!isInitComplete) {
        return; // Not ready yet -- will call back when the style-service is ready
      }

      if (!$stylesheet) {
        constructCursorStylesheet();
      }

      var cursorTypeUrls = getCursorTypeUrls();
      refreshCursorStyles(cursorTypeUrls);
      setCursorsDisabled(false);
    }

    /**
     * Get the cursor URLs to support the current cursorZoom level
     * @returns {Array} Array of cursor URLS
     */
    function getCursorTypeUrls() {
      var cursorTypeUrls = [],
        doUseRetinaCursors = zoomModule.isRetina() && platform.canUseRetinaCursors,
        // Use 2x pixel cursor if the browser's pixel ratio is higher than 1 and the
        // platform.browser supports css cursor scaling
        cursorGeneratorFn = doUseRetinaCursors ? generateCursorStyle2x : generateCursorStyle1x,
        pixelRatio = doUseRetinaCursors ? 2 : 1,
        i = 0;

      // Generate cursor images for every cursor type...
      for (; i < CURSOR_TYPES.length; i ++) {
        // Don't use hotspotOffset in IE because that's part of the .cur file.
        var type = CURSOR_TYPES[i],
          hotspotOffset = getCursorHotspotOffset(type, cursorZoom),
          image = customCursor.getUrl(type, cursorZoom, pixelRatio);

        cursorTypeUrls[CURSOR_TYPES[i]] = cursorGeneratorFn(image, hotspotOffset, type);
      }

      return cursorTypeUrls;
    }

    /**
     * Generates the cursor url for a given type and zoom level for NON retina displays
     * @param  {string} type
     * @param  {number} zoom
     * @return {string}
     */
    function generateCursorStyle1x(image, hotspotOffset, type) {
      return 'url(' + image + ')' + hotspotOffset + ', ' + type;
    }

    /**
     * Generates the cursor url for a given type and zoom level for retina displays
     * @param  {string} type
     * @param  {number} zoom
     * @return {string}
     */
    function generateCursorStyle2x(image, hotspotOffset, type) {
        return '-webkit-image-set(' +
                '    url(' + image + ') 1x,' +
                '    url(' + image + ') 2x' +
                ') ' + hotspotOffset + ', ' + type;
    }

    // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
    // The maths below based on experience and doesn't use any kind of specific logic.
    // We are likely to change it better one when we have final images.
    // There's no need for specific approach while we constantly change images and code.
    /**
     * Gets custom cursor's hotspot offset.
     * @param zl Number or string, represents zoom level.
     * @return {string} result A string in format 'x y' which is later used a part of cursor property value.
     */
    function getCursorHotspotOffset(type, zl) {
      if (platform.browser.isIE) {  // Don't use in IE -- it will be part of .cur file
        return '';
      }

      var zoomDiff = zl - 1,  // Lowest zoom level is 1, this is the difference from that
      offset = CURSOR_OFFSETS['_' + type];

      return (offset.x + offset.xStep * zoomDiff).toFixed(0) + ' ' + (offset.y + offset.yStep * zoomDiff).toFixed(0);
    }

    sitecues.on('zoom', function (pageZoom) {
      // SC-1184: between 1-1.3 page zoom there is no cursor enhancement
      // From there it grows slightly faster than the zoom level and ends at around 4x for zoom of 3
      var newCursorZoom = Math.round(Math.pow(pageZoom - 0.3, 1.5) * 10) / 10; // To nearest tenth
      if (cursorZoom !== newCursorZoom) {
        cursorZoom = newCursorZoom;
        refreshStylesheet();
      }
    });

    sitecues.on('style-service/ready', function() {
      isInitComplete = true;
      refreshStylesheet();
    });


    callback();
  
  });
});