/**
 * background script
 * Runs at a higher level of permission and can analyze CSS/pixel data without running
 * into cross-origin conflicts
 * NOTE: this is almost an exact duplicate of pixel-info.js -- haven't figured out how to make it DRY
 * Differences:
 * - includes color util functions getFastLuminance() and
 * - getReadableImage() is different
 * - Removes isInverted logic since it never is
 **/

'use strict';

/**
 *  Get pixel info for an image url
 */

(function() {

  var SC_DEV = true; // Show error messages

  // Copied from color.js
  function getFastLuminance(rgb) {
    var DIVISOR = 2550; // 255 * (2 + 7 + 1)
    return (rgb.r*2 + rgb.g*7 + rgb.b) / DIVISOR;
  }

  // Copied from color.js
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h,
      s: s,
      l: l
    };
  }

  // Get <img> that can have its pixel data read --
  // 1. Must be completely loaded
  // 2. We have permission (either we're in the extension, the img is not cross-origin, or we can load it through the proxy)
  // Either pass img or src, but not both
  function getReadableImage(url) {
    // Unsafe cross-origin request
    // - Will run into cross-origin restrictions because URL is from different origin
    // This is not an issue with the extension, because the background script doesn't have cross-origin restrictions
    return new Promise(function(resolve, reject) {
      var img = document.createElement('img');
      img.addEventListener('load', function () {
        resolve({
          element: img
        });
      });
      img.addEventListener('error', function () {
        reject(new Error('Error evaluating ' + img.src));
      });
      img.src = url;
    });
  }

  // Copied from pixel-info.js
  function getImageData(imgElement, rect) {
    var canvas = document.createElement('canvas'),
      ctx,
      top = rect.top || 0,
      left = rect.left || 0,
      width = rect.width,
      height = rect.height;
    canvas.width = width;
    canvas.height = height;

    ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(imgElement, top, left, width, height);
    }
    catch(ex) {
      if (SC_DEV) {
        console.error(ex);
      }
      return; // No data -- probably a broken image
    }
    return ctx.getImageData(0, 0, width, height).data;
  }

  // Copied from pixel-info.js
  function getPixelInfo(imgInfo, rect) {
    //
    // Compute Image Features (if we can...)
    // We may not be able to if the image is not from the same origin.
    //
    var
      data = getImageData(imgInfo.element, rect);
    if (!data) {
      return;
    }

    var
      isInverted = imgInfo.isInverted,
      grayscaleHistogram = [],
      GRAYSCALE_HISTOGRAM_SIZE = 500,
      grayscaleVal,
      hueHistogram = [],
      HUE_HISTOGRAM_SIZE = 100,
      hueIndex,
      hasTransparentPixels = false,
      DWORD_SIZE = 4,
      width = rect.width,
      height = rect.height,
      numBytes = width * height * DWORD_SIZE,
      numDifferentGrayscaleVals = 0,
      numMultiUseGrayscaleVals = 0,
      numWithSameGrayscale,
      numDifferentHues = 0,
      maxSameGrayscale = 0,
      MAX_PIXELS_TO_TEST = 523,
      area = height * width,
      stepSize = Math.floor(area / Math.min(area, MAX_PIXELS_TO_TEST)),
      MIN_TRANSPARENCY_FOR_VALID_PIXEL = 0.3,
      numPixelsToCheck = Math.floor(area / stepSize),
      // Greater of: 6 pixels or 5% of total pixels checked
      numSameBeforeConsideredMultiUse = Math.max(Math.ceil(numPixelsToCheck * 0.05), 6),
      numPixelsChecked = 0,
      histogramIndex,
      luminanceTotal = 0,
      maxLuminance = 0;

    function getRgba(byteIndex) {
      return {
        r: data[byteIndex],
        g: data[byteIndex + 1],
        b: data[byteIndex + 2],
        a: data[byteIndex + 3]
      };
    }

    function evaluatePixel(byteIndex) {
      var
        rgba = getRgba(byteIndex),
        isSemiTransparent = rgba.a < 255;

      if (isSemiTransparent) {  // Alpha channel
        hasTransparentPixels = true;
        if (rgba.a < MIN_TRANSPARENCY_FOR_VALID_PIXEL) {
          //continue;  // Don't use pixels that are mostly transparent for histogram or brighness measurements
        }
      }

      ++numPixelsChecked;

      if (isInverted) {
        // Used inverted image to get around cross-origin issues
        // We use this instead of passthrough option because it puts the image into the cache in case we need it
        // However, we need to evaluate the brightness as if it's not inverted
        rgba.r = 255 - rgba.r;
        rgba.g = 255 - rgba.g;
        rgba.b = 255 - rgba.b;
      }

      grayscaleVal = getFastLuminance(rgba);
      luminanceTotal += grayscaleVal;
      if (grayscaleVal > maxLuminance) {
        maxLuminance = grayscaleVal;
      }
      histogramIndex = Math.floor(grayscaleVal * GRAYSCALE_HISTOGRAM_SIZE);

      if (grayscaleHistogram[histogramIndex] > 0) {
        numWithSameGrayscale = ++grayscaleHistogram[histogramIndex];
        if (numWithSameGrayscale === numSameBeforeConsideredMultiUse) {
          ++numMultiUseGrayscaleVals;
        }
        if (numWithSameGrayscale > maxSameGrayscale) {
          maxSameGrayscale = numWithSameGrayscale;
        }
      }
      else {
        grayscaleHistogram[histogramIndex] = 1;
        ++numDifferentGrayscaleVals;
      }

      hueIndex = Math.floor(rgbToHsl(rgba.r, rgba.g, rgba.b).h * HUE_HISTOGRAM_SIZE);
      if (hueHistogram[hueIndex] > 0) {
        ++hueHistogram[hueIndex];
      }
      else {
        hueHistogram[hueIndex] = 1;
        ++numDifferentHues;
      }
      return {rgba: rgba, isSemiTransparent: isSemiTransparent};
    }

    for(var byteIndex = 0; byteIndex < numBytes; byteIndex += DWORD_SIZE * stepSize) {
      evaluatePixel(byteIndex);
    }

    return {
      hasTransparentPixels: hasTransparentPixels,
      numDifferentGrayscaleVals: numDifferentGrayscaleVals,
      numMultiUseGrayscaleVals: numMultiUseGrayscaleVals,
      percentWithSameGrayscale: numPixelsChecked ? maxSameGrayscale / numPixelsChecked : 0.5,
      numDifferentHues: numDifferentHues,
      averageLuminance: numPixelsChecked ? luminanceTotal / numPixelsChecked : 0.5,
      maxLuminance: maxLuminance
    };
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'getPixelInfo') {
      getReadableImage(message.url)
        .then(function (readableImgInfo) {
          var pixelInfo = getPixelInfo(readableImgInfo, message.rect);
          sendResponse(pixelInfo);
        })
        .catch(function() {
          console.warn('Pixel info unavailable for ', message.url);
          sendResponse(); // Pixel info unavailable
        });
      }
      return true;
    }
  );

})();

