/**
 * This module collects all the relevant CSS for the entire web page into one large string.
 */

sitecues.def('css-aggregator', function (cssAggregator, callback) {

  'use strict';

  sitecues.use('jquery', 'ua-css', 'conf/site', 'media-queries', function ($, UA_CSS, site, mediaQueries) {

    var numPending = 0,
      sheets = [],
      onCssReadyFn,
      chromeRequestId = 0,
      doFetchCssFromChromeExtension = site.get('fetchCss') === 'chrome-extension';

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

        // Only apply the request if the response status is 200
        request.onload = function(evt) {
          onload(evt, currentSheet);
        };
        request.onerror = function() {
          // Still need to mark it ready even though we don't have any CSS text for it,
          // otherwise the numPending will not return to 0 and we will never finish aggregating the CSS
          markReady(currentSheet);
        };
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

    function onload(evt, sheet) {
      var request = evt.target || this;
      sheet.text = request.responseText;
      markReady(sheet);
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
          var responseText = event.originalEvent.detail,
            responseEvent = { target: chromeRequest };
          if (responseText) {  // We succeeded in getting the content and the response text is in the detail field
            chromeRequest.responseText = responseText;
            chromeRequest.onload(responseEvent);
          }
          else {
            chromeRequest.onerror(responseEvent);
          }
        });
        window.dispatchEvent(new CustomEvent('RequestCss', { detail: { url: this.url, id: chromeRequestId } }));
      };
    }

    /**
     * Cross browser solution to initiating an XMLHTTPRequest
     * that supports the Origin HTTP header
     * @param  {string} method
     * @param  {string} url
     * @return {Object}
     */
    function createGetRequest(url) {
      if (doFetchCssFromChromeExtension) {
        return new ChromeExtHttpRequest(url);
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
      -- numPending;

      processSheetCss(sheet);

      finalizeCssIfComplete();
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
       background: url(/assets/homepage/20150518-111116/images/sprite/sprite-no-repeat.svg);
       background: url(//int.nyt.com/applications/portals/assets/loader-t-logo-32x32-ecedeb-49955d7789658d80497f4f2b996577f6.gif)
       */

      var RELATIVE_URL_REGEXP = /url\((([\'\" ])*(?!data:|.*https?:\/\/|\/)([^\"\'\)]+)[\'\" ]*)/g,
        baseUrlObject = sitecues.parseUrl(sheet.url);
      return sheet.text.replace(RELATIVE_URL_REGEXP, function (totalMatch, match1, match2, actualUrl) {
        // totalMatch includes the prefix string  url("      - whereas actualUrl is just the url
        return 'url(' + sitecues.resolveUrl(actualUrl, baseUrlObject);
      });
    }

    // Clear CSS comments out of the current string
    function removeComments(sheet) {
      // From http://blog.ostermiller.org/find-comment
      var COMMENTS_REGEXP = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g;
      return sheet.text.replace(COMMENTS_REGEXP, '');
    }

    // Convert @import into new stylesheet requests
    function processAtImports(sheet) {
      var IMPORT_REGEXP = /\s*(\@import\s+url\((([\'\" ])*([^\"\'\)]+)[\'\" ]*)\)\s*(.*))/g;

      return sheet.text.replace(IMPORT_REGEXP, function(totalMatch, match1, match2, match3, actualUrl, mediaQuery) {
        // Insert sheet for retrieval before this sheet, so that the order of precedence is preserved
        mediaQuery = mediaQuery.split(';')[0];
        SC_DEV && mediaQuery && console.log("@import media query: " + mediaQuery);
        if (mediaQueries.isActiveMediaQuery(mediaQuery)) {
          insertNewSheetBefore(sheet, actualUrl);
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

    /**
     * Initiates the collection of all style sheet text
     */
    cssAggregator.collectAllCss = function(cssReadyCallbackFn) {

      function startsWith(s1, s2) {
        return s1.substr(0, s2.length) === s2;
      }

      function isUsableLinkedStyleSheet(linkElem) {
        return mediaQueries.isActiveMediaQuery(linkElem.media);     // Ignore all CSS with the wrong media, e.g. print
      }

      function isUsableStyleElement(styleElem) {
        if (styleElem.firstChild) {
          var SITECUES_STYLE_ID_PREFIX = 'sitecues-',  // <style id="sitecues-XXX"> are sitecues stylesheets
            id = styleElem.id;
          return !id || !startsWith(id, SITECUES_STYLE_ID_PREFIX);
        }
      }

      function isUsable() {
        return this.localName === 'link' ? isUsableLinkedStyleSheet(this) : isUsableStyleElement(this);
      }

      function addSheetForElem(index, elem) {
        var isLink = elem.localName === 'link',
          href = isLink && elem.href,
          text = !isLink && elem.firstChild.data,
          debugName = SC_DEV && (elem.localName + ' ' + (href || ''));
        return addSheet(href, text, debugName);
      }

      // First come the default user agent CSS rules
      addSheet(null, UA_CSS.text, SC_DEV && 'User agent styles');

      // Next add <link> and <style> sheets, in document order
      var $styleElems = $('link[rel="stylesheet"],style').filter(isUsable);
      $styleElems.each(addSheetForElem);

      onCssReadyFn = cssReadyCallbackFn;
    };

    callback();

  });
});