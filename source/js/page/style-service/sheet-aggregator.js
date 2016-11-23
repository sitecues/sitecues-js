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
      openRequests   = new Set();

  function onSheetParsed(opts) {
    var futureSheet   = opts.futureSheet,
        ownerNode     = opts.ownerNode,
        requestVector = opts.requestVector;

    if (futureSheet.resolved) {
      // This request exceeded our 2 second timeout, so we skipped it
      return;
    }

    var sheet = opts.styleSheet || getStyleSheet(ownerNode);

    if (!sheet) {
      if (SC_DEV) {
        throw new Error('Css loaded but the stylesheet isn\'t parsed. ????????wat');
      }
      return;
    }

    sheet.disabled = true;

    var index        = externalList.indexOf(futureSheet),
        url          = opts.url,
        spliceParams = [index, 1];

    if (sheet.cssRules === null && urls.isCrossOrigin(url) && !requestVector) {
      // We were waiting for this sheet to load, but it turns out we can't use it.
      // We'll now make a request to the proxy
      spliceParams[2] = new FutureStyleSheet({
        url           : url,
        requestVector : SC_EXTENSION ? 'extension' : 'proxy'
      });
    }
    else if (sheet.cssRules) {
      // Replace the futureSheet placeholder with the actual style sheet
      spliceParams[2] = sheet;
    }

    Array.prototype.splice.apply(externalList, spliceParams);

    resolveSheetRequest(opts);
  }
    
  // This function retrieves cssText for cross-origin sheets from the proxy


  function FutureStyleSheet(opts) {
    if (SC_DEV) {
      console.log('new stylesheet request:', opts);
    }
    var ownerNode,
        requestVector = opts.requestVector,
        url           = opts.url,
        futureSheet   = this,
        resolveOpts   = {
          futureSheet   : futureSheet,
          url           : url,
          requestVector : requestVector
        },
        boundCssHandler = nativeGlobal.bindFn.call(onSheetParsed, null, resolveOpts);

    openRequests.add(futureSheet);

    switch (requestVector) {
      case 'proxy':
        // If the url is cross-origin we need to make a request to the css proxy to fetch the resource with
        // headers that allow us to access the content
        ownerNode       = document.createElement('link');
        ownerNode.rel   = 'stylesheet';
        ownerNode.type  = 'text/css';
        // This rule disables the proxied stylesheet
        ownerNode.media = '(max-width:0px)';
        ownerNode.href  = getCssProxyUrl(url);
        ownerNode.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(ownerNode);
        resolveOpts.didInsertNode = true;
        break;

      case 'extension':
        // The extension is allowed to make cross-origin requests in the background page script, so
        // we don't have to use the proxy. We'll make the request, insert a `style` element into the
        // page containing the sheet's cssText to parse the sheet, and then remove the element
        // jshint -W117
        chrome.runtime.sendMessage({ action: 'fetchCss', url: url }, function onCssRetrieved(cssText) {
          if (futureSheet.resolved) {
            // This request exceeded our timeout limit
            return;
          }
          ownerNode = document.createElement('style');
          ownerNode.innerText = cssText;
          document.head.appendChild(ownerNode);
          resolveOpts.didInsertNode = true;
          resolveOpts.ownerNode = ownerNode;
          waitForInternalSheet(resolveOpts).then(onSheetParsed);
        });
        // jshint +W117
        break;

      default:
        // If the url is same origin, we're just waiting for the linked resource to load
        ownerNode = opts.originalNode;
        break;
    }

    if (ownerNode) {
      resolveOpts.ownerNode = ownerNode;
      if (ownerNode.localName === 'link') {
        ownerNode.addEventListener('load', boundCssHandler);
      }
      else {
        waitForInternalSheet(resolveOpts).then(onSheetParsed);
      }
    }

    nativeGlobal.setTimeout(function () {
      if (!futureSheet.resolved) {
        if (SC_DEV) {
          console.log('Sheet request timed-out:', futureSheet);
        }
        resolveSheetRequest(resolveOpts);
      }
    }, LOAD_TIMEOUT);
  }

  function waitForInternalSheet(opts) {
    var ownerNode  = opts.ownerNode,
        styleSheet = getStyleSheet(ownerNode);

    if (styleSheet) {
      opts.styleSheet = styleSheet;
      return Promise.resolve(opts);
    }

    return new Promise(function (resolve) {
      nativeGlobal.setTimeout(function () {
        resolve(waitForInternalSheet(opts));
      }, 25);
    });
  }

  function resolveSheetRequest(opts) {
    var futureSheet = opts.futureSheet,
        ownerNode   = opts.ownerNode,
        insertedNode = opts.didInsertNode;
    if (insertedNode) {
      removeNode(ownerNode);
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

      var ownerNode = sheet.ownerNode,
          nodeIndex = index + indexOffset,
          styleNode = styleNodes[nodeIndex];

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
                originalNode : styleNode,
                url          : resourceURI
              };

          if (ownerNode !== styleNode) {
            // The document.styleSheets list is in document order, so if this sheet's owner node doesn't match the current
            // stylesheet node we know that it's a link element with an incompletely loaded stylesheet
            indexOffset++;

            if (resourceURI && isUsableCssUrl(resourceURI)) {
              // Only listen for the resource to load if a url has been defined
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
            futureSheetOpts.requestVector = SC_EXTENSION ? 'extension' : 'proxy';
            externalList.push(new FutureStyleSheet(futureSheetOpts));
            return;
          }
          break;
      }
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
