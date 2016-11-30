define(
  [
    'run/conf/urls',
    'inverter/orig-bg-info',
    'inverter/img-classifier'
  ],
  function(
    urls,
    origBgInfo,
    imgClassifier
  ) {
  'use strict';

  var
    BG_IMAGE_BONUS = 40,
    MAX_SCORE_CHECK_PIXELS = 200;

  function shouldInvertBackgroundImage(src, size, onInversionDecision) {
    var imageExt = urls.extname(src);

    if (!imgClassifier.isImageExtension(imageExt)) {
      onInversionDecision(false);  // Not a normal image extension -- don't invert
      return;
    }

    var sizeScore = imgClassifier.getSizeScore(size.height, size.width),
      extensionScore = imgClassifier.getExtensionScore(imageExt),
      finalScore = BG_IMAGE_BONUS + sizeScore + extensionScore;

    if (finalScore < -MAX_SCORE_CHECK_PIXELS || finalScore > MAX_SCORE_CHECK_PIXELS) {
      onInversionDecision(finalScore > 0);
      return;
    }

    // Pixel info takes longer to get: only do it if necessary
    imgClassifier.getPixelInfoScore(null, src, size, function (pixelInfoScore) {
      finalScore += pixelInfoScore;
      onInversionDecision(finalScore > 0);
    });
  }

  function getSampleElement(selector) {
    var REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g,
      elems = [], elem, rect, index,
      DEFAULT_RECT = { x: 0, y: 0, width: 20, height: 20 };

    try {
      elems = document.querySelectorAll(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, ''));
    }
    catch(ex) {}

    // Get first visible sample element if available
    index = elems.length;
    while (index -- ) {
      elem = elems[index];
      rect = elem.getBoundingClientRect();
      if (index === 0 || (rect.width && rect.height)) {
        return {
          elem: elem,
          rect: { x: 0, y: 0, width: rect.width, height: rect.height },
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
    return cssStyleDecl.textIndent || parseInt(sampleElementCss.textIndent) < 0 ||
      parseInt(cssStyleDecl.fontSize) === 0 || parseInt(sampleElementCss.fontSize) === 0;
  }

  // Check for CSS repeat rules which usually indicate the image is a texture/pattern
  function hasRepeat(cssStyleDecl, sampleElementCss) {

    // Look for repeat rule on the style declaration itself
    var cssDeclRepeat = cssStyleDecl.backgroundRepeat;
    if (cssDeclRepeat && cssDeclRepeat.indexOf('no-repeat') < 0) {
      return true; // This means it's repeat, repeat-x or repeat-y
    }

    // Look for repeat rule on the computed style, but don't trust 'repeat' -- it's the default
    var computedRepeat = sampleElementCss.backgroundRepeat;
    if (computedRepeat === 'repeat-x' || computedRepeat === 'repeat-y') {
      return true;
    }
  }

  function classifyBackgroundImage(bgStyle, callbackFn) {
    var
      bgInfo = bgStyle.value,
      imageUrl = bgInfo.imageUrl,
      cssStyleDecl = bgStyle.rule,
      selector = bgStyle.rule.selectorText,
      sampleElement;

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

    if (cssStyleDecl.width !== '100%') {
      // Spread across the page -- could be photo-like, so it's not safe to reverse unless we check the pixels
      // Make sure it's dark so that text can be visible on top of it
      // TODO should we check for visible text on top?
      if (containsHiddenText(cssStyleDecl, sampleElement.css) || isPlacedBeforeText(cssStyleDecl, sampleElement.css) ||
        (cssStyleDecl.backgroundPosition && cssStyleDecl.backgroundPosition.indexOf('%') < 0)) {
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