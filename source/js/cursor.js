/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary; 
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor', function (cursor, callback, log) {

  sitecues.use('jquery', 'conf', 'cursor/custom', 'cursor/images/manager', function ($, conf, view, imagesManager) {

    //@param method GET, POST
    //@param url The stylesheet href attribute
    var stylesheetElement,
        stylesheetObject,
        lastZoom = conf.get('zoom'),
        lastZoomTimeout,
        DEFAULT_ZOOM_LEVEL = 1,
        DEFAULT_MIN_ZOOM_LEVEL = 1.1,
        DEFAULT_TYPE = 'default',
        SITECUES_CSS_ID = 'sitecues-css',
        SITECUES_CSS_DEFAULT = 
        '
          body {
            cursor: auto;
          }

          a {
            cursor: pointer;
          }

          button {
            cursor: pointer;
          }

          input[type="button"] {
            cursor: pointer
          }

          input[type="checkbox"] {
            cursor: pointer
          }

          input[type="email"] {
            cursor: text
          }

          input[type="image"] {
            cursor: pointer
          }

          input[type="radio"] {
            cursor: pointer
          }

          input[type="search"] {
            cursor: text
          }

          input[type="submit"] {
            cursor: pointer
          }

          input[type="text"] {
            cursor: text
          }

          label {
            cursor: pointer
          }

          p {
            cursor: text
          }

          select {
            cursor: pointer
          }

          textarea {
            cursor: text
          }

          .sitecues-badge {
            cursor: default
          }

          #sitecues-panel {
            cursor: default
          }

          #sitecues-panel .tts {
            cursor: pointer
          }

          #sitecues-close-button {
            cursor: pointer
          }                

          .dropdown-menu > .disabled > a:focus {
            cursor: default
          }

          .sitecues-slider {
            cursor: pointer
          }

          .sitecues-toolbar, .hori {
            cursor: default
          }

          .sitecues-slider-thumb {
            cursor: pointer;
          }

          .sitecues-toolbar .slider-wrap {
            cursor: pointer
          }
          
          .sitecues-toolbar .slider-wrap * {
            cursor: pointer
          }

          .sitecues-toolbar svg {
            cursor: pointer
          }

          .slider-wrap svg {
            cursor: pointer
          }
          
          .sitecues-toolbar .tts {
            cursor: pointer
          }

          .sitecues-toolbar.hori .dropdown-wrap .dropdown-menu > li > a {
            cursor: pointer
          }

          .sitecues-toolbar.hori .dropdown-toggle {
            cursor: pointer
          }

        ';

    function createCORSRequest(method, url) {
      //Credit to Nicholas Zakas 
      var xhr = new XMLHttpRequest();
      
      if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        xhr = null;
      }
      return xhr;
    }

    cursor.getStylesheets = function () {
      
      var stylesheets = [],
          linkTags = document.getElementsByTagName('link');

      for(var i = 0; i < linkTags.length; i += 1) {
        if (linkTags[i].href.indexOf('.css') !== -1) {
          stylesheets.push(linkTags[i].href);
        }
      }
      
      return stylesheets;
    
    };

    cursor.getDomainStylesheets = function () {
      
      var stylesheets = cursor.getStylesheets(),
          domainStyleSheets = [];

      for(var i = 0; i < stylesheets.length; i += 1) {
        if (stylesheets[i].indexOf(document.location.host) !== -1) {
          domainStyleSheets.push(stylesheets[i]);
        }
      }

      return domainStyleSheets;

    };

    cursor.createCORSRequest = function (method, url, callback) {
      
      var request = createCORSRequest(method, url);
      
      request.url = url;

      if (!request) {
        throw new Error('CORS not supported');
      }
      
      request.onload = function () {
        callback(request);
      };
      
      request.onerror = function () {
        //console.log('%c CORS request for ' + request.url + ' failed', 'color:red;background:#ccc');
        //throw new Error('Error making the CORS request');
      }

      request.send();

    };

    /*
      @param style - String specifying what style we are interested in
      @param callback - Function that gets passed ...
    */
    cursor.changeStyle = function (style, callback) {
      var rule;
      if (stylesheetObject) {
        for(var i = 0, rules = stylesheetObject.cssRules; i < rules.length; i += 1) {
          rule = rules[i].style;
          if (rule[style].length) {
            //@param rule an object representing some css selector + properties
            //@param style is the key for accessing property information
            if (callback) {
              callback(rule, style);
            }
          }
        }
        if (lastZoom < DEFAULT_MIN_ZOOM_LEVEL) {
          //if the current zoom level is less than the minimum needed to enable custom cursors...
          stylesheetObject.disabled = true;
        } else {
          stylesheetObject.disabled = false;
        }
      }
    };
    
    var createStyleSheet = (function () {

      var cursorTypes = ['auto', 'crosshair', 'default', 'help', 'pointer', 'text'];
      
      return function () {
      
        var cursorTypeURLS = [];
        //generate cursor images for every cursor type...      
        for(var i = 0; i < cursorTypes.length; i += 1) {
          cursorTypeURLS[cursorTypes[i]] = cursor.generateCursorStyle(cursorTypes[i], lastZoom);
        }
        
        cursor.changeStyle('cursor', function (rule, style) {
        //find the cursor type (auto, crosshair, etc) and replace the style with our generated image  
          for (var i = 0; i < cursorTypes.length; i += 1) {
            if (rule[style].indexOf(cursorTypes[i]) > -1) {
              rule[style] = cursorTypeURLS[cursorTypes[i]];
            } 
          }        
        });
        
      }

    }());
    
    cursor.generateCursorStyle = function (type, zoom) {
      return 'url(' + view.getImage(type, zoom) + ') ' + getCursorHotspotOffset(type, zoom) + ', ' + type;
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
         'min': DEFAULT_ZOOM_LEVEL,
         'current': zl || conf.get('zoom') || DEFAULT_ZOOM_LEVEL,
       };
       
       zoom.diff = zoom.current - zoom.min;
       
       var offset = imagesManager.offsets[type || DEFAULT_TYPE];
       
       var result = '';
       
       if (offset) {
          switch (type) {
           case 'auto':
           case 'default':
             result = offset.x + ' ' + Math.round(offset.y + offset.step * zoom.diff);
             break
           case 'pointer':
             result = Math.round(offset.x + offset.step * zoom.diff) + ' ' + Math.round(offset.y + (offset.step / 2) * zoom.diff);
             break;
           default:
             break;
         }
       }
       return result;
    }    
    
    (function () {  //initializer
      /*
        Basically, we will begin by creating a <style> containing rules found in SITECUES_CSS_DEFAULT.
        Then, grab any <style> that is not ours, and append our <style> with those contents.
        Then we grab any <link> href attributes and attempt to download them, if they are successfully
        downloaded, then we simply concatenate our <style> with the response text.
        At the end of each successful callback, we update our <style> to reflect the current level of zoom.
      */
      var validSheets = cursor.getStylesheets(),
          styleTags = document.getElementsByTagName('style'),
          sheet = document.createElement('style');
      
      sheet.innerHTML = SITECUES_CSS_DEFAULT;
      sheet.id        = SITECUES_CSS_ID;
      
      document.head.appendChild(sheet);
      
      stylesheetElement = document.getElementById(SITECUES_CSS_ID);

      for(var k = 0; k < styleTags.length; k += 1) {
        if (styleTags[k].id !== SITECUES_CSS_ID) {
          stylesheetElement.innerHTML += styleTags[k].innerHTML;
        }
      }

      for(var i = 0; i < validSheets.length; i += 1) {

        cursor.createCORSRequest('GET', validSheets[i], function (request) {
          console.log('%c CORS Successful for ' + request.url, 'color:green;background:#ccc');
          stylesheetElement.innerHTML += request.responseText;
          stylesheetObject = (function () {
            for (var i = 0; i < document.styleSheets.length; i += 1) {
              if (document.styleSheets[i].ownerNode.id === SITECUES_CSS_ID) {
                return document.styleSheets[i];
              }
            }
          }());
          lastZoom = conf.get('zoom');
          createStyleSheet();
        });

      } 
       
      setTimeout(function () {
        //Hmm, interesting that I needed to do this...
        stylesheetObject = (function () {
          for (var i = 0; i < document.styleSheets.length; i += 1) {
            if (document.styleSheets[i].ownerNode.id === SITECUES_CSS_ID) {
              return document.styleSheets[i];
            }
          }
        }());
        lastZoom = conf.get('zoom');
        createStyleSheet();
      }, 1);

    }());
    
    sitecues.on('zoom', function (zoom) {
      if (lastZoom !== zoom) {
        lastZoom = zoom;
        clearTimeout(lastZoomTimeout);
        lastZoomTimeout = setTimeout(createStyleSheet, 10);
      }
    })

    callback();
  
  });
});