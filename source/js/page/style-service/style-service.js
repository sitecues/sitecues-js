/**
 * Service that lazily gets user agent and page stylesheets
 * and provides information about them.
 */
define(
  [
    '$',
    'page/style-service/sheet-aggregator',
    'page/style-service/media-queries',
    'nativeFn'
  ],
  function (
    $,
    sheetAggregator,
    mediaQueries,
    nativeFn
  ) {
  'use strict';

  var
    domStylesheetObjects = [],
    DOM_STYLESHEET_KEY = 'DOMSS',
    isInitialized,
    isCssRequested,   // Have we even begun the init sequence?
    isCssComplete,      // Init sequence is complete
    callbackFns = [],
    debugTime = {};

  // This is called when all of the style sheets have been retrieved
  function retrievalComplete(styleSheets) {
    if (SC_DEV) {
      debugTime.retrievalComplete = performance.now();
      console.log('retrieval time:', debugTime.retrievalComplete - debugTime.begin);
    }
    isCssComplete = true;
    domStylesheetObjects = styleSheets;
    if (SC_DEV) {
      console.log('styleSheets:', styleSheets);
    }
    clearCallbacks();
  }

  function isReady() {
    return isCssComplete;
  }

  function requestCss() {
    if (isCssRequested) {
      return;  // Only init once
    }

    if (SC_DEV) {
      debugTime.begin = performance.now();
    }

    isCssRequested = true;

    // Create a <style id="sitecues-js-combined-css"> containing all relevant style rule in the right order.
    // It will start with default user agent style rules and add
    // any <style> or <link> that is not from sitecues, and create a combined stylesheet with those contents (in the right order).

    // This will initialize the composite stylesheet when finished and call style-service/ready
    sheetAggregator.collectAll().then(retrievalComplete);
  }


  // -------------------------------------- PUBLIC -----------------------------------------------

  /**
   * [This function allows the targeting of styles, such as "cursor", and invokes a callback
   * that gets passed the style and the rule associated with it for any CSS selector]
   * @param  {string}   propertyName
   * @param  {string]   matchValue, optional value to match, null to match anything
   * @return  {[]} Array of objects with rule (selector) and value (CSS property affected)
   */
  function getAllMatchingStyles(propertyName, matchValue) {
    return getAllMatchingStylesCustom(function (cssStyleDeclaration) {
      var ruleValue = cssStyleDeclaration[propertyName];
      if (ruleValue && (!matchValue || matchValue === ruleValue)) {
        return ruleValue;
      }
    });
  }

  /**
   * [This function allows the targeting of styles, such as "cursor", and invokes a callback
   * that gets passed the style and the rule associated with it for any CSS selector]
   * @param  {fn} matchingFn takes a cssStyleDecl and returns a truthy/falsey value
   * @return  {[]} Array of objects with rule (selector) and value (CSS property affected)
   */
  function getAllMatchingStylesCustom(matchingRuleFn) {
    var rule,
      ruleValue,
      cssStyleDeclaration,
      styleResults = [];

    function getMediaTypeFromCssText(rule) {
      // Change @media MEDIA_QUERY_RULES { to just MEDIA_QUERY_RULES
      return rule.cssText.split('{')[0].substr(7);
    }

    function addMatchingRules(rulesContainer) {
      var rules = rulesContainer.cssRules,
        ruleIndex = 0,
        numRules = rules ? rules.length : 0;

      for (; ruleIndex < numRules; ruleIndex++) {
        rule = rules[ruleIndex];
        cssStyleDeclaration = rule.style;
        if (cssStyleDeclaration && rule.selectorText) { // Could be null if rule is CSSMediaRule / @font-face
          ruleValue = matchingRuleFn(cssStyleDeclaration, rule.selectorText);
          if (ruleValue) {
            styleResults.push({rule: rule, value: ruleValue });
          }
        }
        else if (rule.styleSheet) {
          // Imported stylesheet
          addMatchingRules(rule.styleSheet);
        }
        else if (rule.media) {
          // Only add CSS rules where the media query fits
          // TODO Unfortunately, this means that if the window size or zoom changes,
          //      we won't have those rules anymore. Do we reanalyze at that point?
          var media = getMediaTypeFromCssText(rule);
          if (mediaQueries.isActiveMediaQuery(media)) {
            addMatchingRules(rule);    // Recursive
          }
        }
      }
    }

    if (!isCssComplete) {
      return [];
    }

    // Added in cascade order
    addMatchingRules(domStylesheetObjects.userAgent);
    domStylesheetObjects.external.forEach(addMatchingRules);
    domStylesheetObjects.internal.forEach(addMatchingRules);
    addMatchingRules(domStylesheetObjects.inline);

    return styleResults;
  }

  /**
   * Get the DOM object for the stylesheet that lets us traverse the style rules.
   * Annoying that we have to do this.
   * Uses callback instead of Promises because we want to be synchronous if possible.
   * This allows us to disable style sheets before they can cause a rerendering
   * @param $stylesheet
   * @returns {*}
   */
  function getDOMStylesheet($stylesheet, callback) {
    var cachedDOMStylesheet = $stylesheet.data(DOM_STYLESHEET_KEY);
    if (cachedDOMStylesheet) {
      callback(cachedDOMStylesheet);
      return;
    }

    var tries = 1,
        MAX_TRIES = 20,
        TRY_INTERVAL_MS = 10,
        id = $stylesheet[0].id;
    function getStyleSheet() {
      var i = 0,
          numSheets = document.styleSheets.length,
          domSheet;
      for (; i < numSheets; i++) {
        domSheet = document.styleSheets[i];
        if (domSheet.ownerNode.id === id) {
          $stylesheet.data(DOM_STYLESHEET_KEY, domSheet);
          callback(domSheet);
          return;
        }
      }

      if (++ tries <= MAX_TRIES) {
        if (SC_DEV) { console.log('Could not find stylesheet ' + id); }
        nativeFn.setTimeout(getStyleSheet, TRY_INTERVAL_MS);
      }
    }

    getStyleSheet();
  }

  /**
   * Lazily get the style sheet to be used for applying the theme.
   * @returns {jQuery}
   */
  function updateSheet(id, options) {
    var $sheet = $('#' + id),
      text = options.text,
      doDisable = options.doDisable,
      doCreate = !$sheet.length;

    if (doCreate) {
      // Create the stylesheet
      // Note: be sure to insert text into stylesheet before inserting into DOM
      // measured in IE11 to be more performant
      $sheet = $('<style>')
        .attr('id', id);
    }


    // Update text
    if (typeof text === 'string') {
      $sheet.text(text);
    }

    // Update disabled state
    if (typeof doDisable === 'boolean') {
      if (doDisable) {
        // Same as disabling but works without access to DOMStyleSheet object, which is hard to get to
        // This can always be done right away
        // We use the media attribute as an easier cross-browser way to disable sheets
        // Once IE11 goes away we may want to go back to using .disabled property access
        $sheet.attr('media', '(max-width:0px)');
      }
      else {
        $sheet.removeAttr('media');
      }
    }

    if (doCreate) {
      // Insert in DOM
      $sheet.appendTo('html');
    }

    return $sheet;
  }

  /**
   * Get the CSS text that would be needed to create a new stylesheet from these styles
   */
  function getStyleText(styles, propertyName) {
    // Get CSS text for styles
    var styleIndex = 0,
      css = '',
      numStyles = styles.length;

    for (; styleIndex < numStyles; styleIndex ++) {
      var rule = styles[styleIndex].rule;
      css += rule.selectorText + ' { ' + propertyName + ': ' + styles[styleIndex].value + '; }\n';
    }

    return css;
  }

  function clearCallbacks() {
    var index = callbackFns.length;
    while (index --) {
      callbackFns[index]();
    }
    callbackFns = [];
  }

  function init(callbackFn) {
    if (callbackFn) {
      callbackFns.push(callbackFn);
    }
    if (isInitialized) {
      if (isCssComplete) {
        clearCallbacks();
      }
      return;
    }
    isInitialized = true;
    sheetAggregator.init();
    requestCss();
  }

  return {
    isReady: isReady,
    init: init,
    getAllMatchingStyles: getAllMatchingStyles,
    getAllMatchingStylesCustom: getAllMatchingStylesCustom,
    getDOMStylesheet: getDOMStylesheet,
    updateSheet: updateSheet,
    getStyleText: getStyleText
  };
});
