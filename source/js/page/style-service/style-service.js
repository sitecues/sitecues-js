/**
 * Service that lazily gets user agent and page stylesheets
 * and provides information about them.
 */
define(['$', 'page/style-service/css-aggregator', 'page/style-service/media-queries'], function ($, cssAggregator, mediaQueries) {

  var $combinedStylesheet,  // Style sheet we lazily create as a composite of all styles, which we use to look at parsed style rules
    combinedDOMStylesheetObject,
    SITECUES_COMBINED_CSS_ID = 'sitecues-js-combined-css',
    WAIT_BEFORE_INIT_STYLESHEET = 50,
    isInitialized,
    isCssRequested,   // Have we even begun the init sequence?
    isCssComplete,      // Init sequence is complete
    callbackFns = [];

  /**
   * Create an disabled style sheet to be filled in later with styles
   */
  function createCombinedStyleSheet(allCss) {
    // Construct sitecues combined CSS <style> element
    return $('<style>')
      .appendTo('head')
      .attr('id', SITECUES_COMBINED_CSS_ID)
      .text(allCss);
  }

  // This is called() when all the CSS text of the document is available for processing
  function onAllCssRetrieved(allCss) {
    $combinedStylesheet = createCombinedStyleSheet(allCss);
    getDOMStylesheet($combinedStylesheet, function(styleSheetObject) {
      combinedDOMStylesheetObject = styleSheetObject;
      combinedDOMStylesheetObject.disabled = true; // Don't interfere with page
      // Takes the browser a moment to process the new stylesheet
      setTimeout(function() {
        isCssComplete = true;
        clearCallbacks();
      }, WAIT_BEFORE_INIT_STYLESHEET);
    });
  }

  function isReady() {
    return isCssComplete;
  }

  function requestCss() {
    if (isCssRequested) {
      return;  // Only init once
    }

    isCssRequested = true;

    // Create a <style id="sitecues-js-combined-css"> containing all relevant style rule in the right order.
    // It will start with default user agent style rules and add
    // any <style> or <link> that is not from sitecues, and create a combined stylesheet with those contents (in the right order).

    // This will initialize the composite stylesheet when finished and call style-service/ready
    cssAggregator.collectAllCss(onAllCssRetrieved);
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
    return getAllMatchingStylesCustom(function(cssStyleDeclaration) {
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
        else if (rule.media) {
          // Only add CSS rules where the media query fits
          // TODO Unfortunately, this means that if the window size or zoom changes,
          //      we won't have those rules anymore. Do we reanalyze at that point?
          var media = getMediaTypeFromCssText(rule);
          if (mediaQueries.isActiveMediaQuery(media)) {
            if (SC_DEV) { console.log('@media matched: ' + media); }
            addMatchingRules(rule);    // Recursive
          }
//          else {
//            if (SC_DEV) { console.log('@media DID NOT match: ' + media); }
//          }
        }
      }
    }

    if (!isCssComplete) {
      return [];
    }

    addMatchingRules(combinedDOMStylesheetObject);

    return styleResults;
  }

  /**
   * Get the DOM object for the stylesheet that lets us traverse the style rules.
   * Annoying that we have to do this.
   * @param $stylesheet
   * @returns {*}
   */
  function getDOMStylesheet($stylesheet, callback) {
    var tries = 1,
      MAX_TRIES = 20,
      TRY_INTERVAL_MS = 10,
      id = $stylesheet[0].id;
    function getStyleSheet() {
      var i = 0,
        numSheets = document.styleSheets.length;
      for (; i < numSheets; i++) {
        if (document.styleSheets[i].ownerNode.id === id) {
          // devlog('Found stylesheet %s after try#%d', id, tries);
          callback(document.styleSheets[i]);
          return;
        }
      }

      if (++ tries <= MAX_TRIES) {
        if (SC_DEV) { console.log('Could not find stylesheet ' + id); }
        setTimeout(getStyleSheet, TRY_INTERVAL_MS);
      }
    }

    getStyleSheet();
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

    requestCss();
  }

  return {
    isReady: isReady,
    requestCss: requestCss,
    init: init,
    getAllMatchingStyles: getAllMatchingStyles,
    getAllMatchingStylesCustom: getAllMatchingStylesCustom,
    getDOMStylesheet: getDOMStylesheet,
    getStyleText: getStyleText
  };
});
