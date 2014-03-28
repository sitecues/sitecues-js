sitecues.def('zoom', function (zoom, callback, log) {
 
  'use strict';

  // Values used for zoom math
  zoom.max = 3;
  zoom.min = 1;
  zoom.step = 0.1;
  zoom.defaultLevel = 1;
  zoom.precision = 0.1;


  zoom.toolbarWidth = 0;

  // Calculate the zoom range. This calc is used throughout library. Easier to do here only.
  zoom.range = zoom.max - zoom.min;
  zoom.documentHasScrollbar = false;
  zoom.badgeBoundingBox;
  zoom.panelBoundingBox;
  zoom.lastScroll;
  zoom.originalDocumentWidth = document.documentElement.clientWidth; //Save this value to reduce the width of the <html> when zooming;
  zoom.resizing = false;

  // get dependencies
  sitecues.use('jquery', 'conf', 'util/common', 'platform', function ($, conf, common, platform) {
    
    zoom.lastScroll = [window.pageXOffset/conf.get('zoom'), window.pageYOffset/conf.get('zoom')];
    
    // Handle the appearing/dissapearing vertical scrollbar in document (changes document width)
    zoom.checkForScrollbar = function () {

      var scrollbarWidth = window.innerHeight - document.documentElement.clientHeight || 15;
      // Check whether a scrollbar has appeared in the document now zoom has changed
      // #1 - Body has a scrollbar
      if (common.bodyHasVertScrollbar()) {
        // If scrollbar was not present during last resize...
        if (zoom.documentHasScrollbar === false) {
          // Set the zoom scrollbar boolean ready for next resize check
          zoom.documentHasScrollbar = true;
          // Emit the scrollbar show event to subscribers as the doc now has scrollbar
          sitecues.emit('zoom/documentScrollbarShow', scrollbarWidth);
        }
        return;
      }
      // #2 - Body doesn't have a scrollbar
      // If scrollbar was present during last resize...
      if (zoom.documentHasScrollbar === true) {
        // Emit the scrollbar hide event to subscribers as the doc scrollbar is gone
        sitecues.emit('zoom/documentScrollbarHide', scrollbarWidth);
        // Set the zoom scrollbar boolean ready for next resize check
        zoom.documentHasScrollbar = false;
      }
    };
    // use conf module for sharing
    // current zoom level value
    conf.def('zoom', function (value) {

      value = parseFloat(value);

      // value is too small
      if (value < zoom.min){
        return zoom.min;
      }

      // value is too big
      if (value > zoom.max){
        return zoom.max;
      }

      // use precision to get right value
      value = (value / zoom.precision) * zoom.precision;

      // value have float value
      return value.toFixed(1);
    });

    // define default value for zoom if needed
    if (!conf.get('zoom')) {
      conf.set('zoom', zoom.defaultLevel);
    }

    // handle zoom/increase event fired by any module
    sitecues.on('zoom/increase', function() {
      conf.set('zoom', conf.get('zoom') + zoom.step);
    });

    // handle zoom/decrease event fired by any module
    sitecues.on('zoom/decrease', function() {
      conf.set('zoom', conf.get('zoom') - zoom.step);
    });
      /**
     * [renderPage purpose is to render text clearly in browsers (chrome mac only (for now))
     * that do not repaint the DOM when using CSS Transforms.  This function simply sets a 
     * property, which is hopefully not set on pages sitecues runs on, that forces repaint.
     * 50ms of time is required, in my opinion, because the browser may not be done Transforming
     * by the time Javascript is executed without the setTimeout.
     *  
     * See here: https://equinox.atlassian.net/wiki/display/EN/Known+Issues
     *
     * Note: This problem is not consistent across websites.  This function is in response to 
     * behavior experienced on www.nytimes.com]
     * 
     */
    var renderPage = function () {
      setTimeout(function() {
        document.body.style.webkitBackfaceVisibility = '';
        setTimeout(function() {
          document.body.style.webkitBackfaceVisibility = 'hidden'; 
        }, 5);
      }, 5);      
    }
    /**
    * [Window resizing will change the size of the viewport. In the zoom function we use the original size of the
    * viewport to properly resize the html elements' width.  We must also re-zoom the page as it handles the logic
    * to properly scale, resize, and position the page and its' elements.]
    */
    $(window).resize(function () {
      zoom.resizing = true;
      zoom.originalDocumentWidth = document.documentElement.clientWidth;
      zoomFn(conf.get('zoom'));
      zoom.resizing = false;
      sitecues.emit('resize');
    });  
    /**
     * [Scrolling the page requires positioning any fixed elements.  We also cache the scroll offsets after
     * all scroll event callbacks have been executed.]
     * @param  {[object]} e [jquery event object]
     */
    $(window).scroll(function (e) {
      sitecues.emit('scroll', e);
      zoom.lastScroll = [window.pageXOffset/conf.get('zoom'), window.pageYOffset/conf.get('zoom')];
    });
    
    /**
    * [
    * The width of the html element should always match the width of the viewport.
    * document.documentElement.clientWidth reports the *viewport* dimensions (regardless of the <html> dimensions)
    * in CSS pixels and is cross-browser compatible.  Does not factor in the scrollbar dimensions.
    * ]
    * 
    */
    var zoomFn = function (value) {

      var newBodyWidth = Math.round(zoom.originalDocumentWidth/value);
      
      $('html').css({'width'             : newBodyWidth + 'px',
                     'transform-origin'  : '0% 0%', // By default the origin for the body is 50%, setting to 0% zooms the page from the top left.
                     'transform'         : 'scale('+value+')',
                    }); 
      
      // Un-Blur text in Chrome
      if (platform.browser.isChrome && platform.os.isMac) {
        renderPage();
      }

      // Do we need this line below as this may be calculated elswhere?
      zoom.lastScroll = [window.pageXOffset/conf.get('zoom'), window.pageYOffset/conf.get('zoom')];
      
      zoom.checkForScrollbar();


      // notify all about zoom change
      sitecues.emit('zoom', value);
      // notify all about zoom change
      
    };

    // Get and set are now in 'source/js/conf/user/manager.js'
    conf.get('zoom', zoomFn);  //This use to be an anonymous function, 
                               //but we must force a zoom if the browser window is resized
                               //      
    // done
    callback();

  });

});