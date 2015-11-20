/**
 * This module collects all the relevant CSS for the entire web page into one large string.
 */

define(['$', 'page/style-service/user-agent-css', 'core/conf/site', 'core/conf/urls', 'page/style-service/media-queries'],
  function ($, UA_CSS, site, urls, mediaQueries) {

  var numPending = 0,
    sheets = [],
    onCssReadyFn,
    chromeRequestId = 0,
    doFetchCssFromChromeExtension = site.get('fetchCss') === 'chrome-extension',
    INLINE_ID_ATTR = 'data-sc-inline', // Allow each element with inline @style to have own ID for use with stylesheets
    TIMEOUT_MS = 2000;

  /**
   * StyleSheet object constructor. This object represents one stylesheet on the page,
   * either from a <link rel="stylesheet">, a <style> or an @import.
   * Caller should provide a url or text, but not both.
   * @param url The url of the stylesheet to fetch
   * @param text The text of the stylesheet if already known (ignored if there is a url)
   * @param debugName [optional] -- a name for the stylesheet to help with debugging
   * @constructor
   */
  function StyleSheet(url, text, debugName) {

    this.url = url;
    if (SC_DEV) {
      this.debugName = debugName;
    }

    ++numPending;

    var currentSheet = this;

    if (url) {
      // We will need to retrieve this stylesheet over the network
      var request = createGetRequest(url);
      request.url = url;

      // Only apply the request if the response status < 400 (>=400 means error but onerror not called!)
      request.onload = function(evt) {
        var request = evt.target || this;
        if (request.status < 400) {
          currentSheet.text = request.responseText;
        }
        markReady(currentSheet);
      };
      request.onerror = function() {
        // Still need to mark it ready even though we don't have any CSS text for it,
        // otherwise the numPending will not return to 0 and we will never finish aggregating the CSS
        markReady(currentSheet);
      };
      currentSheet.errorTimeout = setTimeout(function() {
        markReady(currentSheet);
      }, TIMEOUT_MS);
      request.send();
    }
    else {
      // A <style> already has it's text --
      // as opposed to a <link href> which will be marked ready after it's loaded
      currentSheet.text = (text || '');
      setTimeout(function () {
        // Use the setTimeout as a fake fetch that will simply provide the text we already have.
        // (We don't want to mark ready until all the sheets are added to the queue, otherwise we could finish too early)
        markReady(currentSheet);
      }, 0);
    }
  }
  /**
   * Create a request object that proxies through the Chrome extension, in order to get around CORS
   * @param url
   * @constructor
   */
  function ChromeExtHttpRequest(url) {
    ++ chromeRequestId;  // Each request gets a unique ID so that we can keep it's request events separate

    this.url = url;
    this.send = function () {
      var chromeRequest = this;
      $(window).one('ProcessCss-' + chromeRequestId, function (event) {
        var responseText = event.detail,
          responseEvent = { target: chromeRequest };
        if (responseText) {  // We succeeded in getting the content and the response text is in the detail field
          chromeRequest.responseText = responseText;
          chromeRequest.onload(responseEvent);
        }
        else {
          if (SC_DEV) { console.log('Error loading CSS: ' + chromeRequest.url); }
          chromeRequest.onerror(responseEvent);
        }
      });
      window.dispatchEvent(new CustomEvent('RequestCss', { detail: { url: this.url, id: chromeRequestId } }));
    };
  }

  // Will cross-domain restrictions possibly burn us?
  function isOnDifferentDomain(cssUrl) {
    function getHostName(url) {
      return urls.parseUrl(url).hostname;
    }

    // For our purposes, hostname is the same as the domain
    return getHostName(cssUrl) !== document.location.hostname;
  }

  /**
   * Cross browser solution to initiating an XMLHTTPRequest
   * that supports the Origin HTTP header
   * @param  {string} method
   * @param  {string} url
   * @return {Object}
   */
  function createGetRequest(url) {

    if (isOnDifferentDomain(url)) {
      if (SC_DEV) {
        console.log('Cross-Domain: ' + url);
      }
      if (doFetchCssFromChromeExtension) {
        return new ChromeExtHttpRequest(url);
      }
      // Use sitecues CSS proxy to bypass CORS restrictions on fetching CSS text for analysis
      url = urls.getApiUrl('css-proxy/' + url);
    }
    // Credit to Nicholas Zakas
    // http://www.nczonline.net/blog/2010/05/25/cross-domain-ajax-with-cross-origin-resource-sharing/
    var xhr = new XMLHttpRequest();

    if ('withCredentials' in xhr) {
      xhr.open('GET', url, true);
    } else {
      xhr = new XDomainRequest();
      xhr.open('GET', url);
    }

    return xhr;
  }

  // Once a sheet is ready, mark it as complete and finalize the process if there are no pending sheet requests
  function markReady(sheet) {
    if (sheet.isFinished) {
      return;  // Don't allow sheet to be processed twice in the case of a timeout occurring earlier
    }

    sheet.isFinished = true;
    --numPending;

    clearTimeout(sheet.errorTimeout);

    processSheetCss(sheet);

    finalizeCssIfComplete();
  }

  function getParsedSheetUrl(sheet) {
    return urls.parseUrl(sheet.url);
  }

  // The regular expression for an absolute URL. There is a capturing group for
  // the protocol-relative portion of the URL.
  var ABSOLUTE_URL_REGEXP = /^[a-zA-Z0-9-]+:(\/\/.*)$/i;

  // Resolve a URL as relative to a base URL.
  function resolveUrl(urlStr, baseUrl) {
    var absRegExpResult = ABSOLUTE_URL_REGEXP.exec(urlStr);
    if (absRegExpResult) {
      // We have an absolute URL, with protocol. That's a no-no, so, convert to a
      // protocol-relative URL.
      urlStr = absRegExpResult[1];
    } else if (urlStr.indexOf('//') === 0) {
      // Protocol-relative No need to modify the URL,
      // as we will inherit the containing page's protocol.
    } else if (urlStr.indexOf('/') === 0) {
      // Host-relative URL.
      urlStr = '//' + baseUrl.hostname + urlStr;
    } else {
      // A directory-relative URL.
      urlStr = '//' + baseUrl.hostname + baseUrl.path + urlStr;
    }

    return urlStr;
  }

  /**
   * Replace all relatively defined style resources with their absolute counterparts. See SC-1302.
   * @param  {StyleSheet} sheet    A stylesheet object with text
   */
  function convertRelativeUrlsToAbsolute(sheet) {
    /*
     One of our goals is to extract from a CSS file all relative URLs. This document outlines
     valid URLs for CSS: http://www.w3.org/TR/CSS21/syndata.html#uri

     The RegEx below will MATCH the following:

     background: url(instant/templates/_default_/images/nyromodal/close.gif);
     background: url('instant/templates/_default_/images/nyromodal/close.gif');
     background: url("instant/templates/_default_/images/nyromodal/close.gif");
     background: url(  instant/templates/_default_/images/nyromodal/close.gif  );
     background: url(./instant/templates/_default_/images/nyromodal/close.gif);
     background: url('./instant/templates/_default_/images/nyromodal/close.gif');
     background: url("./instant/templates/_default_/images/nyromodal/close.gif");
     background: url(  ./instant/templates/_default_/images/nyromodal/close.gif  );
     background: url(../instant/templates/_default_/images/nyromodal/close.gif);
     background: url('../instant/templates/_default_/images/nyromodal/close.gif');
     background: url("../instant/templates/_default_/images/nyromodal/close.gif");
     background: url(  ../../instant/templates/_default_/images/nyromodal/close.gif  );

     The RegEx below will IGNORE the following:

     background: url(http://example.ru/templates/_default_/close.gif)
     background: url(https://instant/templates/_default_/images/nyromodal/close.gif);
     background: url('http://example.ru/templates/_default_/close.gif')
     background: url('https://instant/templates/_default_/images/nyromodal/close.gif');
     background: url("http://example.ru/templates/_default_/close.gif")
     background: url("https://instant/templates/_default_/images/nyromodal/close.gif");
     background: url(   http://example.ru/templates/_default_/close.gif   )
     background: url(   https://instant/templates/_default_/images/nyromodal/close.gif   );
     background:url(data:jpg;base64,/QL9Av0GaqAAA//2Q==)
     background: url(//int.nyt.com/applications/portals/assets/loader-t-logo-32x32-ecedeb-49955d7789658d80497f4f2b996577f6.gif)
     */

    var RELATIVE_URL_REGEXP = /url\((?:(?:[\'\" ])*(?!data:|https?:\/\/|\/\/)([^\"\'\)]+)[\'\" ]*)/gi,
      baseUrlObject;
    return sheet.text.replace(RELATIVE_URL_REGEXP, function (totalMatch, actualUrl) {
      // totalMatch includes the prefix string  url("      - whereas actualUrl is just the url
      baseUrlObject = baseUrlObject || getParsedSheetUrl(sheet);
      var newUrl = 'url(' + resolveUrl(actualUrl, baseUrlObject);
      return newUrl;
    });
  }

  // Clear CSS comments out of the current string
  function removeComments(sheet) {
    // From http://blog.ostermiller.org/find-comment
    var COMMENTS_REGEXP = /\/\*(?:[^*]|[\r\n]|(?:\*+(?:[^*/]|[\r\n])))*\*+\//g;
    return sheet.text.replace(COMMENTS_REGEXP, '');
  }

  // Convert @import into new stylesheet requests
  function processAtImports(sheet) {
    var IMPORT_REGEXP = /\s*(?:@import\s+url\((?:(?:['" ])*([^"'\)]+)['" ]*)\)\s*([^;$]*))/gi,
      baseUrlObject;

    return sheet.text.replace(IMPORT_REGEXP, function(totalMatch, actualUrl, mediaQuery) {
      // Insert sheet for retrieval before this sheet, so that the order of precedence is preserved
      mediaQuery = mediaQuery.split(';')[0];
      if (SC_DEV && mediaQuery) {
        console.log('@import media query: ' + mediaQuery);
      }
      if (mediaQueries.isActiveMediaQuery(mediaQuery)) {
        baseUrlObject = baseUrlObject || getParsedSheetUrl(sheet);
        insertNewSheetBefore(sheet, resolveUrl(actualUrl, baseUrlObject));
      }
      // Now remove @import line from CSS so that it does not get reprocessed
      return '';
    });
  }

  // Perform post-processing on the CSS text in the style sheet
  function processSheetCss(sheet) {
    // Ensure some text even in the case of an error
    sheet.text = sheet.text || '';

    // Remove comments so that they do not interfere,
    // after all we don't want to process commented-out @imports!
    sheet.text = removeComments(sheet);

    // Convert relative URLS to absolute
    if (sheet.url) {
      sheet.text = convertRelativeUrlsToAbsolute(sheet);
    }

    // Convert imports into new pending sheets
    sheet.text = processAtImports(sheet);
  }

  function insertNewSheetBefore(insertBeforeSheet, urlForNewSheet) {
    var debugName = SC_DEV && '@import ' + urlForNewSheet,
      insertionIndex = sheets.indexOf(insertBeforeSheet),
      newSheet = new StyleSheet(urlForNewSheet, null, debugName);
    sheets.splice(insertionIndex, 0, newSheet);
  }

  function addSheet(url, text, debugName) {
    var newSheet = new StyleSheet(url, text, debugName);
    sheets.push(newSheet);
  }

  function hasPendingRequests() {
    return numPending > 0;
  }

  function finalizeCssIfComplete() {
    if (hasPendingRequests()) {
      return;
    }

    // Concatenate retrieved CSS text
    var allCss = '';
    sheets.forEach(function(sheet) {
      if (SC_DEV) {
        allCss += '\n/***** ' + sheet.debugName + ' *****/\n\n';
      }
      allCss += (sheet.text || '') + '\n';
    });

    // Clear the sheets references and free the memory
    sheets.length = 0;

    // Use callback
    onCssReadyFn(allCss);
  }

  // Needed to support deprecated @bgcolor
  // for example on http://www.nhptv.org/natureworks/fisher.htm
  function addDeprecatedAttributeStyles() {
    var bgColors = {},
      cssText = '';
    $('body[bgColor],table[bgcolor],td[bgcolor],th[bgcolor]').each(function() {
      bgColors[this.getAttribute('bgcolor')] = 1;
    });

    Object.keys(bgColors).forEach(function (bgColor) {
      cssText += '[bgColor="' + bgColor + '"] { background-color:' + bgColor + ' }\n';
    });
    if (cssText) {
      addSheet(null, cssText, SC_DEV && 'bgcolor attrs');
    }
  }

  // Needed to support hacky inline style attributes
  // for example background-image on http://www.classifieds.faast.org/
  function addInlineStyles() {
    var cssText = '';

    $('body [style]').each(function(index, element) {
      $(element).attr(INLINE_ID_ATTR, index);
      cssText += '[' + INLINE_ID_ATTR + '="' + index + '"] {' + element.getAttribute('style') + '}\n';
    });

    if (cssText) {
      addSheet(null, cssText, SC_DEV && 'inline style attrs');
    }
  }

  /**
   * Initiates the collection of all style sheet text
   */
  function collectAllCss(cssReadyCallbackFn) {
    onCssReadyFn = cssReadyCallbackFn;

    $(document).ready(collectAllCssImpl);
  }

  function collectAllCssImpl() {

    function startsWith(s1, s2) {
      return s1.substr(0, s2.length) === s2;
    }

    function isUsableLinkedStyleSheet(linkElem) {
      return mediaQueries.isActiveMediaQuery(linkElem.media);     // Ignore all CSS with the wrong media, e.g. print
    }

    function isUsableStyleElement(styleElem) {
      return !!styleElem.firstChild;
    }

    function isUsable(index, elem) {
      var SITECUES_STYLE_ID_PREFIX = 'sitecues-',  // <style id="sitecues-XXX"> are sitecues stylesheets
        id = elem.id;
      if (!id || !startsWith(id, SITECUES_STYLE_ID_PREFIX)) {
        return elem.localName === 'link' ? isUsableLinkedStyleSheet(elem) : isUsableStyleElement(elem);
      }
    }

    function addSheetForElem(index, elem) {
      var isLink = elem.localName === 'link',
        href = isLink && elem.href,
        text = !isLink && elem.firstChild.data,
        debugName = SC_DEV && (elem.localName + ' ' + (href || ''));
      return addSheet(href, text, debugName);
    }

    // First come the default user agent CSS rules
    addSheet(null, UA_CSS, SC_DEV && 'User agent styles');

    // Add styles to make up for deprecated bgcolor attribute
    addDeprecatedAttributeStyles();

    // Add styles to deal with inline style="foo" attributes?
    addInlineStyles();

    // Next add <link> and <style> sheets, in document order
    var $styleElems = $('link[rel="stylesheet"],style').filter(isUsable);
    $styleElems.each(addSheetForElem);
  }

  return {
    collectAllCss: collectAllCss
  };
});
