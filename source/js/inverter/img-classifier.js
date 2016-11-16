/**
 *  Mark images as needing inversion for a dark theme
 *  Web page can override either via:
 *    data-sc-reversible="true" or "false"
 *    config.themes = {
 *      reversible: [selector],
 *      nonReversible: [selector]
 *    }
 */

define(
  [
    '$',
    'run/conf/site',
    'run/conf/urls',
    'inverter/orig-bg-info',
    'inverter/pixel-info',
    'core/native-global'
  ],
  function (
    $,
    site,
    urls,
    origBgInfo,
    pixelInfo,
    nativeGlobal
  ) {
  'use strict';

  var
    REVERSIBLE_ATTR = 'data-sc-reversible',
    customSelectors = site.get('themes') || {},
    SVG_SCORE       = 999,
    JPG_SCORE       = -50,
    isDebuggingOn   = true,
    CLASS_INVERT    = 'i',
    CLASS_NORMAL    = 'n',
    MAX_SCORE_CHECK_PIXELS = 200,
    imageScores     = {
      '.png'  : 50,
      '.jpg'  : JPG_SCORE,
      '.jpeg' : JPG_SCORE,
      '.gif'  : -35,
      '.svg'  : SVG_SCORE
    };

  function isImageExtension(ext) {
    var imgExts = Object.keys(imageScores);
    return imgExts.indexOf(ext) !== -1;
  }

  function isSVGSource(src) {
    var ext = urls.extname(src);
    return ext === '.svg';
  }

  function getImageSize(img) {
    return {
      // Sometimes naturalWidth, naturalHeight are not available, especially in the case of <input type="image">
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height
    };
  }

  // These come from the original machine-learned algorithms
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
    var defaultValue = -70;
    return typeof imageScores[imageExt] === 'number' ? imageScores[imageExt] : defaultValue;
  }

  // Either pass img or src, but not both
  function getPixelInfoScore(img, src, rect, onPixelScoreAvailable) {

    if (rect.width <= 1 || rect.height <= 1) {
      onPixelScoreAvailable(0); // It's possible that image simply isn't loaded yet, scroll down in brewhoop.com
      return;
    }

    // The magic values in here are taken from the original machine-learned algorithms
    // from Jeff Bigham's work, and have been tweaked a bit.
    pixelInfo.get(img || src, rect)
      .catch(function(err) {
        if (SC_DEV) {
          console.log(err);
        }
        onPixelScoreAvailable(0);
      })
      .then(function(pixelInfo) {
        if (!pixelInfo) {
          if (SC_DEV && isDebuggingOn && img) {
            $(img).attr('data-sc-pixel-score', 'invalid');
          }
          onPixelScoreAvailable(0, true);  // true -> this was an expensive operation so we should cache the result
          return;
        }

        var score,
          BASE_SCORE = 130,
          DARK_LUMINANCE_THRESHOLD = 0.40,
          DARK_LUMINANCE_MAX_THRESHOLD = 0.35,
          BRIGHT_LUMINANCE_THRESHOLD = 0.60,
          analysis = {
            manyValuesScore: 0,
            manyReusedValuesScore: 0,
            oneValueReusedOftenScore: 0,
            numHuesScore: 0,
            transparentPixelsScore: 0,
            darkNonTransparencyScore: 0,
            brightWithTransparencyScore: 0
          };

        // Low score -> NO invert (probably photo)
        // High score -> YES invert (probably logo, icon or image of text)

        // Transparent pixels -> more likely icon that needs inversion
        // No transparent pixels -> rectangular shape that usually won't be problematic over any background
        analysis.transparentPixelsScore = pixelInfo.hasTransparentPixels * 100;

        // More values -> more likely to be photo
        analysis.manyValuesScore = -1.5 * Math.min(200, pixelInfo.numDifferentGrayscaleVals);

        // Values reused -> less likely to be a photo
        analysis.manyReusedValuesScore = 15 * Math.min(20, pixelInfo.numMultiUseGrayscaleVals);

        // One large swath of color -> less likely to be a photo. For example 30% -> +60 points
        analysis.oneValueReusedOftenScore = Math.min(50, pixelInfo.percentWithSameGrayscale * 200);

        if (pixelInfo.hasTransparentPixels) {
          if (pixelInfo.averageLuminance > BRIGHT_LUMINANCE_THRESHOLD) {
            // This is already looks like bright text or a bright icon
            // Don't revert, because it will most likely end up as dark on dark
            analysis.brightWithTransparencyScore = -1500 * (pixelInfo.averageLuminance - BRIGHT_LUMINANCE_THRESHOLD);
          }
        }
        else if (pixelInfo.averageLuminance < DARK_LUMINANCE_THRESHOLD) {
          // This is already a very dark image, so inverting it will make it bright -- unlikely the right thing to do
          // We don't do this for images with transparent pixels, because it is likely a dark drawing on a light background,
          // which needs to be inverted
          analysis.darkNonTransparencyScore = -1000 * (DARK_LUMINANCE_THRESHOLD - pixelInfo.averageLuminance) - 50;
          if (pixelInfo.maxLuminance < DARK_LUMINANCE_MAX_THRESHOLD) {
            analysis.darkNonTransparencyScore *= 2; // Really dark -- there is nothing bright in this image at all
          }
        }

        // Many hues -> more likely to be a photo -- experimentation showed that 8 hues seemed to work as a threshold
        if (pixelInfo.numDifferentHues < 8) {
          // Few hues: probably not a photo -- YES invert
          analysis.numHuesScore =  Math.pow(pixelInfo.numDifferentHues - 8, 2) * 1.5;
        }
        else if (pixelInfo.numDifferentHues > 35) {
          // Many hues: probably a photo -- NO invert
          analysis.numHuesScore =  pixelInfo.numDifferentHues * -2;
        }

        score = BASE_SCORE +
          analysis.transparentPixelsScore +
          analysis.manyValuesScore +
          analysis.manyReusedValuesScore +
          analysis.oneValueReusedOftenScore +
          analysis.brightWithTransparencyScore +
          analysis.darkNonTransparencyScore +
          analysis.numHuesScore;

        // Image has full color information
        if (SC_DEV && isDebuggingOn && img) {
          $(img).attr('data-sc-pixel-info', nativeGlobal.JSON.stringify(pixelInfo));
          $(img).attr('data-sc-pixel-score-breakdown', nativeGlobal.JSON.stringify(analysis));
          $(img).attr('data-sc-pixel-score', score);
        }

        onPixelScoreAvailable(score, true);  // true -> this was an expensive operation so we should cache the result
      });
  }

  function getElementTypeScore(img) {
    var BUTTON_BONUS = 50;
    switch (img.localName) {
      case 'input':
        return BUTTON_BONUS;
      case 'svg':
        return SVG_SCORE;
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
      // but modified to reduce the number of collisions (by not confining the values to 32 bit)
      // For 294 images on a site, the normal 32 bit hash algorithm has a 1/100,000 chance of collision, and we are better than that.
      // For more info on hash collisions, see http://preshing.com/20110504/hash-collision-probabilities/
      return s.split('').reduce(function (a, b) {
        return ((a << 5) - a) + b.charCodeAt(0);
      }, 0).toString(36);
    }

    return STORAGE_PREFIX + getHashCode(img.getAttribute('src'));
  }

  // Classify an image that is loaded/loading from a src
  function classifyLoadableImage(img, onShouldReverseImage) {

    var
      storageKey = getStorageKey(img),
      cachedResult = sessionStorage.getItem(storageKey);

    function classifyLoadedImage() {
      shouldInvertElement(img, function(isReversible, didAnalyzePixels) {

        if (didAnalyzePixels) {
          // Only cache for expensive operations, in order to save on storage space
          var imageClass = isReversible ? CLASS_INVERT : CLASS_NORMAL;
          // Use session storage instead of local storage so that we don't pollute too much
          try {
            sessionStorage.setItem(storageKey, imageClass);
          }
          catch(ex) {}
        }

        onImageClassified(img, isReversible, onShouldReverseImage);
      });
    }

    function imageLoadError() {
      onImageClassified(img, false);
    }

    if (!SC_DEV && cachedResult) {
      // Use cached result if available
      onImageClassified(img, cachedResult === CLASS_INVERT, onShouldReverseImage);
    }
    else if (img.complete) {
      //Image is loaded and ready for processing -- after slight delay
      nativeGlobal.setTimeout(classifyLoadedImage, 0);
    }
    else {
      // Too early to tell anything
      // Wait until image loaded
      $(img)
        .on('load', classifyLoadedImage)
        .on('error', imageLoadError);
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
    else if (origBgInfo.wasOnDarkBackground(img)) {
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

    var imageExt = urls.extname(src);

    if (!isImageExtension(imageExt)) {
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
    getSizeScore: getSizeScore,
    getExtensionScore: getExtensionScore,
    getPixelInfoScore: getPixelInfoScore,
    isImageExtension: isImageExtension,
    isSVGSource: isSVGSource
  };
});
