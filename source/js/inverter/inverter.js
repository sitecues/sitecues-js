/*  Support color inversion of elements that are not text.
 *  Used for dark themes.
 */

define(
  [
    '$',
    'Promise',
    'core/platform',
    'page/style-service/style-service',
    'inverter/invert-url',
    'inverter/bg-image-classifier',
    'inverter/img-classifier',
    'inverter/orig-bg-info'
  ],
  function (
    $,
    Promise,
    platform,
    styleService,
    invertUrl,
    bgImgClassifier,
    imgClassifier,
    origBgInfo
  ) {
  'use strict';

  var mutationObserver,
    $allReversibleElems = $(),
    filterProperty,
    // Use proxy in IE and Safari, because: no css invert in IE, and it's extremely slow in Safari
    SHOULD_USE_PROXY,
    inverseSpriteSheet,
    INVERSE_SPRITE_STYLESHEET_ID = 'sitecues-js-invert-sprites',
    isCurrentlyInverting         = false;

  // This method is called when the site goes from dark to light or light to dark. When it goes to dark,
  // it will analyze images if they haven't been analyzed before, and start a mutation observer so that
  // new incoming images are also analyzed.
  function toggle(doInversions) {
    if (isCurrentlyInverting === doInversions) {
      return; // Already working on inversions
    }

    isCurrentlyInverting = doInversions;

    if (doInversions) {
      start();
    }
    else {
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
      mutationObserver.observe(document.body, { childList: true, subtree: true });
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
      $img.css(filterProperty, savedFilter || '');
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

      invertUrl.getInvertUrl(savedSrc)
        .then(function(newUrl) {
          $img.attr('src', newUrl);
        });
    }
    else {
      // Clear proxied src
      $img.attr('src', savedSrc || '');
    }
  }

  function reverseElems($elems, doReverse) {
    $elems.each(function () {
      var
        src = this.getAttribute('src'),
        // The image proxy can't handle svg images
        isSVG = imgClassifier.isSVGSource(src),
        reverseElem = (src && !isSVG && SHOULD_USE_PROXY) ? reverseElemProxy : reverseElemCss;
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

  function isReversibleBg(style) {
    // Return a promise to a CSS text for reversed sprites
    return style.value.doReverse;
  }

  // Reverse background images
  function getCssForOneSprite(style) {
    var imageUrl = style.value.imageUrl,
      selector = style.rule.selectorText;
    return invertUrl.getInvertUrl(imageUrl)
      .then(function(newUrl) {
        return selector + '{\n' +
          'background-image: url(' + newUrl + ') !important;\n' +
          '}\n';
      });
  }

  function getFilterProperty() {
    var div = document.createElement('div');
    div.style.filter = 'invert(1)';
    return div.style.filter ? 'filter': platform.cssPrefix + 'filter';
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

    function getReverseSpriteCssText() {
      var reversibleBgStyles = themeStyles.filter(isReversibleBg);

      return Promise.all(reversibleBgStyles.map(getCssForOneSprite))
        .then(function(allCss) {
          return allCss.join('\n');
        });
    }

    // Create inverseSpriteSheet only once
    return origBgInfo.init(themeStyles)
      .then(classifyBgImages)
      .then(getReverseSpriteCssText)
      .then(function(inverseSpriteCss) {
        inverseSpriteCss = '@media screen {\n' + inverseSpriteCss + '\n}'; // Do not use in print!
        var $sheet = styleService.updateSheet(INVERSE_SPRITE_STYLESHEET_ID, { text : inverseSpriteCss } );
        return new Promise(function(resolve) {
          styleService.getDOMStylesheet($sheet, resolve);
        });
      })
      .then(function(domStyleSheet) {
        inverseSpriteSheet = domStyleSheet;
      });
  }

  return {
    init: init,
    toggle: toggle
  };
});
