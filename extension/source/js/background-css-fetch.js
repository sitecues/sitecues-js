/**
 * Css Fetch background script
 * Runs at a higher level of permission and can fetch CSS with running into cross-origin conflicts
 *
 * Fetch CSS via something like:
 * function onCssRetrieved(cssText) {
 * }
 * chrome.runtime.sendMessage({ action: "fetchCss", url: url }, onCssRetrieved);
 **/

'use strict';

/**
 *  Get pixel info for an image url
 */

(function() {

  function fetchCss(url) {
    return window.fetch(url)
      .then(function(response) {
        if (response.status >= 400) {
          throw new Error(response.statusText);
        }
        const contentType = response.headers.get('Content-Type').split(';')[0];
        if (contentType !== 'text/css' && contentType !== 'text/plain') {
          throw new Error('Incorrect Content-Type header for CSS; acceptable types are text/css or text/plain, was ' + contentType);
        }
        return response.text();
      });
  }

  function resolveUrl(url, baseUrl) {
    return new URL(url, baseUrl).toString();
  }

  /**
   * Replace all relatively defined style resources with their absolute counterparts. See SC-1302.
   * @param  {StyleSheet} sheet    A stylesheet object with text
   */
  function convertRelativeUrlsToAbsolute(cssText, origSheetUrl) {
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

    const RELATIVE_URL_REGEXP = /url\((?:(?:[\'\" ])*(?!data:|https?:\/\/|\/\/)([^\"\'\)]+)[\'\" ]*)/gi;
    return cssText.replace(RELATIVE_URL_REGEXP, function (totalMatch, actualUrl) {
      // totalMatch includes the prefix string  url("      - whereas actualUrl is just the url
      return 'url(' + resolveUrl(actualUrl, origSheetUrl);
    });
  }

  // Clear CSS comments out of the current string
  function removeComments(cssText) {
    // From http://blog.ostermiller.org/find-comment
    const COMMENTS_REGEXP = /\/\*(?:[^*]|[\r\n]|(?:\*+(?:[^*/]|[\r\n])))*\*+\//g;
    return cssText.replace(COMMENTS_REGEXP, '');
  }

  function isActiveMediaQuery(mediaQuery) {
    // No media query or a matching one
    const trimmedQuery = typeof mediaQuery === 'string' ? mediaQuery.trim() : '';
    return !trimmedQuery || window.matchMedia(trimmedQuery).matches;
  }

  // Perform post-processing on the CSS text in the style sheet
  function processSheetCss(cssText, origSheetUrl) {
    const imports = [];

    // Convert @import into new stylesheet requests
    function processAtImports(cssText) {
      const IMPORT_REGEXP = /\s*(?:@import\s+(?:url\()?(?:(?:['" ])*([^"'\)]+)['" ]*)(?:\))?\s*([^;$]*))/gi;

      return cssText.replace(IMPORT_REGEXP, function(totalMatch, actualUrl, mediaQuery) {
        // Insert sheet for retrieval before this sheet, so that the order of precedence is preserved
        mediaQuery = mediaQuery.split(';')[0];
        if (mediaQuery) {
          console.log('@import media query: ' + mediaQuery);
        }
        if (isActiveMediaQuery(mediaQuery)) {
          imports.push(resolveUrl(actualUrl, origSheetUrl));
        }
        // Now remove @import line from CSS so that it does not get reprocessed
        return '';
      });
    }

    // Remove comments so that they do not interfere,
    // after all we don't want to process commented-out @imports!
    cssText = removeComments(cssText);

    // Convert relative URLS to absolute
    if (origSheetUrl) {
      cssText = convertRelativeUrlsToAbsolute(cssText, origSheetUrl);
    }

    // Convert imports into new pending sheets
    cssText = processAtImports(cssText);

    return {
      cssText: cssText,
      imports: imports
    };
  }


  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'fetchCss') {
      fetchCss(message.url)
        .then(function(cssText) {
          const result = processSheetCss(cssText, message.url);
          sendResponse(result);
        })
        .catch(function() {
          console.warn('CSS unavailable for ', message.url);
          sendResponse(); // Pixel info unavailable
        });
      }
      return true;
    }
  );

})();

