/**
 *
 * This file exposes an API for creating javascript animations.
 */

sitecues.def('css-aggregator', function (cssAggregator, callback) {

  'use strict';

  sitecues.use('jquery', 'ua-css', 'conf/site', function ($, UA_CSS, site) {

    var numPending = 0,
      sheets = [],
      onCssReadyFn,
      currentSheetId = 0,
      doFetchCssFromChromeExtension = site.get('fetchCss') === 'chrome-extension';

    // Must provide url or text, but not both
    function StyleSheet(url, text, debugName) {

      this.url = url;
      this.text = !url && (text || '');
      if (SC_DEV) {
        this.debugName = debugName;
      }

      ++numPending;

      if (url) {
        // We will need to retrieve this one
        this.sheetId = ++ currentSheetId;
        var request = createGetRequest(url, currentSheetId),
          currentSheet = this;
        request.url = url;

        if (!request) {
          SC_DEV && console.log('CORS not supported');
          return 0;
        }

        // Only apply the request if the response status is 200
        request.onload = function(evt) {
          onload(evt, currentSheet);
        };
        request.onerror = function(evt) {
          requestComplete(evt, currentSheet);
        };
        request.send();
      }
    }

    function requestComplete(evt, sheet) {
      markReady(sheet);
    }

    function onload(evt, sheet) {
      var request = evt.target || this;
      sheet.text = request.responseText;
      requestComplete(evt, sheet);
    }

    function ChromeExtHttpRequest(url, requestId) {
      this.url = url;
      this.send = function () {
        var chromeRequest = this;
        $(window).one('ProcessCss-' + requestId, function (event) {
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
        window.dispatchEvent(new CustomEvent('RequestCss', { detail: { url: this.url, id: requestId } }));
      };
    }

    /**
     * Cross browser solution to initiating an XMLHTTPRequest
     * that supports the Origin HTTP header
     * @param  {string} method
     * @param  {string} url
     * @return {Object}
     */
    function createGetRequest(url, sheetId) {
      if (doFetchCssFromChromeExtension) {
        return new ChromeExtHttpRequest(url, sheetId);
      }
      //Credit to Nicholas Zakas
      var xhr = new XMLHttpRequest();

      if ('withCredentials' in xhr) {
        xhr.open('GET', url, true);
      } else if (typeof XDomainRequest !== 'undefined') {
        xhr = new XDomainRequest();
        xhr.open('GET', url);
      } else {
        xhr = null;
      }
      return xhr;
    }

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

      var URL_REGEXP = /url\((([\'\" ])*(?!data:|.*https?:\/\/|\/)([^\"\'\)]+)[\'\" ]*)/g,
        baseUrlObject = sitecues.parseUrl(sheet.url);
      return sheet.text.replace(URL_REGEXP, function (totalMatch, match1, match2, actualUrl) {
        // totalMatch includes the prefix string  url("      - whereas actualUrl is just the url
        return 'url(' + sitecues.resolveUrl(actualUrl, baseUrlObject);
      });
    }

    function removeComments(sheet) {
      // From http://blog.ostermiller.org/find-comment
      var COMMENTS_REGEXP = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g;
      return sheet.text.replace(COMMENTS_REGEXP, '');
    }

    function processSheetCss(sheet) {
      var IMPORT_REGEXP = /\s*(\@import\s+url\((([\'\" ])*([^\"\'\)]+)[\'\" ]*).*)/g;  // TODO check media type after whitespace here

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
      sheet.text = sheet.text.replace(IMPORT_REGEXP, function(totalMatch, match1, match2, match3, actualUrl) {
        // Insert sheet for retrieval before this sheet, so that the order of precedence is preserved
        var newSheet = insertNewSheetBefore(sheet, actualUrl);

        // Remove @import line from CSS
        return '';
      });
    }

    function isAcceptableMediaType(media) {
      /*
       * TODO What about "and" operator? See http://www.w3schools.com/tags/att_link_media.asp
       * @media can even have width. Example "screen and (min-width:500px)"
       * I'm not really sure we want to exclude media at all unless it really is just for another device
       */
      return media !== 'print';  // The most realistic value that we need to ignore
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
      if (newSheet.text) {
        // A <style> already has it's text --
        // as opposed to a <link href> which will be marked ready after it's loaded
        markReady(newSheet);
      }
    }

    function hasPendingRequests() {
      return numPending > 0;
    }

    function finalizeCssIfComplete() {
      if (!onCssReadyFn || hasPendingRequests()) {
        return;
      }

      // Concatenate retrieved CSS text
      var allCss = '';
      sheets.forEach(function(sheet) {
        if (SC_DEV) {
          allCss += '/***** ' + sheet.debugName + ' *****/\n\n';
        }
        allCss += (sheet.text || '') + '\n\n';
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

      function isCss(linkElem) {
        return linkElem.href.lastIndexOf('.css') > 0 ||
          startsWith(linkElem.type, 'text/css');
      }

      function isUsableLinkedStyleSheet(linkElem) {
        return isCss(linkElem) &&    // Make sure it is actually a CSS file
          isAcceptableMediaType(linkElem.media) &&     // Ignore all CSS with the wrong media, e.g. print
          linkElem.rel !== 'alternate stylesheet';  // Ignore alternate stylesheets
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
      var $styleElems = $('link,style').filter(isUsable);
      $styleElems.each(addSheetForElem);

      onCssReadyFn = cssReadyCallbackFn;
      finalizeCssIfComplete();
    };

    callback();

  });
});
