/*  Support color inversion of elements that are not text.
 *  Used for dark themes.
 */

define([
  '$',
  'Promise',
  'core/platform',
  'page/style-service/style-service',
  'inverter/bg-image-classifier',
  'inverter/img-classifier'
  ],
  function($,
           Promise,
           platform,
           styleService,
           bgImgClassifier,
           imgClassifier) {

  var mutationObserver,
    $allReversibleElems = $(),
    filterProperty,
    // Use proxy in IE and Safari, because: no css invert in IE, and it's extremely slow in Safari
    SHOULD_USE_PROXY,
    inverseSpriteSheet,
    INVERSE_SPRITE_STYLESHEET_ID = 'sitecues-js-invert-sprites';

  function toggle(doStart, doRefreshImages) {
    if (doStart) {
      start(doRefreshImages);
    }
    else {
      stop();
    }

    toggleSheet(inverseSpriteSheet, !doStart);
  }

  function stop() {
    reverseElems($allReversibleElems, false);
    $allReversibleElems = $();
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }

  function start(doRefreshImages) {
    refresh(document.body);

    if (doRefreshImages) {
      if (!mutationObserver) {
        try {
          mutationObserver = new MutationObserver(onMutation);
          mutationObserver.observe(document.body, { childList: true, subtree: true });
        }
        catch (ex) {
        }
      }
    }
  }

  function onMutation(mutationRecords) {
    mutationRecords.forEach(function(mutationRecord) {
      var addedNodes = mutationRecord.addedNodes,
        index = addedNodes.length;

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
    var savedFilter = $img.attr('data-sc-filter');
    if (doReverse) {
      // Add filter
      if (savedFilter === null) {
        $img.attr('data-sc-filter', $img.css(filterProperty));
      }
      $img.css(filterProperty, 'invert(1)');
    }
    else {
      // Clear filter
      $img.css(filterProperty,  savedFilter || '');
    }
  }

  // Invert image via our reversal proxy web service
  function reverseElemProxy($img, doReverse, currentSrc) {
    var savedSrc = $img.attr('data-sc-src');
    if (doReverse) {
      // Add proxied src
      if (!savedSrc) {
        // First time
        currentSrc = $img.attr('src');
        $img.attr('data-sc-src', currentSrc);
        savedSrc = currentSrc;
      }
      $img.attr('src', imgClassifier.getInvertUrl(savedSrc));
    }
    else {
      // Clear proxied src
      $img.attr('src',  savedSrc || '');
    }
  }

  function reverseElems($elems, doReverse) {
    $elems.each(function() {
      var src = this.getAttribute('src'),
        reverseElem = (src && SHOULD_USE_PROXY) ? reverseElemProxy : reverseElemCss;
      reverseElem($(this), doReverse, src);
    });
  }

  function classifyIframes(root, reverseCallbackFn) {
    var $root = $(root),
      //NOT_REVERSIBLE_FRAME_REGEX = /.*youtube|.*\.vine\.|\.eplayer/,
      REVERSIBLE_FRAME_REGEX = /twitter/,
      $iframes;

    function isReversibleFilter(index, elem) {
      return elem.getAttribute('data-sc-reversible') === 'true' ||
          elem.getAttribute('allowtransparency') === 'true' ||
          (elem.src && elem.src.match(REVERSIBLE_FRAME_REGEX));
    }

    $iframes = $root.find('iframe').filter(isReversibleFilter);

    if (root.localName === 'iframe' && isReversibleFilter(0, root)) {
      $iframes.add(root);
    }

    $iframes.each(function() {
      reverseCallbackFn(this);
    });
  }

  function getReverseSpriteCssText(themeStyles) {
    // Reverse background images
    function getCssForOneSprite(bgInfo, selector) {
      if (!bgInfo.doReverse) {
        return '';
      }

      return selector + '{\n' +
        'background-image: url(' + imgClassifier.getInvertUrl(bgInfo.imageUrl) + ') !important;\n' +
        '}\n';
    }
    var styleSheetText = '';

    // Backgrounds
    themeStyles.forEach(function(style) {
      // Don't alter buttons -- it will change it from a native button and the appearance will break
      // color, background-color
      if (style.value.prop === 'background-image') {
        styleSheetText += getCssForOneSprite(style.value, style.rule.selectorText);
      }
    });

    return styleSheetText;
  }

  function getFilterProperty() {
    var div = document.createElement('div');
    div.style.filter = 'invert(1)';
    return div.style.filter ? 'filter': platform.cssPrefix + 'filter';
  }

  function classifyBgImages(themeStyles) {
    return new Promise(function(resolve) {
      // Update theme styles with bg info
      var bgImageStyles = themeStyles.filter(isBgImageStyle),
        numImagesRemainingToClassify = bgImageStyles.length;

      function isBgImageStyle(info) {
        return info.value.prop === 'background-image';
      }

      function nextImage() {
        if (numImagesRemainingToClassify-- === 0) {
          resolve();
        }
      }

      nextImage();  // In case we started with zero images

      bgImageStyles.forEach(function (bgImageInfo) {
        bgImgClassifier.classifyBackgroundImage(bgImageInfo, nextImage);
      });
    });
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

    // Create inverseSpriteSheet only once
    return classifyBgImages(themeStyles)
      .then(createSpriteSheet)
      .then(function(domStyleSheet) {
        inverseSpriteSheet = domStyleSheet;
      });

    function createSpriteSheet() {
      return new Promise(function (resolve) {
        // Create style sheet
        var inverseSpriteCss = getReverseSpriteCssText(themeStyles),
          $sheet = styleService.updateSheet(INVERSE_SPRITE_STYLESHEET_ID, inverseSpriteCss);

        // Return a promise to the DOM stylesheet
        styleService.getDOMStylesheet($sheet, resolve);
      });
    }
  }

  return {
    init: init,
    toggle: toggle,
    getReverseSpriteCssText: getReverseSpriteCssText
  };

});
