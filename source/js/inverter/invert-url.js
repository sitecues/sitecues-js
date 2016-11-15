/**
 *  Get an image url that is the inverted version of the image url passed-in
 */

define([
  'run/conf/urls',
  'Promise'
],
  function(urls,
           Promise) {

    // Helper to invert image data, pixel by pixel
    function invertImageData(ctx, width, height) {
      var imageData = ctx.getImageData(0, 0, width, height),
        data = imageData.data,
        dataLength = data.length,
        index = 0;

      for (; index < dataLength; index += 4) {
        // red
        data[index] = 255 - data[index];
        // green
        data[index + 1] = 255 - data[index + 1];
        // blue
        data[index + 2] = 255 - data[index + 2];
      }

      ctx.putImageData(imageData, 0, 0);
    }

    // Temporary image, created so we can find the width/height
    function createTempImage(url) {
      // Create temporary image
      var img = document.createElement('img');
      img.src = url;
      return img;
    }

    // Create an inverted version of a data: image, pixel by pixel
    // Pass in original image if available, otherwise it will create a temporary image
    function getInvertedDataUrl(url, optionalOrigImage) {
      function getLoadedImage() {
        var
        // Use temp image if orig <img> not available (will have naturalHeight and naturalWidth set)
          doUseOrigImage = optionalOrigImage && optionalOrigImage.localName === 'img',
          img = doUseOrigImage ? optionalOrigImage : createTempImage(url);

        if (img.complete) {
          return Promise.resolve(img);
        }

        return new Promise(function(resolve) {
          img.addEventListener('load', function () {
            resolve(img);
          });
        });
      }

      return getLoadedImage()
        .then(function(img) {
          var
            canvas = document.createElement('canvas'),
            width = canvas.width = img.naturalWidth,
            height = canvas.height = img.naturalHeight,
            ctx = canvas.getContext('2d');

          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);

          // Invert it
          invertImageData(ctx, width, height);

          // Return new data url
          return canvas.toDataURL();
        });
    }

    function getInvertUrl(url, origElem) {

      // Data url
      if (url.indexOf('data:') === 0) {
        // The image service can't invert this url, but we can do it in JS.
        // Very useful for example on http://www.gatfl.gatech.edu/tflwiki/index.php?title=Team
        return getInvertedDataUrl(url, origElem);
      }

      if (SC_EXTENSION) {
        throw new Error('Cannot use image/invert service from extension');
      }

      var newUrl = urls.getProxyApiUrl('image/invert', url);

      return Promise.resolve(newUrl);
    }
    return {
      getInvertUrl: getInvertUrl
    };
  });
