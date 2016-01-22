define(['page/util/color', 'dark-theme/img-classifier'], function(colorUtil, imgClassifier) {
  var BG_IMAGE_BONUS = 150,
    CLASS_REVERSE = 'reverse', // Probably an icon/sprite -- reverse
    CLASS_DARKEN = 'darken', // Repeating background texture or very large background -- should be made very dark so that text shows on top (TODO in implementation)
    CLASS_NORMAL = '';  // Do nothing

  function getSampleElement(selector) {
    var REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g,
      result;
    try { result = document.querySelector(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, '')); }
    catch(ex) {}
    return result;
  }

  function isPlacedBeforeText(cssStyleDecl, sampleElementCss) {
    // Content with text-indent is using inner text as alternative text but placing it offscreen
    var paddingLeft = cssStyleDecl.paddingLeft || sampleElementCss.paddingLeft;
    return parseFloat(paddingLeft) > 0;
  }

  function getReverseBackgroundImageScore(imageUrl, rect) {
    var sizeScore = rect ? imgClassifier.getSizeScore(rect.height, rect.width) : 0,
      elementTypeScore = BG_IMAGE_BONUS,
      extensionScore = imgClassifier.getUrlScore(imageUrl),
//        img = $('<img>').attr('src', src)[0],  // TODO Would need to wait for load, or?
//        pixelInfoScore = getPixelInfoScore(img, rect),
      finalScore = sizeScore + elementTypeScore + extensionScore; // + pixelInfoScore;

    return finalScore;
  }

  // Does it appear that the background element has hidden text?
  // If so, this is usually a technique to give a sprite alternative text
  function containsHiddenText(cssStyleDecl, sampleElementCss) {
    return cssStyleDecl.textIndent || parseInt(sampleElementCss.textIndent) < 0 ||
      parseInt(cssStyleDecl.fontSize) === 0 || parseInt(sampleElementCss.fontSize) === 0;
  }

  function classifyBackgroundImage(imageUrl, cssStyleDecl, selector) {
    var hasRepeat = cssStyleDecl.backgroundRepeat && cssStyleDecl.backgroundRepeat.indexOf('no-repeat') === -1,
      sampleElement,
      sampleElementCss,
      sampleElementRect;

    if (hasRepeat) {
      // Repeating pattern such as a texture or line
      return CLASS_REVERSE;
    }

    if (cssStyleDecl.width === '100%') {
      // Spread across the page -- could be photo-like, so it's not safe to reverse unless we check the pixels
      // Make sure it's dark so that text can be visible on top of it
      // TODO should we check for visible text on top?
      return CLASS_DARKEN;
    }

    sampleElement = getSampleElement(selector);
    sampleElementCss = sampleElement ? getComputedStyle(sampleElement) : {};

    if (containsHiddenText(cssStyleDecl, sampleElementCss) || isPlacedBeforeText(cssStyleDecl, sampleElementCss) ||
      (cssStyleDecl.backgroundPosition && cssStyleDecl.backgroundPosition.indexOf('%') < 0)) {
      // Clearly a sprite -- reverse it so that it shows on the newly reversed background
      return CLASS_REVERSE;
    }

    if (sampleElement) {
      if (colorUtil.isOnDarkBackground(sampleElement)) {
        // Already designed to show on a dark background
        return CLASS_NORMAL;
      }
      sampleElementRect = sampleElement.getBoundingClientRect();
    }
    var score = getReverseBackgroundImageScore(imageUrl, sampleElementRect);

    return score > 0 ? CLASS_REVERSE : CLASS_DARKEN;
  }

  return {
    classifyBackgroundImage: classifyBackgroundImage,
    CLASS_REVERSE: CLASS_REVERSE,
    CLASS_DARKEN: CLASS_DARKEN,
    CLASS_NORMAL: CLASS_NORMAL
  };

});