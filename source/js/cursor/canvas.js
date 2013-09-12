// canvas view for cursor
sitecues.def('cursor/canvas', function(cursor, callback, log) {

  // private variables
  var data, types, paint, minSize = 20, step = 15;

  // cursor image data
  data = {
    color: 'white',
    stroke: 'black',
    shadow: '#000',
    size: minSize
  }

  // cursor types
  types = {
    'default': 'A',
    'pointer': 'B',
    'default_2': 'C',
    'pointer_2': 'D'

  }

  // get dependencies
  sitecues.use('jquery', 'load', 'ui', function($, load) {

    // private variables
    var wait, images;


    paint = function(type) {
      var canvas = document.createElement('canvas'),
              span = document.createElement('span'),
              divHolder = document.createElement('div'),
              body = document.body,
              spanWidth, spanHeight,
              text = types[type] || types['default'];

      span.innerHTML = text;
      $(span).style('font-size', data.size + 'px', 'important');
      $(divHolder).style('font-family', 'sitecues-cursor', 'important')[0].appendChild(span);
      body.appendChild(divHolder);

      // span width and height
      spanWidth = span.offsetWidth;
      spanHeight = span.offsetHeight;
      body.removeChild(divHolder);

      if (canvas && canvas.getContext) {

        var ctx = canvas.getContext('2d'),
                lineWidth = 20,
                shadowBlur = 10,
                size = data.size,
                canvasWidth, canvasHeight;

        if (data.size < 90) {
          lineWidth = 1;
          shadowBlur = 5;
        }

        canvasWidth = spanWidth + 2 * lineWidth + shadowBlur;
        canvasHeight = spanHeight + 2 * lineWidth + shadowBlur;

        // set main canvas element width and height
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // set necessary cursor settings
        ctx.textBaseline = 'top';
        ctx.font = size + 'px sitecues-cursor';
        ctx.lineWidth = lineWidth;

        // cursor color settings
        ctx.fillStyle = data.color;
        ctx.strokeStyle = data.stroke;

        // shadow settings
        ctx.shadowColor = data.shadow;
        ctx.shadowOffsetX = lineWidth;
        ctx.shadowOffsetY = lineWidth;
        ctx.shadowBlur = shadowBlur;

        // create letter
        ctx.fillText(text, lineWidth, lineWidth);

        // clear the shadow
        ctx.shadowColor = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        // restroke without the shadow
        ctx.strokeText(text, lineWidth, lineWidth);

        return canvas.toDataURL();
      }
    }

    // wait for font loading
    wait = function(name, callback) {
      // private variables
      var span, width, height, interval, times;

      // make polling max running
      times = 100;

      // hide span
      span = $('<span>')
              .style({
        position: 'absolute',
        visibility: 'hidden'
      }, '', 'important')
              .text('A').appendTo('body');

      // remember span size
      width = span.width();
      height = span.height();

      // set font-family
      span.style('font-family', name, 'important');

      // setup polling for changes
      interval = setInterval(function() {
        if (!times-- || span.width() !== width || span.height() !== height) {
          clearInterval(interval);
          span.remove();
          callback();
        }
      }, 100);
    }

    // repaint cursor images
    cursor.repaint = function() {
      images = {};

      for (var type in types)
        if (types.hasOwnProperty(type))
          images[type] = paint(type);
    }

    // set cursor type
    cursor.getImageOfType = function(type) {
      // save type
      data.type = type;
      // get image url for cursor type
      return images[type] || images['default'];
    }

    // set cursor zoom
    cursor.zoomImage = function(zoom) {
      data.size = step * Math.sqrt(zoom) < minSize ? minSize : step * Math.sqrt(zoom);
      cursor.repaint();
    }

    // load special cursor css
    load.style('../css/cursor.css', function() {
      wait('sitecues-cursor', function() {
        log.warn('sitecues-cursor font loaded');
        for (var zoom = 1; zoom <= 5; zoom += 0.1) {
          data.size = step * zoom < minSize ? minSize : step * zoom;
          cursor.repaint();
          var img = document.createElement("img");
          $(img).attr('src', images['default']).attr('id', zoom);
          document.body.appendChild(img);

          var img3 = document.createElement("img");
          $(img3).attr('src', images['default_2']).attr('id', zoom);
          document.body.appendChild(img3);
          
          var img4 = document.createElement("img");
          $(img4).attr('src', images['pointer_2']).attr('id', zoom);
          document.body.appendChild(img4);
          
          
          var img2 = document.createElement("img");
          $(img2).attr('src', images['pointer']).attr('id', zoom);
          document.body.appendChild(img2);
        }

        callback();
      });
    });
  });
});