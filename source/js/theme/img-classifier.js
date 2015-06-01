/**
 *  Mark images as needing inversion for a dark theme
 */

sitecues.def('theme/color/img-classifier', function(imgClassifier, callback) {
  'use strict';

  var REVERSIBLE_ATTR = 'data-sc-reversible';

  sitecues.use('jquery', 'zoom', 'theme/color/util', function($, zoomMod, colorUtil) {

    function getImageExtension(src) {
      var imageExtension = src.match(/\.png|\.jpg|\.jpeg|\.gif/i);
      return imageExtension && imageExtension[0];
    }

    function getImageData(img, width, height) {
      var canvas = document.createElement('canvas'),
        ctx;
      canvas.width = width;
      canvas.height = height;

      ctx = canvas.getContext('2d', { antialias: false });
      ctx.drawImage(img, 0, 0, width, height);

      try {
        var imageData = ctx.getImageData(0, 0, width, height);
        return imageData.data;
      }
      catch (ex) {
        SC_DEV && console.log('Could not get image data for %s: %s', img.src, ex);
        return null;
      }
    }

    function getPixelInfo(img, width, height) {
      var data = getImageData(img, width, height);
      return data && getPixelInfoImpl(data, width, height);
    }

    function getPixelInfoImpl(data, width, height) {
      //
      // Compute Image Features (if we can...)
      // We may not be able to if the image is not from the same origin.
      //
      var grayscaleHistogram = [],
        HISTOGRAM_SIZE = 500,
        grayscaleVal,
        byteIndex = 0,
        hasTransparentPixels = false,
        DWORD_SIZE = 4,
        numBytes = width * height * DWORD_SIZE,
        numDifferentGrayscaleVals = 0,
        numMultiUseGrayscaleVals = 0,
        numWithSameGrayscale,
        maxSameGrayscale = 0,
        MAX_PIXELS_TO_TEST = 523,
        area = height * width,
        stepSize = Math.floor(area / Math.min(area, MAX_PIXELS_TO_TEST)),
        numPixelsToCheck = Math.floor(area / stepSize),
        histogramIndex;

      // TODO do we only need numDifferentGrayscaleVals?

      for(; byteIndex < numBytes; byteIndex += DWORD_SIZE * stepSize) {
        var rgba = {
          r: data[byteIndex],
          g: data[byteIndex + 1],
          b: data[byteIndex + 2],
          a: data[byteIndex + 3]
        };

        if (rgba.a < 255) {  // Alpha channel
          hasTransparentPixels = true;
        }

        grayscaleVal = colorUtil.getLuminosity(rgba);
        histogramIndex = Math.floor(grayscaleVal * HISTOGRAM_SIZE);

        if (grayscaleHistogram[histogramIndex] > 0)  {
          numWithSameGrayscale = ++ grayscaleHistogram[histogramIndex];
          if (numWithSameGrayscale === 6) {
            ++numMultiUseGrayscaleVals;
          }
          if (numWithSameGrayscale > maxSameGrayscale) {
            maxSameGrayscale = numWithSameGrayscale;
          }
        }
        else {
          grayscaleHistogram[histogramIndex] = 1;
          ++ numDifferentGrayscaleVals;
        }
      }
      console.log('numDiff = ' + numDifferentGrayscaleVals + ' numMulti = ' + numMultiUseGrayscaleVals);
      SC_DEV && console.log(grayscaleHistogram);

      return {
        hasTransparentPixels: hasTransparentPixels,
        numDiffGrayscaleVals: numDifferentGrayscaleVals,
        numMultiGrayscaleVals: numMultiUseGrayscaleVals,
        percentWithSameGrayscale: maxSameGrayscale / numPixelsToCheck
      };
    }

    function getImageSize(img) {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    }

    /**
     * Classifier function for images without missing features.
     * This formula came from a machine learning algorithm with the help of Jeffrey Bigham
     * @param imageInfo
     * @returns {*}
     */
    // TODO cache results in localStorage based on URL?
    // TODO don't do if original bg was dark? E.g. http://news.dessci.com/mathplayer-4-works-assistive-technology-products
    function shouldInvert(img) {
      var src = img.getAttribute('src'),
        size = getImageSize(img),
        imageExt = getImageExtension(src),
        pixelInfo = getPixelInfo(img, size.width, size.height),
        score = 0,
        aspectRatio = size.width / size.height;

      // No color information
      if (size.height < 26) {
        score += 100;
      }
      else if (size.height < 36) {
        score += 50;
      }

      if (aspectRatio > 4) {
        score += 100;
      }
      else if (aspectRatio > 3) {
        score += 50;
      }
      else {
        if (size.height > 250) {
          score -= 50;
          if (size.height > 400) {
            score -= 50;
          }
        }
        if (aspectRatio < 0.7) {
          score -= 50;
        }
        else if (aspectRatio > 1.4 && aspectRatio < 1.6) {
          score -= 50; // Typical photo
        }
      }

      switch (imageExt) {
        case '.png':
          score += 50;
          break;
//        case '.jpg':
//        case '.jpeg':
//        case '.gif':
        default:
          score -= 70;
      }

      // Image has full color information
      if (pixelInfo) {
        console.log(pixelInfo);
        if (SC_DEV) {
          $(img).attr('pixel-info', JSON.stringify(pixelInfo));
        }
        score +=
          180 - Math.min(pixelInfo.numDiffGrayscaleVals, 150) -
          pixelInfo.numMultiGrayscaleVals * 10 +
          (pixelInfo.percentWithSameGrayscale > 0.3) * 50;
      }
      else {
        score += 40; // Add an average amount
      }


      SC_DEV && console.log(score);

      return score > 0;
    }

    imgClassifier.classify = function() {
      var NOT_CLASSIFIED = ':not([' + REVERSIBLE_ATTR + '])',
        selector = 'img' + NOT_CLASSIFIED +
                   ',input[type="image"]' + NOT_CLASSIFIED;
      $(selector).each(function (index, element) {
        var isReversible = shouldInvert(element);
        if (SC_DEV) {
          $(element).css('outline', '5px solid ' + (isReversible ? 'red': 'green'));
        }
        $(element).attr(REVERSIBLE_ATTR, isReversible);
      });
    };

    $(window).on('load', imgClassifier.classify);

    if (SC_UNIT) {
      $.extend(exports, imgClassifier);
    }
  });

  callback();
});