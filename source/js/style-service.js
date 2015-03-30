/**
 * Service that lazily gets user agent stylesheets
 * and provides information about them.
 */
sitecues.def('style-service', function (styleService, callback) {

  'use strict';
  
  sitecues.use('jquery', function ($) {

    var $combinedStylesheet,  // Style sheet we lazily create as a composite of all styles, which we use to look at parsed style rules
      combinedDOMStylesheetObject,
      SITECUES_CSS_ID = 'sitecues-combined-css',
      SITECUES_CSS_DEFAULT = 'html,#scp-main {cursor:auto}\n' +
        'input,textarea,select,a,button,label[for]{cursor:pointer}\n',
      WAIT_BEFORE_INIT_STYLESHEET = 50,
      hasInitBeenRequested,   // Have we even begun the init sequence?
      isInitComplete;      // Init sequence is complete

    function isAcceptableMediaType(media) {
      /*
       * TODO What about "and" operator? See http://www.w3schools.com/tags/att_link_media.asp
       * @media can even have width. Example "screen and (min-width:500px)"
       * I'm not really sure we want to exclude media at all unless it really is just for another device
       */
      return media !== 'print';  // The most realistic value that we need to ignore
    }

    /**
     * [Creates an array of all <link> href attribute values]
     * @return {[array]}
     */
    function getAllLinkedStylesheets() {

      var stylesheets = [],
          linkTags = document.getElementsByTagName('link'),
          numLinkTags = linkTags.length;

      for(var i = 0; i < numLinkTags; i ++) {
        if (linkTags[i].href.indexOf('.css') !== -1 &&    // Make sure it is actually a CSS file
          isAcceptableMediaType(linkTags[i].media) &&     // Ignore all CSS with the wrong media, e.g. print
          linkTags[i].rel !== 'alternate stylesheet') {   // Ignore alternate stylesheets
          stylesheets.push(linkTags[i].href);
        }
      }

      return stylesheets;

    }
    /**
     * [constructCombinedStyleSheet builds a <style id="sitecues-combined-css">, maintaining the sites original precedence for styles]
     */
    function constructCombinedStyleSheet(linkTagStylesList, styleTags) {
      // Create the sitecues <style> element
      $combinedStylesheet = $('<style>').appendTo('head')
        .attr('id', SITECUES_CSS_ID);

      // Add our default styles
      var css = SITECUES_CSS_DEFAULT,
        index,
        numLinkTags = linkTagStylesList.length,
        numStyleTags = styleTags.length;

      // Add styles from link tags
      for (index = 0; index < numLinkTags; index ++) {
        if (linkTagStylesList[index]) {
          css += linkTagStylesList[index];
        }
      }

      // Add styles from other <style> tags
      for (index = 0; index < numStyleTags; index ++) {
        css += $(styleTags[index]).text();
      }

      $combinedStylesheet.text(css);
    }

    /**
     * [Cross browser solution to initiating an XMLHTTPRequest
     * that supports the Origin HTTP header]
     * @param  {[string]} method
     * @param  {[string]} url
     * @return {[XMLHTTPRequest]}
     */
    function createRequest(method, url) {
      //Credit to Nicholas Zakas
      var xhr = new XMLHttpRequest();

      if ('withCredentials' in xhr) {
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest !== 'undefined') {
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        xhr = null;
      }
      return xhr;
    }

    /**
     * [Abstracts away creating XMLHTTPRequests that support the
     * Origin HTTP Header, and also sets up the callback when the
     * response returns]
     * @param  {[string]}   method
     * @param  {[string]}   url
     * @param  {Function} callback
     * @return {number}  number of open CORS requests
     */
    function createCORSRequests(validSheets, linkTagStylesList, callback) {
      var openRequests = [],
        sheetNum = 0,
        numSheets = validSheets.length;

      function requestComplete(evt) {
        var request = evt.target || this;
        if (openRequests.length === 0) {
          return; // Already completed all requests
        }
        var index = openRequests.indexOf(request);
        if (index >= 0) {
          openRequests.splice(index, 1);
          if (openRequests.length === 0) {
            // Finished getting all requests back
            callback();
          }
        }
        else {
          // TODO remove if we don't see it happening
          SC_DEV && console.log('Request not found %s %o', request.url, request);
        }
      }

      function onload(evt) {
        linkTagStylesList.push(getStyleSheetTextFromCORSRequest(evt.target || this));
        requestComplete(evt);
      }

      for(; sheetNum < numSheets; ++ sheetNum) {
        var url = validSheets[sheetNum],
          request = createRequest('GET', url);
        request.url = url;

        if (!request) {
          SC_DEV && console.log('CORS not supported');
          return 0;
        }
        // Only apply the request if the response status is 200
        request.onload = onload;
        request.onerror = requestComplete;
        openRequests.push(request);
        request.send();
      }

      return numSheets;
    }

    function getAllStyleTags() {

      var allStyleTags = document.getElementsByTagName('style'),
        validStyleTags = [],
        numStyleTags = allStyleTags.length;

      for (var styleTagNum = 0; styleTagNum < numStyleTags; ++ styleTagNum) {
        if (!allStyleTags[styleTagNum].id || allStyleTags[styleTagNum].id.indexOf('sitecues') === -1) {
          validStyleTags.push(allStyleTags[styleTagNum]);
        }
      }

      return validStyleTags;
    }

    /**
     * [extractUrlsForReplacing removes the redundancy in the array of URLs]
     * @param  {[array]} matches [URLs extracted from response text]
     * @return {[array]}         [URLs extracted from response text minus the redundancy]
     * @example ['../a/b/styles.css','../a/b/styles.css?#iefix'] => ['../a/b/styles.css']
     * Above is an example of a redundancy that needs to be addressed before we globally
     * do a replacement.
     */
    function extractUrlsForReplacing(matches) {

      var i = 0,
          j,
          match_i,
          len = matches.length;

      for (; i < len; i ++) {
        match_i = matches[i];
        for (j = 0; j < len; j ++) {
          if (i !== j) {
            if (match_i.indexOf(matches[j]) !== -1) {
              matches.splice(i, 1);
              i = i > 0 ? i - 1 : 0;
              j = j > 0 ? j - 1 : 0;
              len = matches.length;
              match_i = matches[i];
            }
          }
        }
      }
      return matches;
    }

    /**
     * [extractUniqueUrlsFromMatches extracts the unique URLS from the array returned by matching
     * CSS file response text with the Regular Expression used in applyCORSRequest.]
     * @param  {[array]} matches [RegEx matches]
     * @return {[array]}         [list of URLs]
     * @example ['url(../images/a.png', 'url(../images/b.png']
     */
    function extractUniqueUrlsFromMatches(matches) {

      var urls = [],
        match,
        i,
        numMatches;

      if (!matches) {
        return urls;  // TODO does this case occur?
      }

      numMatches = matches.length;

      for (i = 0; i < numMatches; i ++) {

        match = matches[i].trim(); //Trim whitespace
        match = match.substr(4);   //remove url(

        if (match.charAt(0) === '\"') {              //If the URL is surrounded by a double quote
          match = match.substr(1);                   //remove the first
          match = match.substr(0, match.length - 1); //remove the last
        }

        match = match.trim(); //Trim whitespace

        if (match.charAt(0) === '\'') {              //If the URL is surrounded by a single quote
          match = match.substr(1);                   //remove the first
          match = match.substr(0, match.length - 1); //remove the last
        }

        match = match.trim(); //Trim whitespace

        if (urls.indexOf(match) === -1) { //Get rid of duplicates
          if (match.indexOf('?') !== -1) { //Escape the ?
            match = match.replace('?', '\\?');
          }
          urls.push(match);
        }
      }

      return urls;
    }

    /**
     * [applyCORSRequest Makes a xmlhttprequest for CSS resources.  Replaces all
     * relatively defined style resources with their absolute counterparts. See EQ-1302]
     * @param  {[xmlhttprequest Object]} request [description]
     */
    function getStyleSheetTextFromCORSRequest(request) {
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

       */
      var URL_REGEXP = /url(\(([\'\" ])*(?!data:|.*https?:\/\/)([^\"\'\)]+)[\'\" ]*)/g,
        relativeRegEx = new RegExp(URL_REGEXP),
        baseUrlObject = sitecues.parseUrl(request.url),
        newText       = request.responseText,
        matches       = extractUrlsForReplacing(extractUniqueUrlsFromMatches(newText.match(relativeRegEx))),
        matchNum;

      for (matchNum = 0; matchNum < matches.length; matchNum ++) {
        newText = newText.replace(new RegExp(matches[matchNum], 'g'), sitecues.resolveUrl(matches[matchNum], baseUrlObject));
      }

      return newText;
    }

    function init() {
      if (hasInitBeenRequested) {
        return;  // Only init once
      }


      hasInitBeenRequested = true;

      /*
        Basically, we will begin by creating a <style> containing rules found in SITECUES_CSS_DEFAULT.
        Then, grab any <style> that is not ours, and append our <style> with those contents.
        Then we grab any <link> href attributes and attempt to download them, if they are successfully
        downloaded, then we simply concatenate our <style> with the response text.
        At the end of each successful callback, we update our <style> to reflect the current level of zoom.
      */
      var linkedSheets = getAllLinkedStylesheets(),
        linkTagStylesList  = [],  // An ordered list of external stylesheet styles to be applied to the page.
        styleTags = getAllStyleTags();

      function onStylesRetrieved() {
        // Create the sitecues <style> element
        constructCombinedStyleSheet(linkTagStylesList, styleTags); // Builds the <style> tags

        setTimeout(function() {
          isInitComplete = true;
          combinedDOMStylesheetObject = styleService.getDOMStylesheet($combinedStylesheet);
          combinedDOMStylesheetObject.disabled = true; // Don't interfere with page
          sitecues.emit('style-service/ready');
        }, WAIT_BEFORE_INIT_STYLESHEET);
      }

      // Grab all the CSS content from <link> tags
      // This will initialize the composite stylesheet when finished and call style-service/ready
      if (! createCORSRequests(linkedSheets, linkTagStylesList, onStylesRetrieved)) {
        // No CORS requests, so begin initialization right away
        onStylesRetrieved();
      }
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
      if (!isInitComplete) {
        return [];
      }

      var rules = combinedDOMStylesheetObject.cssRules,
        rule,
        cssStyleDeclaration,
        ruleValue,
        ruleIndex = 0,
        styleResults = [],
        numRules = rules.length;

      for (; ruleIndex < numRules; ruleIndex ++) {
        rule = rules[ruleIndex];
        cssStyleDeclaration = rule.style;
        if (cssStyleDeclaration) { // Could be null if rule is CSSMediaRule
          ruleValue = cssStyleDeclaration[propertyName];
          if (matchValue ? (ruleValue === matchValue) : ruleValue) {
            styleResults.push({rule : rule, value : ruleValue });
          }
        }
      }
      return styleResults;
    };

    /**
     * Get the DOM object for the stylesheet that lets us traverse the style rules.
     * Annoying that we have to do this.
     * @param $stylesheet
     * @returns {*}
     */
    styleService.getDOMStylesheet = function($stylesheet) {
      var i = 0,
        numSheets = document.styleSheets.length;
      for (; i < numSheets; i ++ ) {
        if ($stylesheet.is(document.styleSheets[i].ownerNode)) {
          return document.styleSheets[i];
        }
      }
      SC_DEV && console.log('Could not find stylesheet');
      return [];
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

    sitecues.on('zoom', function (pageZoom) {
      if (pageZoom > 1) {
       init();
      }
    });
  });

  callback();
});
