"use strict";

/**
 *  Get an image url that is the inverted version of the image url passed-in
 */
sitecues.define("inverter/invert-url", [ "run/conf/urls", "Promise" ], function(urls, Promise) {
  // Helper to invert image data, pixel by pixel
  function invertImageData(ctx, width, height) {
    var imageData = ctx.getImageData(0, 0, width, height), data = imageData.data, dataLength = data.length, index = 0;
    for (;index < dataLength; index += 4) {
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
    var img = document.createElement("img");
    img.src = url;
    return img;
  }
  // Create an inverted version of a data: image, pixel by pixel
  // Pass in original image if available, otherwise it will create a temporary image
  function getInvertedDataUrl(url, optionalOrigImage) {
    function getLoadedImage() {
      var // Use temp image if orig <img> not available (will have naturalHeight and naturalWidth set)
      doUseOrigImage = optionalOrigImage && "img" === optionalOrigImage.localName, img = doUseOrigImage ? optionalOrigImage : createTempImage(url);
      if (img.complete) {
        return Promise.resolve(img);
      }
      return new Promise(function(resolve) {
        img.addEventListener("load", function() {
          resolve(img);
        });
      });
    }
    return getLoadedImage().then(function(img) {
      var canvas = document.createElement("canvas"), width = canvas.width = img.naturalWidth, height = canvas.height = img.naturalHeight, ctx = canvas.getContext("2d");
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
    if (0 === url.indexOf("data:")) {
      // The image service can't invert this url, but we can do it in JS.
      // Very useful for example on http://www.gatfl.gatech.edu/tflwiki/index.php?title=Team
      return getInvertedDataUrl(url, origElem);
    }
    var newUrl = urls.getProxyApiUrl("image/invert", url);
    return Promise.resolve(newUrl);
  }
  return {
    getInvertUrl: getInvertUrl
  };
});

/*  Create a style sheet that provides info about the original background colors of the page.
 *  We still need to know the original colors for processing images and background-images.
 *
 *  The hints are as follows:
 *  content: "d"   --> originally dark background
 *  content: "l"   --> originally light background
 *
 *  Q. Why in a hacky stylesheet instead of data tied to specific elements?
 *  A. Because this hack allows us to understand newly-added content without doing anything.
 *     The browser automatically ties the metadata from 'content' rules to any new content
 *
 *  Q. Why not track selectors with bg color rules and determine applicability of those style rules ourselves?
 *  A. Because understanding CSS precedence in browsers is tres hard.
 *
 *  Q. Why doesn't this damage the page view?
 *  A. CSS content rules do not affect normal elements, they only actually get used for ::before and ::after
 *     We automatically filter out those selectors when we create the style sheet with our hint rules.
 *
 *  We only create this sheet once.
 */
sitecues.define("inverter/orig-bg-info", [ "Promise", "page/util/color", "page/style-service/style-service" ], function(Promise, colorUtil, styleService) {
  var DARK_HINTS_ID = "sitecues-js-orig-info", FLAG_BG_DARK = '"D"', FLAG_BG_LIGHT = '"L"';
  function getSanitizedSelector(selector) {
    function allowSelector(subSelector) {
      return subSelector.lastIndexOf(":before") < 0 && subSelector.lastIndexOf(":after") < 0;
    }
    // Remove :before, ::before, :after, ::after rules
    var subSelectors = selector.split(","), allowedSubSelectors = subSelectors.filter(allowSelector);
    return allowedSubSelectors.join(",");
  }
  function createDarkHintRule(selector, themeStyle, rgba) {
    var DARK_BG_THRESHOLD = .6, isDark = colorUtil.getFastLuminance(rgba) < DARK_BG_THRESHOLD, important = themeStyle.value.important, contentFlag = isDark ? FLAG_BG_DARK : FLAG_BG_LIGHT;
    // D = dark, L = light
    return selector + "{ content: " + contentFlag + (important ? " !important; " : "; ") + "}\n";
  }
  function createDarkHintCss(styleInfo) {
    var darkHintSheetCss = "";
    styleInfo.forEach(function(themeStyle) {
      if ("background-color" !== themeStyle.value.prop) {
        return;
      }
      var rgba = themeStyle.value.parsedVal, selector = getSanitizedSelector(themeStyle.rule.selectorText);
      if (rgba.a > .5 && selector) {
        // Don't bother if mostly transparent
        // Only use selectors without :before and :after
        darkHintSheetCss += createDarkHintRule(selector, themeStyle, rgba);
      }
    });
    return darkHintSheetCss;
  }
  // Return a promise to the bg hints style sheet
  function init(styleInfo) {
    return new Promise(function(resolve) {
      var darkHintSheetCss = createDarkHintCss(styleInfo), $sheet = styleService.updateSheet(DARK_HINTS_ID, {
        text: darkHintSheetCss
      });
      styleService.getDOMStylesheet($sheet, resolve);
    });
  }
  function wasOnDarkBackground(current) {
    var currentRect, origElement = current, origRect = origElement.getBoundingClientRect();
    while (current) {
      currentRect = current.getBoundingClientRect();
      // Only care about backgrounds where the original element is inside of the background rect
      if (currentRect.right > origRect.left && currentRect.left < origRect.right && currentRect.bottom > origRect.top && currentRect.top < origRect.bottom) {
        var bgHint = window.getComputedStyle(current).content;
        if (bgHint === FLAG_BG_DARK) {
          return true;
        } else {
          if (bgHint === FLAG_BG_LIGHT) {
            return false;
          }
        }
      }
      current = current.parentElement;
    }
    return false;
  }
  return {
    init: init,
    wasOnDarkBackground: wasOnDarkBackground
  };
});

/**
 *  Mark images as needing inversion for a dark theme
 *  Web page can override either via:
 *    data-sc-reversible="true" or "false"
 *    config.themes = {
 *      reversible: [selector],
 *      nonReversible: [selector]
 *    }
 */
sitecues.define("inverter/img-classifier", [ "$", "page/util/color", "run/conf/site", "run/conf/urls", "inverter/invert-url", "inverter/orig-bg-info", "mini-core/native-global" ], function($, colorUtil, site, urls, invertUrl, origBgInfo, nativeGlobal) {
  var REVERSIBLE_ATTR = "data-sc-reversible", customSelectors = site.get("themes") || {}, SVG_SCORE = 999, JPG_SCORE = -50, isDebuggingOn = true, CLASS_INVERT = "i", CLASS_NORMAL = "n", MAX_SCORE_CHECK_PIXELS = 200, imageScores = {
    ".png": 50,
    ".jpg": JPG_SCORE,
    ".jpeg": JPG_SCORE,
    ".gif": -35,
    ".svg": SVG_SCORE
  };
  function isImageExtension(ext) {
    var imgExts = Object.keys(imageScores);
    return imgExts.indexOf(ext) !== -1;
  }
  function isSVGSource(src) {
    var ext = urls.extname(src);
    return ".svg" === ext;
  }
  // Get <img> that can have its pixel data read --
  // 1. Must be completely loaded
  // 2. We have permission (either we're in the extension, the img is not cross-origin, or we can load it through the proxy)
  // Either pass img or src, but not both
  function getReadableImage(img, src, onReadableImageAvailable, onReadableImageError) {
    // Unsafe cross-origin request
    // - Will run into cross-origin restrictions because URL is from different origin
    // This is not an issue with the extension, because the content script doesn't have cross-origin restrictions
    var safeUrl, url = src || img.getAttribute("src"), isSafeRequest = urls.isSameOrigin(url);
    function returnImageWhenComplete(loadableImg, isInverted) {
      if (loadableImg.complete) {
        onReadableImageAvailable(loadableImg, isInverted);
      } else {
        $(loadableImg).on("load", function() {
          onReadableImageAvailable(loadableImg, isInverted);
        }).on("error", onReadableImageError);
      }
    }
    if (isSafeRequest) {
      if (img && "img" === img.localName) {
        returnImageWhenComplete(img);
        // The <img> in the DOM can have its pixels queried
        return;
      }
      // Element we want to read is not an <img> -- for example, <input type="image">
      // Create an <img> with the same url so we can apply it to the canvas
      safeUrl = url;
      returnImageWhenComplete(createSafeImage(safeUrl));
    }
    // Uses inverted image for analysis so that if we need to display it, it's already in users cache.
    // The inverted image will show the same number of brightness values in the histogram so this won't effect classification
    invertUrl.getInvertUrl(url, img).then(function(newUrl) {
      returnImageWhenComplete(createSafeImage(newUrl, true));
    });
  }
  function createSafeImage(url) {
    var $safeImg = $("<img>").attr("crossorigin", "anonymous").attr("src", url);
    return $safeImg[0];
  }
  // Either pass img or src, but not both
  function getImageData(img, src, rect, processImageData) {
    var ctx, imageData, canvas = document.createElement("canvas"), top = rect.top || 0, left = rect.left || 0, width = rect.width, height = rect.height;
    canvas.width = width;
    canvas.height = height;
    function onReadableImageAvailable(readableImg, isInverted) {
      ctx = canvas.getContext("2d");
      try {
        ctx.drawImage(readableImg, top, left, width, height);
      } catch (ex) {
        processImageData();
        // No data -- probably a broken image
        return;
      }
      imageData = ctx.getImageData(0, 0, width, height).data;
      processImageData(imageData, isInverted);
    }
    function onImageError() {
      processImageData();
    }
    getReadableImage(img, src, onReadableImageAvailable, onImageError);
  }
  // Either pass img or src, but not both
  function getPixelInfo(img, src, rect, processPixelInfo) {
    getImageData(img, src, rect, function(data, isInverted) {
      processPixelInfo(data && getPixelInfoImpl(data, rect.width, rect.height, isInverted));
    });
  }
  function getPixelInfoImpl(data, width, height, isInverted) {
    //
    // Compute Image Features (if we can...)
    // We may not be able to if the image is not from the same origin.
    //
    var grayscaleVal, hueIndex, numWithSameGrayscale, histogramIndex, grayscaleHistogram = [], GRAYSCALE_HISTOGRAM_SIZE = 500, hueHistogram = [], HUE_HISTOGRAM_SIZE = 100, byteIndex = 0, hasTransparentPixels = false, DWORD_SIZE = 4, numBytes = width * height * DWORD_SIZE, numDifferentGrayscaleVals = 0, numMultiUseGrayscaleVals = 0, numDifferentHues = 0, maxSameGrayscale = 0, MAX_PIXELS_TO_TEST = 523, area = height * width, stepSize = Math.floor(area / Math.min(area, MAX_PIXELS_TO_TEST)), MIN_TRANSPARENCY_FOR_VALID_PIXEL = .3, numPixelsToCheck = Math.floor(area / stepSize), // Greater of: 6 pixels or 5% of total pixels checked
    numSameBeforeConsideredMultiUse = Math.max(Math.ceil(.05 * numPixelsToCheck), 6), numPixelsChecked = 0, luminanceTotal = 0, maxLuminance = 0;
    for (;byteIndex < numBytes; byteIndex += DWORD_SIZE * stepSize) {
      var rgba = {
        r: data[byteIndex],
        g: data[byteIndex + 1],
        b: data[byteIndex + 2],
        a: data[byteIndex + 3]
      }, isSemiTransparent = rgba.a < 255;
      if (isSemiTransparent) {
        // Alpha channel
        hasTransparentPixels = true;
        if (rgba.a < MIN_TRANSPARENCY_FOR_VALID_PIXEL) {
          continue;
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
      grayscaleVal = colorUtil.getFastLuminance(rgba);
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
      } else {
        grayscaleHistogram[histogramIndex] = 1;
        ++numDifferentGrayscaleVals;
      }
      hueIndex = Math.floor(colorUtil.rgbToHsl(rgba.r, rgba.g, rgba.b).h * HUE_HISTOGRAM_SIZE);
      if (hueHistogram[hueIndex] > 0) {
        ++hueHistogram[hueIndex];
      } else {
        hueHistogram[hueIndex] = 1;
        ++numDifferentHues;
      }
    }
    return {
      hasTransparentPixels: hasTransparentPixels,
      numDifferentGrayscaleVals: numDifferentGrayscaleVals,
      numMultiUseGrayscaleVals: numMultiUseGrayscaleVals,
      percentWithSameGrayscale: numPixelsChecked ? maxSameGrayscale / numPixelsChecked : .5,
      numDifferentHues: numDifferentHues,
      averageLuminance: numPixelsChecked ? luminanceTotal / numPixelsChecked : .5,
      maxLuminance: maxLuminance
    };
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
      return 0;
    }
    var score = 0, aspectRatio = width / height;
    // No color information
    if (height < 26) {
      score += 100;
    } else {
      if (height < 37) {
        score += 50;
      }
    }
    if (height > 180) {
      score += 180 - height;
    } else {
      if (1 === aspectRatio) {
        score *= 2;
      } else {
        if (aspectRatio > 4) {
          score += 100;
        } else {
          if (aspectRatio > 3) {
            score += 50;
          }
        }
      }
    }
    if (height < 400) {
      if (aspectRatio < .7) {
        score -= 50;
      } else {
        if (aspectRatio > 1.4 && aspectRatio < 1.9) {
          score -= 70;
          // Typical photo
          if (aspectRatio > 1.49 && aspectRatio < 1.51) {
            score -= 30;
          }
          if (height > 130) {
            score += 130 - height;
          }
        }
      }
    }
    return Math.max(score, -150);
  }
  function getExtensionScore(imageExt) {
    var defaultValue = -70;
    return "number" === typeof imageScores[imageExt] ? imageScores[imageExt] : defaultValue;
  }
  // Either pass img or src, but not both
  function getPixelInfoScore(img, src, rect, onPixelScoreAvailable) {
    if (rect.width <= 1 || rect.height <= 1) {
      onPixelScoreAvailable(0);
      // It's possible that image simply isn't loaded yet, scroll down in brewhoop.com
      return;
    }
    // The magic values in here are taken from the original machine-learned algorithms
    // from Jeff Bigham's work, and have been tweaked a bit.
    getPixelInfo(img, src, rect, function(pixelInfo) {
      if (!pixelInfo) {
        if (true && isDebuggingOn && img) {
          $(img).attr("data-sc-pixel-score", "invalid");
        }
        onPixelScoreAvailable(0, true);
        // true -> this was an expensive operation so we should cache the result
        return;
      }
      var score, BASE_SCORE = 130, DARK_LUMINANCE_THRESHOLD = .4, DARK_LUMINANCE_MAX_THRESHOLD = .35, BRIGHT_LUMINANCE_THRESHOLD = .6, analysis = {
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
      analysis.transparentPixelsScore = 100 * pixelInfo.hasTransparentPixels;
      // More values -> more likely to be photo
      analysis.manyValuesScore = -1.5 * Math.min(200, pixelInfo.numDifferentGrayscaleVals);
      // Values reused -> less likely to be a photo
      analysis.manyReusedValuesScore = 15 * Math.min(20, pixelInfo.numMultiUseGrayscaleVals);
      // One large swath of color -> less likely to be a photo. For example 30% -> +60 points
      analysis.oneValueReusedOftenScore = Math.min(50, 200 * pixelInfo.percentWithSameGrayscale);
      if (pixelInfo.hasTransparentPixels) {
        if (pixelInfo.averageLuminance > BRIGHT_LUMINANCE_THRESHOLD) {
          // This is already looks like bright text or a bright icon
          // Don't revert, because it will most likely end up as dark on dark
          analysis.brightWithTransparencyScore = -1500 * (pixelInfo.averageLuminance - BRIGHT_LUMINANCE_THRESHOLD);
        }
      } else {
        if (pixelInfo.averageLuminance < DARK_LUMINANCE_THRESHOLD) {
          // This is already a very dark image, so inverting it will make it bright -- unlikely the right thing to do
          // We don't do this for images with transparent pixels, because it is likely a dark drawing on a light background,
          // which needs to be inverted
          analysis.darkNonTransparencyScore = -1e3 * (DARK_LUMINANCE_THRESHOLD - pixelInfo.averageLuminance) - 50;
          if (pixelInfo.maxLuminance < DARK_LUMINANCE_MAX_THRESHOLD) {
            analysis.darkNonTransparencyScore *= 2;
          }
        }
      }
      // Many hues -> more likely to be a photo -- experimentation showed that 8 hues seemed to work as a threshold
      if (pixelInfo.numDifferentHues < 8) {
        // Few hues: probably not a photo -- YES invert
        analysis.numHuesScore = 1.5 * Math.pow(pixelInfo.numDifferentHues - 8, 2);
      } else {
        if (pixelInfo.numDifferentHues > 35) {
          // Many hues: probably a photo -- NO invert
          analysis.numHuesScore = pixelInfo.numDifferentHues * -2;
        }
      }
      score = BASE_SCORE + analysis.transparentPixelsScore + analysis.manyValuesScore + analysis.manyReusedValuesScore + analysis.oneValueReusedOftenScore + analysis.brightWithTransparencyScore + analysis.darkNonTransparencyScore + analysis.numHuesScore;
      // Image has full color information
      if (true && isDebuggingOn && img) {
        $(img).attr("data-sc-pixel-info", nativeGlobal.JSON.stringify(pixelInfo));
        $(img).attr("data-sc-pixel-score-breakdown", nativeGlobal.JSON.stringify(analysis));
        $(img).attr("data-sc-pixel-score", score);
      }
      onPixelScoreAvailable(score, true);
    });
  }
  function getElementTypeScore(img) {
    var BUTTON_BONUS = 50;
    switch (img.localName) {
     case "input":
      return BUTTON_BONUS;

     case "svg":
      return SVG_SCORE;

     default:
      return 0;
    }
  }
  // Uses a sitecues prefix to avoid namespace conflicts with underlying page
  // Uses a hash function on the url to reduce the amount of storage required to save results for each url
  function getStorageKey(img) {
    var STORAGE_PREFIX = "-sc-img-";
    // jshint -W016
    function getHashCode(s) {
      // From http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
      // but modified to reduce the number of collisions (by not confining the values to 32 bit)
      // For 294 images on a site, the normal 32 bit hash algorithm has a 1/100,000 chance of collision, and we are better than that.
      // For more info on hash collisions, see http://preshing.com/20110504/hash-collision-probabilities/
      return s.split("").reduce(function(a, b) {
        return (a << 5) - a + b.charCodeAt(0);
      }, 0).toString(36);
    }
    return STORAGE_PREFIX + getHashCode(img.getAttribute("src"));
  }
  // Classify an image that is loaded/loading from a src
  function classifyLoadableImage(img, onShouldReverseImage) {
    var storageKey = getStorageKey(img), cachedResult = sessionStorage.getItem(storageKey);
    function classifyLoadedImage() {
      shouldInvertElement(img, function(isReversible, didAnalyzePixels) {
        if (didAnalyzePixels) {
          // Only cache for expensive operations, in order to save on storage space
          var imageClass = isReversible ? CLASS_INVERT : CLASS_NORMAL;
          // Use session storage instead of local storage so that we don't pollute too much
          try {
            sessionStorage.setItem(storageKey, imageClass);
          } catch (ex) {}
        }
        onImageClassified(img, isReversible, onShouldReverseImage);
      });
    }
    function imageLoadError() {
      onImageClassified(img, false);
    }
    if (false) {
      // Use cached result if available
      onImageClassified(img, cachedResult === CLASS_INVERT, onShouldReverseImage);
    } else {
      if (img.complete) {
        //Image is loaded and ready for processing -- after slight delay
        nativeGlobal.setTimeout(classifyLoadedImage, 0);
      } else {
        // Too early to tell anything
        // Wait until image loaded
        $(img).on("load", classifyLoadedImage).on("error", imageLoadError);
      }
    }
  }
  /**
   * Classifier function for images without missing features.
   * This formula came from a machine learning algorithm with the help of Jeffrey Bigham
   * @param img
   * @returns {*}
   */
  function classifyImage(img, onShouldReverseImage) {
    var isReversible, $img = $(img);
    if ($img.is(customSelectors.reversible)) {
      isReversible = true;
    } else {
      if ($img.is(customSelectors.nonReversible)) {
        isReversible = false;
      } else {
        if (origBgInfo.wasOnDarkBackground(img)) {
          isReversible = false;
        } else {
          if ("svg" === img.localName) {
            isReversible = true;
          } else {
            if (!img.src) {
              isReversible = false;
            } else {
              classifyLoadableImage(img, onShouldReverseImage);
              return;
            }
          }
        }
      }
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
    var srcSet, src = img.getAttribute("src");
    if (!src) {
      srcSet = img.getAttribute("srcset");
      if (srcSet) {
        src = srcSet.split("/, /")[0];
      }
    }
    return src;
  }
  function shouldInvertElement(img, onInversionDecision) {
    var src = getSource(img);
    if (!src) {
      return false;
    }
    var imageExt = urls.extname(src);
    if (!isImageExtension(imageExt)) {
      return false;
    }
    var size = getImageSize(img), sizeScore = getSizeScore(size.height, size.width), elementTypeScore = getElementTypeScore(img), extensionScore = getExtensionScore(imageExt), finalScore = sizeScore + elementTypeScore + extensionScore;
    if (finalScore < -MAX_SCORE_CHECK_PIXELS || finalScore > MAX_SCORE_CHECK_PIXELS) {
      // Early return
      onInversionDecision(finalScore > 0);
      return;
    }
    // Pixel info takes longer to get: only do it if necessary
    getPixelInfoScore(img, null, size, function(pixelInfoScore, didAnalyzePixels) {
      finalScore += pixelInfoScore;
      if (true && isDebuggingOn) {
        $(img).attr("score", sizeScore + " (size) + " + (elementTypeScore ? elementTypeScore + " (button) + " : "") + extensionScore + " (ext) + " + pixelInfoScore + " (pixels) = " + finalScore);
      }
      onInversionDecision(finalScore > 0, didAnalyzePixels);
    });
  }
  function classify(root, onShouldReverseImage) {
    var NOT_CLASSIFIED = ":not([" + REVERSIBLE_ATTR + "])", selector = "img[src]" + NOT_CLASSIFIED + ",picture[srcset]" + NOT_CLASSIFIED + ',input[type="image"]' + NOT_CLASSIFIED + ",svg" + NOT_CLASSIFIED, $root = $(root);
    if ($root.is(selector)) {
      // Single image
      classifyImage(root, onShouldReverseImage);
    } else {
      // Subtree of potential images
      $(root).find(selector).each(function() {
        classifyImage(this, onShouldReverseImage);
      });
    }
  }
  if (true) {
    sitecues.debugImageClassifier = function() {
      isDebuggingOn = true;
      if ("complete" === document.readyState) {
        classify();
      } else {
        $(window).on("load", classify);
      }
    };
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

sitecues.define("inverter/bg-image-classifier", [ "run/conf/urls", "inverter/orig-bg-info", "inverter/img-classifier" ], function(urls, origBgInfo, imgClassifier) {
  var BG_IMAGE_BONUS = 40, MAX_SCORE_CHECK_PIXELS = 200;
  function shouldInvertBackgroundImage(src, size, onInversionDecision) {
    var imageExt = urls.extname(src);
    if (!imgClassifier.isImageExtension(imageExt)) {
      onInversionDecision(false);
      // Not a normal image extension -- don't invert
      return;
    }
    var sizeScore = imgClassifier.getSizeScore(size.height, size.width), extensionScore = imgClassifier.getExtensionScore(imageExt), finalScore = BG_IMAGE_BONUS + sizeScore + extensionScore;
    if (finalScore < -MAX_SCORE_CHECK_PIXELS || finalScore > MAX_SCORE_CHECK_PIXELS) {
      onInversionDecision(finalScore > 0);
      return;
    }
    // Pixel info takes longer to get: only do it if necessary
    imgClassifier.getPixelInfoScore(null, src, size, function(pixelInfoScore) {
      finalScore += pixelInfoScore;
      onInversionDecision(finalScore > 0);
    });
  }
  function getSampleElement(selector) {
    var elem, rect, index, REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g, elems = [], DEFAULT_RECT = {
      x: 0,
      y: 0,
      width: 20,
      height: 20
    };
    try {
      elems = document.querySelectorAll(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, ""));
    } catch (ex) {}
    // Get first visible sample element if available
    index = elems.length;
    while (index--) {
      elem = elems[index];
      rect = elem.getBoundingClientRect();
      if (0 === index || rect.width && rect.height) {
        return {
          elem: elem,
          rect: {
            x: 0,
            y: 0,
            width: rect.width,
            height: rect.height
          },
          css: getComputedStyle(elem)
        };
      }
    }
    return {
      css: {},
      rect: DEFAULT_RECT
    };
  }
  function isPlacedBeforeText(cssStyleDecl, sampleElementCss) {
    // Content with text-indent is using inner text as alternative text but placing it offscreen
    var paddingLeft = cssStyleDecl.paddingLeft || sampleElementCss.paddingLeft;
    return parseFloat(paddingLeft) > 0;
  }
  // Does it appear that the background element has hidden text?
  // If so, this is usually a technique to give a sprite alternative text
  function containsHiddenText(cssStyleDecl, sampleElementCss) {
    return cssStyleDecl.textIndent || parseInt(sampleElementCss.textIndent) < 0 || 0 === parseInt(cssStyleDecl.fontSize) || 0 === parseInt(sampleElementCss.fontSize);
  }
  // Check for CSS repeat rules which usually indicate the image is a texture/pattern
  function hasRepeat(cssStyleDecl, sampleElementCss) {
    // Look for repeat rule on the style declaration itself
    var cssDeclRepeat = cssStyleDecl.backgroundRepeat;
    if (cssDeclRepeat && cssDeclRepeat.indexOf("no-repeat") < 0) {
      return true;
    }
    // Look for repeat rule on the computed style, but don't trust 'repeat' -- it's the default
    var computedRepeat = sampleElementCss.backgroundRepeat;
    if ("repeat-x" === computedRepeat || "repeat-y" === computedRepeat) {
      return true;
    }
  }
  function classifyBackgroundImage(bgStyle, callbackFn) {
    var sampleElement, bgInfo = bgStyle.value, imageUrl = bgInfo.imageUrl, cssStyleDecl = bgStyle.rule, selector = bgStyle.rule.selectorText;
    function onImageProcessed(doReverse) {
      bgInfo.doReverse = doReverse;
      callbackFn();
    }
    sampleElement = getSampleElement(selector);
    if (hasRepeat(cssStyleDecl, sampleElement.css)) {
      // Repeating pattern such as a texture or line
      onImageProcessed(true);
      return;
    }
    if ("100%" !== cssStyleDecl.width) {
      // Spread across the page -- could be photo-like, so it's not safe to reverse unless we check the pixels
      // Make sure it's dark so that text can be visible on top of it
      // TODO should we check for visible text on top?
      if (containsHiddenText(cssStyleDecl, sampleElement.css) || isPlacedBeforeText(cssStyleDecl, sampleElement.css) || cssStyleDecl.backgroundPosition && cssStyleDecl.backgroundPosition.indexOf("%") < 0) {
        // Clearly a sprite -- reverse it so that it shows on the newly reversed background
        onImageProcessed(true);
        return;
      }
      if (sampleElement.elem) {
        if (origBgInfo.wasOnDarkBackground(sampleElement.elem)) {
          // Already designed to show on a dark background
          onImageProcessed(false);
          return;
        }
      }
    }
    shouldInvertBackgroundImage(imageUrl, sampleElement.rect, onImageProcessed);
  }
  return {
    classifyBackgroundImage: classifyBackgroundImage
  };
});

/*  Support color inversion of elements that are not text.
 *  Used for dark themes.
 */
sitecues.define("inverter/inverter", [ "$", "Promise", "run/platform", "page/style-service/style-service", "inverter/invert-url", "inverter/bg-image-classifier", "inverter/img-classifier", "inverter/orig-bg-info", "run/inline-style/inline-style" ], function($, Promise, platform, styleService, invertUrl, bgImgClassifier, imgClassifier, origBgInfo, inlineStyle) {
  var mutationObserver, filterProperty, // Use proxy in IE and Safari, because: no css invert in IE, and it's extremely slow in Safari
  SHOULD_USE_PROXY, inverseSpriteSheet, $allReversibleElems = $(), INVERSE_SPRITE_STYLESHEET_ID = "sitecues-js-invert-sprites", isCurrentlyInverting = false;
  // This method is called when the site goes from dark to light or light to dark. When it goes to dark,
  // it will analyze images if they haven't been analyzed before, and start a mutation observer so that
  // new incoming images are also analyzed.
  function toggle(doInversions) {
    if (isCurrentlyInverting === doInversions) {
      return;
    }
    isCurrentlyInverting = doInversions;
    if (doInversions) {
      start();
    } else {
      stop();
    }
    toggleSheet(inverseSpriteSheet, !doInversions);
  }
  function stop() {
    reverseElems($allReversibleElems, false);
    $allReversibleElems = $();
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }
  function start() {
    refresh(document.body);
    if (!mutationObserver) {
      mutationObserver = new MutationObserver(onMutation);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  function onMutation(mutationRecords) {
    mutationRecords.forEach(function(mutationRecord) {
      var addedNodes = mutationRecord.addedNodes, index = addedNodes.length;
      while (index--) {
        refresh(addedNodes[index]);
      }
    });
  }
  function refresh(root) {
    function onClassifiedAsReversible(elem) {
      $allReversibleElems.add(elem);
      reverseElems($(elem), true);
    }
    classifyIframes(root, onClassifiedAsReversible);
    imgClassifier.classify(root, onClassifiedAsReversible);
  }
  // Invert image or element via CSS filter: invert(1)
  function reverseElemCss($img, doReverse) {
    var savedFilter = $img.attr("data-sc-filter"), styles = {};
    if (doReverse) {
      // Add filter
      if (null === savedFilter) {
        $img.attr("data-sc-filter", $img.css(filterProperty));
      }
      styles[filterProperty] = "invert(1)";
    } else {
      // Clear filter
      styles[filterProperty] = savedFilter || "";
    }
    inlineStyle.override($img.get(), styles);
  }
  // Invert image via our reversal proxy web service
  function reverseElemProxy($img, doReverse, currentSrc) {
    var savedSrc = $img.attr("data-sc-src");
    if (doReverse) {
      // Add proxied src
      if (!savedSrc) {
        // First time
        currentSrc = $img.attr("src");
        $img.attr("data-sc-src", currentSrc);
        savedSrc = currentSrc;
      }
      invertUrl.getInvertUrl(savedSrc).then(function(newUrl) {
        $img.attr("src", newUrl);
      });
    } else {
      // Clear proxied src
      $img.attr("src", savedSrc || "");
    }
  }
  function reverseElems($elems, doReverse) {
    $elems.each(function() {
      var src = this.getAttribute("src") || "", // The image proxy can't handle svg images
      isSVG = imgClassifier.isSVGSource(src), reverseElem = src && !isSVG && SHOULD_USE_PROXY ? reverseElemProxy : reverseElemCss;
      reverseElem($(this), doReverse, src);
    });
  }
  function classifyIframes(root, reverseCallbackFn) {
    var $iframes, $root = $(root), //NOT_REVERSIBLE_FRAME_REGEX = /.*youtube|.*\.vine\.|\.eplayer/,
    REVERSIBLE_FRAME_REGEX = /twitter/;
    function isReversibleFilter(index, elem) {
      return "true" === elem.getAttribute("data-sc-reversible") || "true" === elem.getAttribute("allowtransparency") || elem.src && elem.src.match(REVERSIBLE_FRAME_REGEX);
    }
    $iframes = $root.find("iframe").filter(isReversibleFilter);
    if ("iframe" === root.localName && isReversibleFilter(0, root)) {
      $iframes.add(root);
    }
    $iframes.each(function() {
      reverseCallbackFn(this);
    });
  }
  function isReversibleBg(style) {
    // Return a promise to a CSS text for reversed sprites
    return style.value.doReverse;
  }
  // Reverse background images
  function getCssForOneSprite(style) {
    var imageUrl = style.value.imageUrl, selector = style.rule.selectorText;
    return invertUrl.getInvertUrl(imageUrl).then(function(newUrl) {
      return selector + "{\nbackground-image: url(" + newUrl + ") !important;\n}\n";
    });
  }
  // No longer needed once we kill off Chrome <= 52 and Safari <= 9.2
  // At that point it will only be 'filter'
  function getFilterProperty() {
    var div = document.createElement("div"), divStyle = inlineStyle(div);
    divStyle.filter = "invert(1)";
    return divStyle.filter ? "filter" : platform.cssPrefix + "filter";
  }
  function toggleSheet(sheet, isDisabled) {
    sheet.disabled = isDisabled;
  }
  // Return a promise that inversions are ready to use
  function init(themeStyles) {
    // Already initialized?
    if (inverseSpriteSheet) {
      return Promise.resolve();
    }
    // Not initialized yet
    // The filter value doesn't work in IE, and is *extremely* slow in Safari
    // It does work well in Edge, Chrome and Firefox
    SHOULD_USE_PROXY = platform.browser.isIE || platform.browser.isSafari;
    filterProperty = getFilterProperty();
    function classifyBgImages() {
      return new Promise(function(resolve) {
        // Update theme styles with bg info
        var bgImageStyles = themeStyles.filter(isBgImageStyle), numImagesRemainingToClassify = bgImageStyles.length;
        function isBgImageStyle(info) {
          return "background-image" === info.value.prop;
        }
        function nextImage() {
          if (0 === numImagesRemainingToClassify--) {
            resolve();
          }
        }
        nextImage();
        // In case we started with zero images
        bgImageStyles.forEach(function(bgImageInfo) {
          bgImgClassifier.classifyBackgroundImage(bgImageInfo, nextImage);
        });
      });
    }
    function getReverseSpriteCssText() {
      var reversibleBgStyles = themeStyles.filter(isReversibleBg);
      return Promise.all(reversibleBgStyles.map(getCssForOneSprite)).then(function(allCss) {
        return allCss.join("\n");
      });
    }
    // Create inverseSpriteSheet only once
    return origBgInfo.init(themeStyles).then(classifyBgImages).then(getReverseSpriteCssText).then(function(inverseSpriteCss) {
      inverseSpriteCss = "@media screen {\n" + inverseSpriteCss + "\n}";
      // Do not use in print!
      var $sheet = styleService.updateSheet(INVERSE_SPRITE_STYLESHEET_ID, {
        text: inverseSpriteCss
      });
      return new Promise(function(resolve) {
        styleService.getDOMStylesheet($sheet, resolve);
      });
    }).then(function(domStyleSheet) {
      inverseSpriteSheet = domStyleSheet;
    });
  }
  return {
    init: init,
    toggle: toggle
  };
});

sitecues.define("inverter", function() {});
//# sourceMappingURL=inverter.js.map