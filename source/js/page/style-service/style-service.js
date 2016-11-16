/**
 * Service that lazily gets user agent and page stylesheets
 * and provides information about them.
 */
define(
  [
    '$',
    'page/style-service/css-aggregator',
    'page/style-service/media-queries',
    'run/platform',
    'core/native-global'
  ],
  function (
    $,
    cssAggregator,
    mediaQueries,
    platform,
    nativeGlobal
  ) {
  'use strict';

  var domStylesheetObjects = [],
    SITECUES_COMBINED_CSS_ID = 'sitecues-js-combined-css',
    WAIT_BEFORE_USING_STYLESHEET_DATA = 50,
    CSS_MAX_CHUNK_SIZE = 5000, // Max number of CSS chars to process at once
    DOM_STYLESHEET_KEY = 'DOMSS',
    isInitialized,
    isCssRequested,   // Have we even begun the init sequence?
    isCssComplete,      // Init sequence is complete
    callbackFns = [],
    debugTime = {};

  function addChunk(css, chunks, start, end) {
    var newChunk = css.substring(start, end),
      numChunks = chunks.length;

    if (chunks[numChunks - 1].length + newChunk.length < CSS_MAX_CHUNK_SIZE) {
      // Still fits within size threshold, just add to last chunk
      chunks[numChunks - 1] += newChunk;
    }
    else {
      chunks[numChunks] = newChunk;
    }
  }

  // Each } that is not inside an outer {} ends a legal chunk of CSS
  // We've already removed comments, so no need to worry about those
  function chunkCssByClosingBrace(css) {
    var chunks = [ '' ],
      lastChunkStart = 0,
      position = 0,
      nextClosingBrace,
      nextOpeningBrace,
      braceDepth = 0;

    while (true) {
      nextClosingBrace = css.indexOf('}', position);
      nextOpeningBrace = css.indexOf('{', position);
      if (nextOpeningBrace >= 0 && nextOpeningBrace < nextClosingBrace) {
        braceDepth ++; // Now 1 if not already inside other braces
        position = nextOpeningBrace + 1;
        continue;
      }
      else if (nextClosingBrace >= 0 ) {
        braceDepth --;
        position = nextClosingBrace + 1;
        if (braceDepth === 0) {
          // The end of a CSS block
          addChunk(css, chunks, lastChunkStart, position);
          lastChunkStart = position;
        }
        else if (braceDepth < 0) {
          if (SC_DEV) {
            console.log('Error parsing CSS ... brace mismatch at %s', css.substring(0, nextClosingBrace + 1));
          }
          addChunk(css, chunks, lastChunkStart, css.length);
          break;
        }
        else {}
      }
      else {
        // Last chunk
        addChunk(css, chunks, lastChunkStart, css.length);
        break;
      }
    }

    return chunks;
  }

  // Sometimes CSS that's too large creates huge performance problems in IE, locking up the browser
  // There seems to be a size threshold where the problems don't occur if they are under that
  // Note: not necessary in Edge!
  function chunkCss(allCss) {
    if (!platform.browser.isIE || allCss.length < CSS_MAX_CHUNK_SIZE) {
      return [ allCss ];
    }

    return chunkCssByClosingBrace(allCss);
  }

  /**
   * Create an disabled style sheet to be filled in later with styles
   */
  function createCombinedStylesheets(allCss, callback) {
    var cssChunks = chunkCss(allCss),
      index = 0,
      numChunks = cssChunks.length,
      elems = [];

    function createNext() {
      var $newSheet = updateSheet(SITECUES_COMBINED_CSS_ID + '-' + index, {
        text: cssChunks[index],
        doDisable: true
      });
      elems[index] = $newSheet[0];
      if (++ index < numChunks) {
        // We must wait before creating the next stylesheet otherwise we overload IE11 and cause it to lockup
        nativeGlobal.setTimeout(createNext, 0);
      }
      else {
        callback(elems);
      }
    }

    createNext();
  }

  function getDOMStyleSheetObjects(styleElems, callback) {
    var numRemaining = styleElems.length;
    styleElems.forEach(function(styleElem, index) {
      getDOMStylesheet($(styleElem), function(domStylesheetObject) {
        domStylesheetObjects[index] = domStylesheetObject;
        if (-- numRemaining === 0) {
          callback();
        }
      });
    });
  }

  // This is called() when all the CSS text of the document is available for processing
  function retrievalComplete(allCss) {
    if (SC_DEV) {
      debugTime.retrievalComplete = performance.now();
    }

    createCombinedStylesheets(allCss, function(styleElems) {
      nativeGlobal.setTimeout(function () {
        getDOMStyleSheetObjects(styleElems, function() {
          isCssComplete = true;
          clearCallbacks();

          // if (SC_DEV) {
          //   debugTime.processingComplete = performance.now();
          //   console.log(
          //     'Performance for style-service |    Total: %d    Retrieve CSS: %d   Process CSS: %d     |',
          //     debugTime.processingComplete - debugTime.begin,
          //     debugTime.retrievalComplete - debugTime.begin,
          //     debugTime.processingComplete - debugTime.retrievalComplete
          //   );
          // }
        });
      }, WAIT_BEFORE_USING_STYLESHEET_DATA);
    });
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
    cssAggregator.collectAllCss(retrievalComplete);
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
      styleResults = [],
      index = 0;

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
            // if (SC_DEV) { console.log('@media matched: ' + media); }
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

    for (; index < domStylesheetObjects.length; index ++) {
      addMatchingRules(domStylesheetObjects[index]);
    }

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
        nativeGlobal.setTimeout(getStyleSheet, TRY_INTERVAL_MS);
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

    requestCss();
  }

  return {
    isReady: isReady,
    requestCss: requestCss,
    init: init,
    getAllMatchingStyles: getAllMatchingStyles,
    getAllMatchingStylesCustom: getAllMatchingStylesCustom,
    getDOMStylesheet: getDOMStylesheet,
    updateSheet: updateSheet,
    getStyleText: getStyleText
  };
});
