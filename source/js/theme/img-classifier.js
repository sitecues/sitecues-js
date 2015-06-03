/**
 *  Mark images as needing inversion for a dark theme
 *  Web page can override either via:
 *    data-sc-reversible="true" or "false"
 *    config.themes = {
 *      reversible: [selector],
 *      nonReversible: [selector]
 *    }
 */

sitecues.def('theme/color/img-classifier', function(imgClassifier, callback) {
  'use strict';

  sitecues.use('jquery', 'zoom', 'util/color', 'conf/site', function($, zoomMod, colorUtil, site) {

    var REVERSIBLE_ATTR = 'data-sc-reversible',
      customSelectors = site.get('themes') || { },
      DARK_BG_THRESHOLD = 0.3,
      BUTTON_BONUS = 50,
      SVG_BONUS = 999,
      BG_IMAGE_BONUS = 30,
      MAX_SCORE_CHECK_PIXELS = 120,
      isDebuggingOn;

    function getImageExtension(src) {
      var imageExtension = src.match(/\.png|\.jpg|\.jpeg|\.gif|\.svg/i);
      return imageExtension && imageExtension[0];
    }

    function getImageData(img, rect) {
      var canvas = document.createElement('canvas'),
        ctx,
        top = rect.top || 0,
        left = rect.left || 0,
        width = rect.width,
        height = rect.height;
      canvas.width = width;
      canvas.height = height;

      ctx = canvas.getContext('2d');

      if (img.localName !== 'img') {
        img = $('<img>').attr('src', img.src)[0];
      }

      try {
        ctx.drawImage(img, top, left, width, height);  // Works with img, canvas, video
        var imageData = ctx.getImageData(0, 0, width, height);
        return imageData.data;
      }
      catch (ex) {
        SC_DEV && isDebuggingOn && console.log('Could not get image data for %s: %s', img.src, ex);
        return null;
      }
    }

    function getPixelInfo(img, rect) {
      var data = getImageData(img, rect);
      return data && getPixelInfoImpl(data, rect.width, rect.height);
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
      SC_DEV && isDebuggingOn && console.log('Histogram: %o', grayscaleHistogram);
      SC_DEV && isDebuggingOn && console.log('numDiff = ' + numDifferentGrayscaleVals + ' numMulti = ' + numMultiUseGrayscaleVals);

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

    function getSizeScore(height, width) {
      var score = 0,
        aspectRatio = width / height;

      // No color information
      if (height < 26) {
        score += 100;
      }
      else if (height < 37) {
        score += 50;
      }

      if (aspectRatio === 1) {
        score *= 2;
      }
      else if (aspectRatio > 4) {
        score += 100;
      }
      else if (aspectRatio > 3) {
        score += 50;
      }
      else {
        if (height > 200) {
          score += 200 - height;
        }
        if (aspectRatio < 0.7) {
          score -= 50;
        }
        else if (aspectRatio > 1.4 && aspectRatio < 1.8) {
          score -= 70; // Typical photo
          if (height > 130) {
            score += 130 - height;
          }
        }
      }

      return Math.max(score, -150);
    }

    function getExtensionScore(imageExt) {
      switch (imageExt) {
        case '.png':
          return 50;
        case '.svg':
          return SVG_BONUS;
//        case '.jpg':
//        case '.jpeg':
//        case '.gif':
        default:
          return -70;
      }
    }

    function getPixelInfoScore(img, rect) {
      var pixelInfo = getPixelInfo(img, rect);

      // Image has full color information
      if (pixelInfo) {
        if (SC_DEV && isDebuggingOn) {
          $(img).attr('pixel-info', JSON.stringify(pixelInfo));
        }
        return 180 - Math.min(pixelInfo.numDiffGrayscaleVals, 150) -
          pixelInfo.numMultiGrayscaleVals * 10 +
          (pixelInfo.percentWithSameGrayscale > 0.3) * 50;
      }

      return 40; // Add an average amount
    }

    function getElementTypeScore(img) {
      switch (img.localName) {
        case 'input':
          return BUTTON_BONUS;
        case 'svg':
          return SVG_BONUS;
        default:
          return 0;
      }
    }

    /**
     * Classifier function for images without missing features.
     * This formula came from a machine learning algorithm with the help of Jeffrey Bigham
     * @param img
     * @returns {*}
     */
    // TODO cache results in localStorage based on URL?
    function shouldInvertElement(img) {
      if (colorUtil.isOnDarkBackground(img, DARK_BG_THRESHOLD)) {
        return false; // Already on a dark background, inverting won't help make it visible
      }
      var src = img.getAttribute('src'),
        size = getImageSize(img),
        imageExt = getImageExtension(src),
        sizeScore = getSizeScore(size.height, size.width),
        elementTypeScore = getElementTypeScore(img),
        extensionScore = getExtensionScore(imageExt),
        finalScore = sizeScore + elementTypeScore + extensionScore,
        pixelInfoScore = 0;

      if (finalScore > - MAX_SCORE_CHECK_PIXELS && finalScore < MAX_SCORE_CHECK_PIXELS) {
        // Pixel info takes longer to get: only do it if necessary
        pixelInfoScore = getPixelInfoScore(img, size);
      }

      finalScore += pixelInfoScore;

      SC_DEV && isDebuggingOn && $(img).attr('score',
        sizeScore + ' (size) + ' +
        (elementTypeScore ? elementTypeScore + ' (button) + ' : '' ) +
        extensionScore + ' (ext) + ' +
        pixelInfoScore + ' (pixels) = ' + finalScore);

      return finalScore > 0;
    }

//    colorUtil.shouldInvertBgImage = function(src, rect) {
//      var imageExt = getImageExtension(src),
//        sizeScore = getSizeScore(rect.height, rect.width),
//        elementTypeScore = BG_IMAGE_BONUS,
//        extensionScore = getExtensionScore(imageExt),
//        img = $('<img>').attr('src', src)[0],
//        pixelInfoScore = getPixelInfoScore(img, rect),
//        finalScore = sizeScore + elementTypeScore + extensionScore + pixelInfoScore;
//
//      SC_DEV && isDebuggingOn && $(img).attr('score',
//          sizeScore + ' (size) + ' +
//          (elementTypeScore ? elementTypeScore + ' (button) + ' : '' ) +
//          extensionScore + ' (ext) + ' +
//          pixelInfoScore + ' (pixels) = ' + finalScore);
//
//      return finalScore > 0;
//    };

    imgClassifier.classify = function() {
      var NOT_CLASSIFIED = ':not([' + REVERSIBLE_ATTR + '])',
        selector = 'body img' + NOT_CLASSIFIED +
                   ',body input[type="image"]' + NOT_CLASSIFIED +
                   ',body svg' + NOT_CLASSIFIED;
      if (customSelectors.reversible) {
        $(customSelectors.reversible).attr(REVERSIBLE_ATTR, true);
      }
      if (customSelectors.nonReversible) {
        $(customSelectors.nonReversible).attr(REVERSIBLE_ATTR, false);
      }
      $(selector).each(function (index, element) {
        var isReversible = shouldInvertElement(element);
        if (SC_DEV && isDebuggingOn) {
          $(element).css('outline', '5px solid ' + (isReversible ? 'red': 'green'));
        }
        $(element).attr(REVERSIBLE_ATTR, isReversible);
      });
    };

    if (SC_DEV) {
      sitecues.debugImageClassifier = function() {
        isDebuggingOn = true;
        if (document.readyState === 'complete') {
          imgClassifier.classify();
        }
        else {
          $(window).on('load', imgClassifier.classify);
        }
      };
//      sitecues.debugImageClassifier();
    }

    if (SC_UNIT) {
      $.extend(exports, imgClassifier);
    }
  });

  callback();
});