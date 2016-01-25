/**
 *  Mark images as needing inversion for a dark theme
 *  Web page can override either via:
 *    data-sc-reversible="true" or "false"
 *    config.themes = {
 *      reversible: [selector],
 *      nonReversible: [selector]
 *    }
 */

define(['$', 'page/zoom/zoom', 'page/util/color', 'core/conf/site', 'core/conf/urls'], function($, zoomMod, colorUtil, site, urls) {
  var REVERSIBLE_ATTR = 'data-sc-reversible',
    customSelectors = site.get('themes') || { },
    DARK_BG_THRESHOLD = 0.3,
    BUTTON_BONUS = 50,
    SVG_BONUS = 999,
    MAX_SCORE_CHECK_PIXELS = 120,
    isDebuggingOn,
    CLASS_INVERT = 'i',
    CLASS_NORMAL = 'n';

  function getImageExtension(src) {
    var imageExtension = src.match(/\.png|\.jpg|\.jpeg|\.gif|\.svg/i);
    return imageExtension && imageExtension[0];
  }

  function getInvertUrl(url) {
    var
      absoluteUrl = urls.resolveUrl(url),
      // TODO ?url=
      apiUrl = urls.getApiUrl('image/invert?url=' + absoluteUrl); // TODO should we use encodeURIComponent(url)) ?

    // TODO remove this line when real service is ready
    apiUrl = apiUrl.replace('/ws.', '/wsbeta.');

    return apiUrl;
  }

  // Get <img> that can have its pixel data read --
  // 1. Must be completely loaded
  // 2. We have permission (either we're in the extension, the img is not cross-domain, or we can load it through the proxy)
  // Either pass img or src, but not both
  function getReadableImage(img, src, onReadableImageAvailable) {
    // Unsafe cross-origin request
    // - Will run into cross-domain restrictions because URL is from different domain
    // This is not an issue with the extension, because the content script doesn't have cross-domain restrictions
    var url = src || img.getAttribute('src'),
      isSafeRequest = SC_EXTENSION || !urls.isOnDifferentDomain(url),
      safeUrl,
      safeImg;

    function returnImageWhenComplete(loadableImg) {
      if (loadableImg.complete) {
        onReadableImageAvailable(loadableImg); // Already loaded
      }
      else {
        loadableImg.addEventListener('load', function() {
          onReadableImageAvailable(loadableImg);
        });
      }
    }

    if (isSafeRequest) {
      if (img && img.localName === 'img') {
        returnImageWhenComplete(img); // The <img> in the DOM can have its pixels queried
        return;
      }
      safeUrl = url;  // Image element was not an <img>. Will create an <img> based on the url
    }
    else {
      // Uses inverted image for analysis so that if we need to display it, it's already in users cache.
      // The inverted image will show the same number of brightness values in the histogram so this won't effect classification
      safeUrl = getInvertUrl(url);
    }

    safeImg = $('<img>').attr('src', safeUrl)[0];
    returnImageWhenComplete(safeImg);
  }

  // Either pass img or src, but not both
  function getImageData(img, src, rect, onImageDataAvailable) {
    var canvas = document.createElement('canvas'),
      ctx,
      top = rect.top || 0,
      left = rect.left || 0,
      width = rect.width,
      height = rect.height,
      imageData;
    canvas.width = width;
    canvas.height = height;

    getReadableImage(img, src, function(readableImg) {
      ctx = canvas.getContext('2d');

      try {
        ctx.drawImage(readableImg, top, left, width, height);
        imageData = ctx.getImageData(0, 0, width, height).data;
      }
      catch (ex) {
        if (SC_DEV && isDebuggingOn) {
          console.log('Could not get image data for %s: %s', readableImg.src, ex);
        }
      }
      onImageDataAvailable(imageData);
    });
  }

  // Either pass img or src, but not both
  function getPixelInfo(img, src, rect, onPixelInfoAvailable) {
    getImageData(img, src, rect, function(data) {
      onPixelInfoAvailable(data && getPixelInfoImpl(data, rect.width, rect.height));
    });
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

      grayscaleVal = colorUtil.getFastLuminance(rgba);
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
    if (SC_DEV && isDebuggingOn) {
      console.log('Histogram: %o', grayscaleHistogram);
      console.log('numDiff = ' + numDifferentGrayscaleVals + ' numMulti = ' + numMultiUseGrayscaleVals);
    }

    return {
      hasTransparentPixels: hasTransparentPixels,
      numDifferentGrayscaleVals: numDifferentGrayscaleVals,
      numMultiUseGrayscaleVals: numMultiUseGrayscaleVals,
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
    if (width <= 1 || height <= 1) {
      return 0; // It's possible that image simply isn't loaded yet, scroll down in brewhoop.com
    }

    var score = 0,
      aspectRatio = width / height;

    // No color information
    if (height < 26) {
      score += 100;
    }
    else if (height < 37) {
      score += 50;
    }

    if (height > 180) {
      score += 180 - height;
    }
    else if (aspectRatio === 1) {
      score *= 2;
    }
    else if (aspectRatio > 4) {
      score += 100;
    }
    else if (aspectRatio > 3) {
      score += 50;
    }
    if (height < 400) {
      if (aspectRatio < 0.7) {
        score -= 50;
      }
      else if (aspectRatio > 1.4 && aspectRatio < 1.9) {
        score -= 70; // Typical photo
        if (aspectRatio > 1.49 && aspectRatio < 1.51) {
          score -= 30;  // 1.5:1 even more typical photo
        }
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
      case '.gif':
        return -35;
      case '.jpg':
      case '.jpeg':
        return -50;
      default:
        return -70;
    }
  }

  // Either pass img or src, but not both
  function getPixelInfoScore(img, src, rect, onPixelScoreAvailable) {
    if (rect.width <= 1 || rect.height <= 1) {
      onPixelScoreAvailable(0); // It's possible that image simply isn't loaded yet, scroll down in brewhoop.com
      return;
    }

    getPixelInfo(img, src, rect, function(pixelInfo) {
      var score,
        BASE_SCORE = 180,
        DEFAULT_SCORE = 40,
        manyValuesScore,
        manyReusedValuesScore,
        oneValueReusedOftenScore;

      if (pixelInfo) {
        // Image has full color information
        if (SC_DEV && isDebuggingOn) {
          $(img).attr('pixel-info', JSON.stringify(pixelInfo));
        }

        manyValuesScore = - Math.min(pixelInfo.numDifferentGrayscaleVals, 150); // More values -> less likely to be photo
        manyReusedValuesScore = + pixelInfo.numMultiUseGrayscaleVals * 10; // Values reused -> less likely to be a photo
        oneValueReusedOftenScore = (pixelInfo.percentWithSameGrayscale > 0.3) * -50;  // Large areas of same value -> less likely to be a photo
        score = BASE_SCORE + manyValuesScore + manyReusedValuesScore + oneValueReusedOftenScore;
      }
      else {
        score = DEFAULT_SCORE;  // No pixel info: use an average amount
      }

      onPixelScoreAvailable(score, true);  // true -> this was an expensive operation so we should cache the result
    });
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

  // Uses a sitecues prefix to avoid namespace conflicts with underlying page
  // Uses a hash function on the url to reduce the amount of storage required to save results for each url
  function getStorageKey(img) {
    var STORAGE_PREFIX = '-sc-img-';

    // jshint -W016
    function getHashCode(s) {
      // From http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
      return s.split('').reduce(function (a, b) {
        return ((a << 5) - a) + b.charCodeAt(0);
      }, 0).toString(36);
    }

    return STORAGE_PREFIX + getHashCode(img.src);
  }

  // Classify an image that is loaded/loading from a src
  function classifyLoadableImage(img, onShouldReverseImage) {
    function classifyLoadedImage() {
      shouldInvertElement(img, function(isReversible, didAnalyzePixels) {

        if (SC_DEV && isDebuggingOn) {
          $(img).css('outline', '5px solid ' + (isReversible ? 'red' : 'green'));
        }

        if (didAnalyzePixels) {
          // Only cache for expensive operations, in order to save on storage space
          var imageClass = isReversible ? CLASS_INVERT : CLASS_NORMAL;
          // Use session storage instead of local storage so that we don't pollute too much
          window.sessionStorage.setItem(storageKey, imageClass);
        }

        onImageClassified(img, isReversible, onShouldReverseImage);
      });
    }

    var storageKey = getStorageKey(img),
      cachedResult = window.sessionStorage.getItem(storageKey);

    if (cachedResult) {
      onImageClassified(img, cachedResult === CLASS_INVERT, onShouldReverseImage);
    }
    // Too early to tell anything
    if (!img.complete) {
      img.addEventListener('load', classifyLoadedImage);
    }
    else {
      setTimeout(classifyLoadedImage, 100);
    }
  }

  /**
   * Classifier function for images without missing features.
   * This formula came from a machine learning algorithm with the help of Jeffrey Bigham
   * @param img
   * @returns {*}
   */
  function classifyImage(img, onShouldReverseImage) {
    var isReversible,
      $img = $(img);

    if ($img.is(customSelectors.reversible)) {
      isReversible = true;
    }
    else if ($img.is(customSelectors.nonReversible)) {
      isReversible = false;
    }
    else if (colorUtil.isOnDarkBackground(img, DARK_BG_THRESHOLD)) {
      // If already on a dark background, inverting won't help make it visible
      isReversible = false;
    }
    else if (img.localName === 'svg') {
      isReversible = true;
    }
    else if (!img.src) {
      isReversible = false;
    }
    else {
      classifyLoadableImage(img, onShouldReverseImage);
      return;
    }

    onImageClassified(img, isReversible, onShouldReverseImage);
  }

  function onImageClassified(img, isReversible, onShouldReverseImage) {
    img.setAttribute(REVERSIBLE_ATTR, isReversible);
    if (isReversible) {
      onShouldReverseImage(img);
    }
  }

  function getSource(img) {
    var src = img.getAttribute('src'),
      srcSet;
    if (!src) {
      srcSet = img.getAttribute('srcset');
      if (srcSet) {
        src = srcSet.split('/, /')[0]; // Get first URL
      }
    }
    return src;
  }

  function shouldInvertElement(img, onInversionDecision) {
    var src = getSource(img);

    if (!src) {
      return false; // Image has no source -- don't invert
    }

    var imageExt = getImageExtension(src);

    if (!imageExt) {
      return false;  // Not a normal image extension -- don't invert
    }

    var size = getImageSize(img),
      sizeScore = getSizeScore(size.height, size.width),
      elementTypeScore = getElementTypeScore(img),
      extensionScore = getExtensionScore(imageExt),
      finalScore = sizeScore + elementTypeScore + extensionScore;

    if (finalScore < -MAX_SCORE_CHECK_PIXELS || finalScore > MAX_SCORE_CHECK_PIXELS) {
      // Early return
      onInversionDecision(finalScore > 0);
      return;
    }

    // Pixel info takes longer to get: only do it if necessary
    getPixelInfoScore(img, null, size, function (pixelInfoScore, didAnalyzePixels) {

      finalScore += pixelInfoScore;

      if (SC_DEV && isDebuggingOn) {
        $(img).attr(
          'score',
          sizeScore + ' (size) + ' +
          (
            elementTypeScore ?
            elementTypeScore + ' (button) + ' :
              ''
          ) +
          extensionScore + ' (ext) + ' +
          pixelInfoScore + ' (pixels) = ' + finalScore
        );
      }

      onInversionDecision(finalScore > 0, didAnalyzePixels);
    });
  }

  function classify(root, onShouldReverseImage) {
    var NOT_CLASSIFIED = ':not([' + REVERSIBLE_ATTR + '])',
      selector = 'img[src]' + NOT_CLASSIFIED +
                 ',picture[srcset]' + NOT_CLASSIFIED +
                 ',input[type="image"]' + NOT_CLASSIFIED +
                 ',svg' + NOT_CLASSIFIED,
      $root = $(root);

    if ($root.is(selector)) {  // Single image
      classifyImage(root, onShouldReverseImage);
    }
    else {  // Subtree of potential images
      $(root).find(selector).each(function() {
        classifyImage(this, onShouldReverseImage);
      });
    }
  }

  if (SC_DEV) {
    sitecues.debugImageClassifier = function() {
      isDebuggingOn = true;
      if (document.readyState === 'complete') {
        classify();
      }
      else {
        $(window).on('load', classify);
      }
    };
//      sitecues.debugImageClassifier();
  }

  return {
    classify: classify,
    getInvertUrl: getInvertUrl,
    getSizeScore: getSizeScore,
    getImageExtension: getImageExtension,
    getExtensionScore: getExtensionScore,
    getPixelInfoScore: getPixelInfoScore
  };
});
