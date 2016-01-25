define(['page/util/color', 'dark-theme/img-classifier'], function(colorUtil, imgClassifier) {
  var BG_IMAGE_BONUS = 100,
    MAX_SCORE_CHECK_PIXELS = 70;

  function shouldInvertBackgroundImage(src, size, onInversionDecision) {
    var imageExt = imgClassifier.getImageExtension(src);

    if (!imageExt) {
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
          rect: rect,
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

  function hasRepeat(cssStyleDecl, sampleElementCss) {

    var repeat = cssStyleDecl.backgroundRepeat || sampleElementCss.backgroundRepeat;
    return repeat && repeat.indexOf('no-repeat') === -1;
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
        if (colorUtil.isOnDarkBackground(sampleElement.elem)) {
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