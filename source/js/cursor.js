/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary; 
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor', function (cursor, callback, log) {

  'use strict';
  
  sitecues.use('jquery', 'conf', 'cursor/custom', 'cursor/images/manager', 'platform', function ($, conf, view, imagesManager, platform) {

    var stylesheetElement,
        stylesheetObject,
        lastZoom = conf.get('zoom'),
        lastZoomTimeout;
    
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
        //might be redundant to check if it has a .css extension...
        //for now we don't want to include media dependent css files...
        if (linkTags[i].href.indexOf('.css') !== -1 &&
            !linkTags[i].media && 
            linkTags[i].href.indexOf('sitecues') === -1 && 
            linkTags[i].href.indexOf('localhost') === -1) {
          stylesheets.push(linkTags[i].href);
        }
      }
      
      return stylesheets;
    
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
      
      request.onload = function () {
        callback(request);
      };

      request.send();

    }
    /**
     * [This function allows the targeting of styles, such as "cursor", and invokes a callback
     * that gets passed the style and the rule associated with it for any CSS selector]
     * @param  {[string]}   style
     * @param  {Function} callback
     * @return {[undefined]}
     */
    function changeStyle (style, callback) {
      var rule;
      if (stylesheetObject) {
        for(var i = 0, rules = stylesheetObject.cssRules; i < rules.length; i += 1) {
          rule = rules[i].style;
          if (rule && rule[style] && rule[style].length) {
            /**@param rule an object representing some css selector + properties
             * @param style is the key for accessing property information
             */
            if (callback) {
              callback(rule, style);
            }
          }
        }
        if (lastZoom < cursor.CONTANTS.DEFAULT_MIN_ZOOM_LEVEL) {
          //if the current zoom level is less than the minimum needed to enable custom cursors, disable the <style>
          stylesheetObject.disabled = true;
        } else {
          //otherwise enable it
          stylesheetObject.disabled = false;
        }
      }
    }
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
          
          if (platform.pixel.ratio > 1 && platform.pixel.support[platform.browser.is]) {
            cursorTypeURLS[cursorTypes[i]] = cursor.generateCursorStyle2x(cursorTypes[i], lastZoom);
          } else {
            cursorTypeURLS[cursorTypes[i]] = cursor.generateCursorStyle1x(cursorTypes[i], lastZoom);
          }

        }
        
        changeStyle('cursor', function (rule, style) {
        //find the cursor type (auto, crosshair, etc) and replace the style with our generated image 
          for (var i = 0; i < cursorTypes.length; i += 1) {
            if (rule && rule[style].indexOf(cursorTypes[i]) > -1) {
              //rule[style] = cursorTypeURLS[cursorTypes[i]]; !important doesnt work here...
              try {
                rule.setProperty(style, cursorTypeURLS[cursorTypes[i]], 'important');
              } catch (e) {
                try {
                  rule[style] = cursorTypeURLS[cursorTypes[i]];
                } catch (e) {
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
    cursor.generateCursorStyle1x = function (type, zoom) {
      var hotspotOffset;
      
      if (platform.browser.is!=='IE') {
        hotspotOffset = ' ' + getCursorHotspotOffset(type, zoom) + '';
      }
      
      return 'url(' +view.getImage(type,zoom)+ ')'+(hotspotOffset?hotspotOffset:'')+', ' + type;
    };

    /**
     * [Generates the cursor url for a given type and zoom level for retina displays]
     * @param  {[string]} type
     * @param  {[number]} zoom
     * @return {[string]}
     */
    cursor.generateCursorStyle2x = function (type, zoom) {
      var cursorStyle = '-webkit-image-set(' +
         '    url(' +view.getImage(type,zoom)+ ') 1x,' +
         '    url(' +view.getImage(type,zoom)+ ') 2x'  +
         '), ' + type;
      return cursorStyle;
    };

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
        'current': zl || conf.get('zoom') || cursor.CONTANTS.DEFAULT_ZOOM_LEVEL,
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
          styleTags = document.getElementsByTagName('style'),
          sheet = document.createElement('style');
      
      sheet.innerHTML = cursor.CONTANTS.SITECUES_CSS_DEFAULT;
      sheet.id        = cursor.CONTANTS.SITECUES_CSS_ID;
      
      document.head.appendChild(sheet);
      
      stylesheetElement = document.getElementById(cursor.CONTANTS.SITECUES_CSS_ID);

      for(var k = 0; k < styleTags.length; k += 1) {
        if (styleTags[k].id !== cursor.CONTANTS.SITECUES_CSS_ID) {
          stylesheetElement.innerHTML += styleTags[k].innerHTML;
        }
      }

      function applyCORSRequest (request) {
        stylesheetElement.innerHTML += request.responseText;
        setTimeout(setStyleSheetObject, 1);
      }

      for(var i = 0; i < validSheets.length; i += 1) {
        createCORSRequest('GET', validSheets[i], applyCORSRequest);
      } 
       
      setTimeout(setStyleSheetObject, 1);

    }());
    
    sitecues.on('zoom', function (zoom) {
      if (lastZoom !== zoom) {
        lastZoom = zoom;
        clearTimeout(lastZoomTimeout);
        lastZoomTimeout = setTimeout(createStyleSheet, 10);
      }
    });

    callback();
  
  });
});