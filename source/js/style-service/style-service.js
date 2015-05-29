/**
 * Service that lazily gets user agent stylesheets
 * and provides information about them.
 */
sitecues.def('style-service', function (styleService, callback) {

  'use strict';
  
  sitecues.use('jquery', 'css-aggregator', 'media-queries', function ($, cssAggregator, mediaQueries) {

    var $combinedStylesheet,  // Style sheet we lazily create as a composite of all styles, which we use to look at parsed style rules
      combinedDOMStylesheetObject,
      SITECUES_COMBINED_CSS_ID = 'sitecues-combined-css',
      WAIT_BEFORE_INIT_STYLESHEET = 50,
      hasInitBeenRequested,   // Have we even begun the init sequence?
      isInitComplete;      // Init sequence is complete

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
      styleService.getDOMStylesheet($combinedStylesheet, function(styleSheetObject) {
        combinedDOMStylesheetObject = styleSheetObject;
        combinedDOMStylesheetObject.disabled = true; // Don't interfere with page
        // Takes the browser a moment to process the new stylesheet
        setTimeout(function() {
          isInitComplete = true;
          sitecues.emit('style-service/ready');
        }, WAIT_BEFORE_INIT_STYLESHEET);
      });
    }

    function init() {
      if (hasInitBeenRequested) {
        return;  // Only init once
      }

      hasInitBeenRequested = true;

      // Create a <style id="sitecues-combined-css"> containing all relevant style rule in the right order.
      // It will start with default user agent style rules and add
      // any <style> or <link> that is not from sitecues, and create a combined stylesheet with those contents (in the right order).

      // This will initialize the composite stylesheet when finished and call style-service/ready
      cssAggregator.collectAllCss(onAllCssRetrieved);
    };


    // -------------------------------------- PUBLIC -----------------------------------------------

    /**
     * [This function allows the targeting of styles, such as "cursor", and invokes a callback
     * that gets passed the style and the rule associated with it for any CSS selector]
     * @param  {string}   propertyName
     * @param  {string]   matchValue, optional value to match, null to match anything
     * @return  {[]} Array of objects with rule (selector) and value (CSS property affected)
     */
    styleService.getAllMatchingStyles = function(propertyName, matchValue) {
      return styleService.getAllMatchingStylesCustom(function(cssStyleDeclaration) {
        var ruleValue = cssStyleDeclaration[propertyName];
        if (ruleValue && (!matchValue || matchValue === ruleValue)) {
          return ruleValue;
        }
      });
    };

    /**
     * [This function allows the targeting of styles, such as "cursor", and invokes a callback
     * that gets passed the style and the rule associated with it for any CSS selector]
     * @param  {fn} matchingFn takes a cssStyleDecl and returns a truthy/falsey value
     * @return  {[]} Array of objects with rule (selector) and value (CSS property affected)
     */
    styleService.getAllMatchingStylesCustom = function(matchingRuleFn) {
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
              SC_DEV && console.log('@media matched: ' + media);
              addMatchingRules(rule);    // Recursive
            }
            else {
              SC_DEV && console.log('@media DID NOT match: ' + media);
            }
          }
        }
      }

      if (!isInitComplete) {
        return [];
      }

      addMatchingRules(combinedDOMStylesheetObject);

      return styleResults;
    };

    /**
     * Get the DOM object for the stylesheet that lets us traverse the style rules.
     * Annoying that we have to do this.
     * @param $stylesheet
     * @returns {*}
     */
    styleService.getDOMStylesheet = function($stylesheet, callback) {
      var tries = 1,
        MAX_TRIES = 20,
        TRY_INTERVAL_MS = 10,
        id = $stylesheet[0].id;
      function getStyleSheet() {
        var i = 0,
          numSheets = document.styleSheets.length;
        for (; i < numSheets; i++) {
          if (document.styleSheets[i].ownerNode.id === id) {
            SC_DEV && console.log('Found stylesheet %s after try#%d', id, tries);
            callback(document.styleSheets[i]);
            return;
          }
        }

        if (++ tries <= MAX_TRIES) {
          SC_DEV && console.log('Could not find stylesheet ' + id);
          setTimeout(getStyleSheet, TRY_INTERVAL_MS);
        }
      }

      getStyleSheet();
    };

    /*
     * Get the CSS text that would be needed to create a new stylesheet from these styles
     */
    styleService.getStyleText = function(styles, propertyName) {
      // Get CSS text for styles
      var styleIndex = 0,
        css = '',
        numStyles = styles.length;

      for (; styleIndex < numStyles; styleIndex ++) {
        var rule = styles[styleIndex].rule;
        css += rule.selectorText + ' { ' + propertyName + ': ' + styles[styleIndex].value + '; }\n';
      }

      return css;
    };

    // Once the user zooms the style service is necessary to create the proper cursor rules
    sitecues.on('zoom', function (pageZoom) {
      if (pageZoom > 1) {
       init();
      }
    });

    // Normally we wait until the user zooms before initializing the style sevice.
    // However, in the case of the toolbar, we must always move fixed position elements
    // down. As this process requires the style-service, when the toolbar is inserted,
    // we will initialize the style service immediately.
    sitecues.on('bp/did-insert-toolbar', function() {
      if (document.readyState === 'complete') {
        init();
      }
      else {
        window.addEventListener('load', init);
      }
    });
  });

  callback();
});
