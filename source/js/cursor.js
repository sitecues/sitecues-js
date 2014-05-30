/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary; 
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor', function (cursor, callback) {

  'use strict';
  
  sitecues.use('jquery', 'conf', 'cursor/custom', 'cursor/images/manager', 'platform', function ($, conf, view, imagesManager, platform) {

    var stylesheetElement,
        stylesheetObject,
        lastZoom = conf.get('zoom'),
        lastZoomTimeout,
        styleTagStylesList = [], //An ordered list of style tag styles to be applied to the page
        linkTagStylesList  = []; //An ordered list of external stylesheet styles to be applied to the page.
    
    cursor.CONTANTS = {
      'DEFAULT_ZOOM_LEVEL'     : 1,
      'DEFAULT_MIN_ZOOM_LEVEL' : 1.1,
      'DEFAULT_TYPE'           : 'default',
      'SITECUES_CSS_ID'        : 'sitecues-css',
      'SITECUES_CSS_DEFAULT'   :         
        '* {cursor:auto}\n' +
        'input[type="submit"], input[type="radio"], input[type="button"], input[type="checkbox"], input[type="image"], select, label, a *, a, a:link, a:hover, iframe a, button {cursor:pointer}\n' +
        'input[type="text"], input[type="email"], input[type="search"] {cursor:text}\n' +
        'p, textarea {cursor:text}\n' +
        '#sitecues-panel, .sitecues-badge {cursor:default}\n' +
        '#sitecues-panel .tts {cursor:pointer}\n' +
        '#sitecues-close-button {cursor:pointer}\n' +                
        '.dropdown-menu > .disabled > a:focus {cursor:default}\n' +
        '.sitecues-slider {cursor:pointer}\n' +
        '.sitecues-toolbar, .hori {cursor:default}\n' +
        '.sitecues-slider-thumb {cursor:pointer}\n' +
        '.sitecues-toolbar .slider-wrap * {cursor:pointer}\n' +
        '.sitecues-toolbar svg * {cursor:pointer}\n' +
        '.slider-wrap svg * {cursor:pointer}\n' +
        '.sitecues-toolbar .tts {cursor:pointer}\n' +
        '.sitecues-toolbar.hori .dropdown-wrap .dropdown-menu > li > a {cursor:pointer}\n' +
        '.sitecues-toolbar.hori .dropdown-toggle {cursor:pointer}\n'
    };
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
     * [Creates an array of all <link> href attribute values]
     * @return {[array]}
     */
    function getStylesheets () {
      
      var stylesheets = [],
          linkTags = document.getElementsByTagName('link');

      for(var i = 0; i < linkTags.length; i += 1) {
        if (linkTags[i].href.indexOf('.css') !== -1 &&    //Make sure it is actually a CSS file
          !linkTags[i].media &&                           //Ignore all CSS with a media attribute. (print)
          linkTags[i].href.indexOf('sitecues-') === -1 && //Ignore sitecues CSS
          linkTags[i].rel !== 'alternate stylesheet') {   //Ignore alternate stylesheets
          stylesheets.push(linkTags[i].href);
        }
      }
      
      return stylesheets;
    
    }
    /**
     * [constructStyleTag builds a <style> tag, maintaining the sites original precedence for styles]
     */
    function constructStyleTag () {
      var i;
      for (i = 0; i < linkTagStylesList.length; i += 1) {
        if (linkTagStylesList[i]) {
          stylesheetElement.innerHTML += linkTagStylesList[i]; 
        }
      }
      for (i = 0; i < styleTagStylesList.length; i += 1) {
        if (styleTagStylesList[i]) {
          stylesheetElement.innerHTML += styleTagStylesList[i];
        }
      }
    }
    /**
     * [Abstracts away creating XMLHTTPRequests that support the
     * Origin HTTP Header, and also sets up the callback when the 
     * response returns]
     * @param  {[string]}   method
     * @param  {[string]}   url
     * @param  {Function} callback
     * @return {[undefined]}
     */
    function createCORSRequest (method, url, callback) {
      
      var request = createRequest(method, url);
      
      request.url = url;

      if (!request) {
        throw new Error('CORS not supported');
      }
      //Only execute the callback if the response status is 200
      request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
          callback(request);
        }
      };

      request.send();

    }

    /**
     * [This function allows the targeting of styles, such as "cursor", and invokes a callback
     * that gets passed the style and the rule associated with it for any CSS selector]
     * @param  {[string]}   propertyName
     * @param  {[string]}   matchValue, optional value to match, null to match anything
     * @param  {Function} callback
     */
    cursor.getStyles = function(propertyName, matchValue, callback) {
      var rules, rule, cssStyleDeclaration, ruleValue, i;

      if (!stylesheetObject || !callback) {
        return;
      }

      for (i = 0, rules = stylesheetObject.cssRules; i < rules.length; i++) {
        rule = rules[i];
        cssStyleDeclaration = rule.style;
        if (cssStyleDeclaration) { // Could be null if rule is CSSMediaRule
          ruleValue = cssStyleDeclaration[propertyName];
          if (matchValue ? (ruleValue === matchValue) : (ruleValue !== null)) {
            /**@param rule an object representing some css selector + properties
             * @param style is the key for accessing property information
             */
            callback(rule, ruleValue);
          }
        }
      }
    };

    /**
     * [Returns a function that, when executed, generates a CSS cursor property for every supported
     * cursor type and then changes all cursor properties in a <style> that we create for the current
     * zoom level]
     * @return {[function]}
     */
    var createStyleSheet = (function () {

      var cursorTypes = ['auto', 'crosshair', 'default', 'help', 'pointer', 'text'];

      return function () {

        var cursorTypeURLS = [];
        //generate cursor images for every cursor type...      
        for(var i = 0; i < cursorTypes.length; i += 1) {

          // Use 2x pixel cursor if the browser's pixel ratio is higher than 1 and the 
          // platform.browser supports css cursor scaling
          if (platform.pixel.ratio > 1 && platform.pixel.cssCursorScaleSupport[platform.browser.is]) {
            cursorTypeURLS[cursorTypes[i]] = generateCursorStyle2x(cursorTypes[i], lastZoom);
          // For all other ratios/un-supported browsers, use a 1x ratio cursor
          } else {
            cursorTypeURLS[cursorTypes[i]] = generateCursorStyle1x(cursorTypes[i], lastZoom);
          }

        }

        if (stylesheetObject) {
          // TODO we need a better setup/shutdown function for this entire module that lazily instantiates and cleans up after itself
          // We shouldn't run this code at all unless the user zooms
          stylesheetObject.disabled = lastZoom < cursor.CONTANTS.DEFAULT_MIN_ZOOM_LEVEL;
        }

        cursor.getStyles('cursor', null, function (rule, value) {
        //find the cursor type (auto, crosshair, etc) and replace the style with our generated image
          for (var i = 0; i < cursorTypes.length; i += 1) {
            if (value.indexOf(cursorTypes[i]) > -1) {
              //rule[style] = cursorTypeURLS[cursorTypes[i]]; !important doesnt work here...
              var cursorValueURL = cursorTypeURLS[cursorTypes[i]];
              try {
                if (platform.browser.is === 'IE') {
                    //var cursorValueURL = 'http://js.dev.sitecues.com/l/s;id=s-00000005/v/dev/latest/images/cursors/win_default_1.1.cur';

                        $.ajax({
                        url: cursorValueURL,
                        crossDomain: true,
                        beforeSend: function(xhrObj){
                           xhrObj.setRequestHeader("Accept", "application/octet-stream");
                        },
                        type: "GET",
                        async: true,
                        cache: true,
                        success: function(data, status, xhr) {
                            console.log('Loading of CUR file completed!');
//                            $('<div>').attr('id', 'test-3').css({'width': '100px', 'height': '100px', 'background-color': 'yellow'}).insertBefore('body');
//                            $('#test-3').css({'background-image': 'url(' + cursorValueURL + ')'});
//                            
                            var p = $('<p>', {'id': 'test2'});

                            p.css({
                                'width': '100px', 'height': '100px', 'background-color': 'yellow',
                                'position': 'absolute', 'right': '0px',
                                'background':'url(http://www.google.com/images/srpr/logo11w.png)',
                                'cursor': 'url(win_default_2.0.cur), pointer'
                            });
                        },
                        error: function() {
                            console.log("Unable to fetch cursor image from server");
                        }
                      });
                } else {
                    rule.style.setProperty('cursor', cursorValueURL, 'important');
                }
              } catch (e) {
                try {
                  rule.style.cursor = cursorValueURL;
                } catch (ex) {
                    console.log(ex);
                }
              }
            } 
          }        
        });
      
      };

    }());
    
    /**
     * [Generates the cursor url for a given type and zoom level for non retina displays]
     * @param  {[string]} type
     * @param  {[number]} zoom
     * @return {[string]}
     */
    function generateCursorStyle1x (type, zoom) {
      var hotspotOffset;
      
      if (platform.browser.is !== 'IE') {
        hotspotOffset = ' ' + getCursorHotspotOffset(type, zoom) + '';
        return 'url(' + view.getImage(type,zoom) + ')' + ( hotspotOffset?hotspotOffset:'' ) + ', ' + type;
      } else {
        return view.getImage(type,zoom);
      }

      
    }

    /**
     * [Generates the cursor url for a given type and zoom level for retina displays]
     * @param  {[string]} type
     * @param  {[number]} zoom
     * @return {[string]}
     */
    function generateCursorStyle2x (type, zoom) {
      var hotspotOffset;
      
      if (platform.browser.is !== 'IE') {
        hotspotOffset = ' ' + getCursorHotspotOffset(type, zoom) + '';
      }

      var image = view.getImage(type,zoom);
      // image-set() will not fallback to just the first url in older browsers. So...
      // todo: provide fallback for older browsers.
      var cursorStyle = '-webkit-image-set(' +
         '    url(' + image + ') 1x,' +
         '    url(' + image + ') 2x'  +
         ') ' +(hotspotOffset?hotspotOffset:'')+ ', ' + type;

      return cursorStyle;
    }

    /**
     * [Sets the stylesheetObject variable to the stylesheet interface the DOM provieds, 
     * then sets the zoom, and updates our styles for cursors]
     */
    function setStyleSheetObject () {
      stylesheetObject = (function () {
        for (var i = 0; i < document.styleSheets.length; i += 1) {
          if (document.styleSheets[i].ownerNode && document.styleSheets[i].ownerNode.id === cursor.CONTANTS.SITECUES_CSS_ID) {
            return document.styleSheets[i];
          }
        }
      }());
      lastZoom = conf.get('zoom');
      createStyleSheet();
      sitecues.emit('cursor/addingStyles');
    }

    // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
    // The maths below based on experience and doesn't use any kind of specific logic.
    // We are liely to change it better one when we have final images.
    // There's no need for specific approach while we constantly change images and code.
    /**
     * Gets custom cursor's hotspot offset.
     * @param zl Number or string, represents zoom level.
     * @return result A string in format 'x y' which is later used a part of cursor property value.
     */
    function getCursorHotspotOffset(type, zl) {
       
      var zoom = {
        'min': cursor.CONTANTS.DEFAULT_ZOOM_LEVEL,
        'current': zl || conf.get('zoom') || cursor.CONTANTS.DEFAULT_ZOOM_LEVEL
      },

      offset,
      result;
       
      zoom.diff = zoom.current - zoom.min;
       
      offset = imagesManager.offsets[type || cursor.CONTANTS.DEFAULT_TYPE];
       
      result = '';
       
      if (offset) {
        switch (type) {
        case 'auto':
        case 'default':
          result = offset.x + ' ' + Math.round(offset.y + offset.step * zoom.diff);
          break;
        case 'pointer':
          result = Math.round(offset.x + offset.step * zoom.diff) + ' ' + Math.round(offset.y + (offset.step / 2) * zoom.diff);
          break;
        default:
          break;
        }
      }
      return result;
    }    
    /**
     * [Initializes our module by getting all <style> and <link> tags, and concatenates their styles
     * to a <style> we create.  It then will update all cursor styles within that tag]
     * @return {[undefined]}
     */
    (function () {  //initializer
      /*
        Basically, we will begin by creating a <style> containing rules found in SITECUES_CSS_DEFAULT.
        Then, grab any <style> that is not ours, and append our <style> with those contents.
        Then we grab any <link> href attributes and attempt to download them, if they are successfully
        downloaded, then we simply concatenate our <style> with the response text.
        At the end of each successful callback, we update our <style> to reflect the current level of zoom.
      */
      var validSheets = getStylesheets(),
          
          styleTags = (function () {
          
            var allStyleTags   = document.getElementsByTagName('style'),
                validStyleTags = [];
          
            for (var i = 0; i < allStyleTags.length; i += 1) {
              if (!allStyleTags[i].id || allStyleTags[i].id.indexOf('sitecues') === -1) {
                validStyleTags.push(allStyleTags[i]);
              }
            }
            
            return validStyleTags;
          
          }()),
          
          sheet = document.createElement('style');
      
      sheet.innerHTML = cursor.CONTANTS.SITECUES_CSS_DEFAULT;
      sheet.id        = cursor.CONTANTS.SITECUES_CSS_ID;
      
      document.head.appendChild(sheet);
      
      stylesheetElement = document.getElementById(cursor.CONTANTS.SITECUES_CSS_ID);

      for(var k = 0; k < styleTags.length; k += 1) {
        if (styleTags[k].id !== cursor.CONTANTS.SITECUES_CSS_ID) {
          styleTagStylesList.push(styleTags[k].innerHTML);
        }
      }
      /**
       * [extractUrlsForReplacing removes the redundancy in the array of URLs]
       * @param  {[array]} matches [URLs extracted from response text]
       * @return {[array]}         [URLs extracted from response text minus the redundancy]
       * @example ['../a/b/styles.css','../a/b/styles.css?#iefix'] => ['../a/b/styles.css']
       * Above is an example of a redundancy that needs to be addressed before we globally
       * do a replacement.
       */
      function extractUrlsForReplacing (matches) {

        var i = 0,
            j,
            match_i,
            len = matches.length;
        
        for (; i < len; i += 1) {
          match_i = matches[i];
          for (j = 0; j < len; j += 1) {
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
      function extractUniqueUrlsFromMatches (matches) {

        var urls = [],
            match;

        if (!matches || !matches.length) {
          return urls;
        }

        for (var i = 0; i < matches.length; i += 1) {

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
      function applyCORSRequest (request) {
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
        var relativeRegEx = new RegExp(/url(\((['\" ])*(?!data:|.*https?:\/\/)([^\"'\)]+)['\" ]*)/g),
            baseUrlObject = sitecues.parseUrl(request.url),
            newText       = request.responseText,
            matches       = extractUrlsForReplacing(extractUniqueUrlsFromMatches(newText.match(relativeRegEx)));

        for (var i = 0; i < matches.length; i += 1) {
          newText = newText.replace(new RegExp(matches[i], 'g'), sitecues.resolveUrl(matches[i], baseUrlObject));
        }

        linkTagStylesList[validSheets.indexOf(request.url)] = newText;

        constructStyleTag(); //Builds the <style> tags and <link> tags
      
        setTimeout(setStyleSheetObject, 50);
      
      }

      for(var i = 0; i < validSheets.length; i += 1) {
        createCORSRequest('GET', validSheets[i], applyCORSRequest);
      } 
      
      constructStyleTag(); //Builds the <style> tags

      setTimeout(setStyleSheetObject, 50);

    }());

    sitecues.on('zoom', function (zoom) {
      if (lastZoom !== zoom) {
        lastZoom = zoom;
        clearTimeout(lastZoomTimeout);
        lastZoomTimeout = setTimeout(createStyleSheet, 10);
      }
    });

    // if (sitecues.tdd) {
    //   exports.cursor = {
    //     "stylesheetObject": stylesheetObject,
    //     "createStyleSheet": createStyleSheet,
    //     "generateCursorStyle1x": generateCursorStyle1x,
    //     "generateCursorStyle2x": generateCursorStyle2x
    //   };
    // }

    callback();
  
  });
});