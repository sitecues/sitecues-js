/**
 * This module collects all the relevant CSS for the entire web page into one large string.
 */

define(
  [
    'Promise',
    'page/style-service/user-agent-css',
    'run/conf/urls',
    'core/native-global',
    'run/util/array-utility',
    'run/inline-style/inline-style'
  ],
  function (
    Promise,
    UA_CSS,
    urls,
    nativeGlobal,
    arrayUtil,
    inlineStyle
  ) {
  'use strict';

  var documentSheets,
      userAgentSheet,
      styleNodes,
      onAllSheetsLoaded,
      INLINE_ID_ATTR = 'data-sc-inline-sheet', // Allow each element with inline style to have its own ID for use with stylesheets
      idCount        = -1,
      LOAD_TIMEOUT   = 2000,
      externalList   = [],
      internalList   = [],
      inlineSheet    = {},
      ownerNodeMap   = new WeakMap(),
      openRequests   = new Set();

  function FutureStyleSheet(opts) {
    if (SC_DEV) {
      console.log('new stylesheet request:', opts);
    }
    var loadLink,
        ownerNode    = opts.ownerNode,
        useCssProxy  = opts.useCssProxy,
        futureSheet  = this;
    
    openRequests.add(futureSheet);
    
    if (useCssProxy) {
      var uri = opts.uri;
      // If the url is cross-origin we need to make a request to the css proxy to fetch the resource with
      // headers that allow us to access the content
      loadLink       = document.createElement('link');
      loadLink.rel   = 'stylesheet';
      loadLink.type  = 'text/css';
      // This rule disables the proxied stylesheet
      loadLink.media = '(max-width:0px)';
      loadLink.href  = getCssProxyUrl(uri);
      loadLink.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(loadLink);
    }
    else {
      // If the url is same origin, we're just waiting for the linked resource to load
      loadLink = ownerNode;
    }

    var resolveOpts = {
      loadLink    : useCssProxy ? loadLink : null,
      futureSheet : futureSheet
    };

    loadLink.addEventListener('load', function () {
      if (futureSheet.resolved) {
        // This request exceeded our 2 second timeout, so we skipped it
        return;
      }

      var sheet = getStyleSheet(loadLink);

      if (!sheet) {
        if (SC_DEV) {
          throw new Error('Link element loaded but the stylesheet isn\'t parsed. ????????wat');
        }
        return;
      }

      sheet.disabled = true;

      var index = externalList.indexOf(futureSheet),
          uri   = opts.uri,
          spliceParams = [index, 1];

      if (sheet.cssRules === null && urls.isCrossOrigin(uri) && !useCssProxy) {
        // We were waiting for this sheet to load, but it turns out we can't use it.
        // We'll now make a request to the proxy
        spliceParams.push(new FutureStyleSheet({
          ownerNode   : ownerNode,
          uri         : uri,
          useCssProxy : true
        }));
      }
      else if (sheet.cssRules) {
        ownerNodeMap.set(ownerNode, sheet);
        // Replace the futureSheet placeholder with the actual style sheet
        spliceParams.push(sheet);
      }

      Array.prototype.splice.apply(externalList, spliceParams);

      resolveSheetRequest(resolveOpts);
    });

    nativeGlobal.setTimeout(function () {
      if (!futureSheet.resolved) {
        if (SC_DEV) {
          console.log('Sheet request timed-out:', futureSheet);
        }
        resolveSheetRequest(resolveOpts);
      }
    }, LOAD_TIMEOUT);
  }

  function resolveSheetRequest(opts) {
    var futureSheet = opts.futureSheet,
        loadLink    = opts.loadLink;
    if (loadLink) {
      removeNode(loadLink);
    }
    openRequests.delete(futureSheet);
    futureSheet.resolved = true;
    resolveIfAllSheetsLoaded();
  }

  function resolveIfAllSheetsLoaded() {
    if (!openRequests.size) {
      if (SC_DEV) {
        console.log('all sheets loaded');
      }
      onAllSheetsLoaded();
    }
  }

  function removeNode(node) {
    node.parentElement.removeChild(node);
  }

  function getStyleSheet(ownerNode) {
    return arrayUtil.find(documentSheets, function (sheet) {
      return sheet.ownerNode === ownerNode;
    });
  }

  // CSS proxy passes us the CSS text whether or not cross-origin policy allows it
  // Example of page that needs this: http://www.dcmetrobln.org/about-us
  function getCssProxyUrl(url) {
    if (url.indexOf('data:') === 0) {
      return url;
    }
    return urls.getCssProxyUrl(url);
  }

  function refreshStyleNodes() {
    styleNodes = arrayUtil.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  }

  function buildStylesheetLists() {
    refreshStyleNodes();
    // If we've skipped a link node because it hasn't loaded yet, we need to offset the
    // owner node index
    var indexOffset = 0;

    function processSheet(sheet, index) {
      index += indexOffset;
      var ownerNode = sheet.ownerNode,
          styleNode = styleNodes[index];
      
      switch (ownerNode.localName) {
        case 'style':
          // We use `sitecues-js` instead of `sitecues` here because on sitecues.com
          // the style sheet ids start with sitecues. `sitecues-js` sheets are not for intended styles
          if (ownerNode.id.indexOf('sitecues-js') === -1) {
            internalList.push(sheet);
          }
          break;

        case 'link':
          var resourceURI = styleNode.href,
              futureSheetOpts  = {
                ownerNode : styleNode,
                uri       : resourceURI
              };

          if (ownerNode !== styleNode) {
            // The document.styleSheets list is in document order, so if this sheet's owner node doesn't match the current
            // stylesheet node we know that it's a link element with an incompletely loaded stylesheet
            indexOffset++;

            if (resourceURI && isUsableCssUrl(resourceURI)) {
              // Only listen for the resource to load if a uri has been defined
              futureSheetOpts.useCssProxy = false;
              externalList.push(new FutureStyleSheet(futureSheetOpts));
            }

            processSheet(sheet, index);
            return;
          }
          else if (sheet.cssRules !== null) {
            // The sheet is same origin, or headers have been provided so we can access its rules
            externalList.push(sheet);
          }
          else if (isForRelevantMedia(sheet) && isUsableCssUrl(resourceURI) && urls.isCrossOrigin(resourceURI)) {
            // We can't read cross-origin stylesheets directly, so we need to request the resource from the css-proxy
            futureSheetOpts.useCssProxy = true;
            externalList.push(new FutureStyleSheet(futureSheetOpts));
            return;
          }
          break;
      }

      ownerNodeMap.set(ownerNode, sheet);
    }

    arrayUtil.from(documentSheets).forEach(processSheet);
  }

  // Needed to support deprecated @bgcolor
  // for example on http://www.nhptv.org/natureworks/fisher.htm
  function fixDeprecatedAttributeStyles() {
    var elements = arrayUtil.from(document.querySelectorAll('[bgcolor]'));
    elements.forEach(function (element) {
      inlineStyle.set(element, {
        backgroundColor : element.getAttribute('bgcolor')
      });
    });
  }

  function isForRelevantMedia(sheet) {
    var invalidMedia = ['print'];
    return !sheet.media || invalidMedia.indexOf(sheet.media.mediaText) === -1;
  }

  function isUsableCssUrl(url) {
    // Sitecues does not need to process CSS3 fonts, at least for now -- waste of processing
    // Fill in more common font pattern libraries here
    // The benefit is less work and speedier processing of site CSS
    var GOOGLE_FONT_PATTERN = '//fonts.google';
    return url.indexOf(GOOGLE_FONT_PATTERN) < 0;
  }

  function buildInlineSheet() {
    fixDeprecatedAttributeStyles();

    var cssRules = inlineSheet.cssRules = [],
        styledElements   = document.querySelectorAll('[style]'),
        sitecuesElements = document.querySelectorAll('[id^="sitecues"],[id^="sitecues"] *');

    arrayUtil.difference(styledElements, sitecuesElements).forEach(function (element) {
      var selector     = getNextIdSelector(),
          cssStyleRule = {};

      cssStyleRule.style        = inlineStyle(element);
      cssStyleRule.selectorText = selector;

      element.setAttribute(INLINE_ID_ATTR, idCount);
      cssRules.push(cssStyleRule);
    });
  }

  function buildUserAgentSheet() {
    var cssText   = UA_CSS,
        styleNode = document.createElement('style');
    // Disable the stylesheet
    styleNode.media = '(max-width:0px)';
    styleNode.innerText = cssText;
    document.head.appendChild(styleNode);
    userAgentSheet = getStyleSheet(styleNode);
    userAgentSheet.disabled = true;
    removeNode(styleNode);
  }

  function getNextIdSelector() {
    idCount++;
    return '[' + INLINE_ID_ATTR + '="' + idCount + '"]';
  }

  function collectAllStyleSheets() {
    return new Promise(function (resolve) {
      onAllSheetsLoaded = resolve;
      buildStylesheetLists();
      buildInlineSheet();
      buildUserAgentSheet();
      resolveIfAllSheetsLoaded();
    }).then(function () {
      return {
        // Sheet containing default user agent styles
        userAgent : userAgentSheet,
        // Link element sheets
        external  : externalList,
        // Style element sheets
        internal  : internalList,
        // Simulated "sheet" of inline style CssDeclarations
        // Note: this is a potential memory leak, we should listen for elements removed from the DOM
        // and update this sheet accordingly
        inline    : inlineSheet
      };
    });
  }

  function init() {
    documentSheets = document.styleSheets;
  }

  return {
    collectAll: collectAllStyleSheets,
    init : init
  };
});
