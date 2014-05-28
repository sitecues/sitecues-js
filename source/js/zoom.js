sitecues.def('zoom', function (zoom, callback) {
 
  'use strict';

  // Values used for zoom math
  zoom.max = 3;
  zoom.min = 1;
  zoom.step = 0.1;
  zoom.defaultLevel = 1;
  zoom.precision = 0.1;

  // Calculate the zoom range. This calc is used throughout library. Easier to do here only.
  zoom.range = zoom.max - zoom.min;

  // Save this value to reduce the width of the <html> when zooming
  var originalDocumentWidth = getDocumentWidth();

  function getDocumentWidth() {
    // We used to use document.documentElement.clientWidth, but this caused the page
    // to continually shrink on resize events.
    // Check out some different methods for determining viewport size: http://ryanve.com/lab/dimensions/
    // More information on document.documentElement.clientWidth and browser viewports: http://www.quirksmode.org/mobile/viewports.html
    return window.outerWidth;
  }

  // get dependencies
  sitecues.use('jquery', 'conf', 'util/common', 'platform', function ($, conf, common, platform) {
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
    * [Window resizing will change the size of the viewport. In the zoom function we use the original size of the
    * viewport to properly resize the html elements' width.  We must also re-zoom the page as it handles the logic
    * to properly scale, resize, and position the page and its' elements.]
    */
    $(window).resize(function () {
      var zoom = conf.get('zoom');
      originalDocumentWidth = getDocumentWidth();
      adjustPageStyleForZoomAndWidth(zoom);  // Do not emit zoom event here since zoom is not changing
      sitecues.emit('resize');
    });

    /**
    * [
    * The width of the html element should always match the width of the viewport.
    * document.documentElement.clientWidth reports the *viewport* dimensions (regardless of the <html> dimensions)
    * in CSS pixels and is cross-browser compatible.  Does not factor in the scrollbar dimensions.
    * ]
    * 
    */
    function zoomFn(currZoom) {
      adjustPageStyleForZoomAndWidth(currZoom);
      sitecues.emit('zoom', currZoom);   // notify all about zoom change
    }

    function adjustPageStyleForZoomAndWidth(currZoom) {
      if (currZoom === 1) {
        // Clear all CSS values
        $('html').css({ width: '', transform: '', transformOrigin: '' });
      }
      else {
        var newBodyWidth = Math.round(originalDocumentWidth / currZoom);

        $('html').css({width: newBodyWidth + 'px',
          transformOrigin: '0% 0%', // By default the origin for the body is 50%, setting to 0% zooms the page from the top left.
          transform: 'scale(' + currZoom + ')'
        });
      }
    }

    // Get and set are now in 'source/js/conf/user/manager.js'
    conf.get('zoom', zoomFn);  //This use to be an anonymous function,
                               //but we must force a zoom if the browser window is resized

    // done
    callback();

  });

});