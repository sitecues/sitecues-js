/*  Support color inversion of elements that are not text.
 *  Used for dark themes.
 */

  define(['$', 'core/conf/user/manager', 'page/style-service/style-service', 'core/platform',
    'theme/img-classifier'],
  function($, conf, styleService, platform, imgClassifier) {

  var mutationObserver,
    $allReversibleElems = $(),
    filterProperty = (function() {
      var div = document.createElement('div');
      div.style.filter = 'invert(1)';
      return div.style.filter ? 'filter': platform.cssPrefix + 'filter';
    })(),
    // Use proxy in IE and Safari, because: no css invert in IE, and it's extremely slow in Safari
    SHOULD_USE_PROXY = platform.browser.isIE || platform.browser.isSafari;

  function toggle(doStart, doRefreshImages) {
    if (doStart) {
      start(doRefreshImages);
    }
    else {
      stop();
    }
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
    refresh(document.body, doRefreshImages);

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
        refresh(addedNodes[index], true);
      }
    });
  }

  function refresh(root, doRefreshImages) {

    function onClassifiedAsReversible(elem) {
      $allReversibleElems.add(elem);
      reverseElems($(elem), true);
    }

    classifyIframes(root, onClassifiedAsReversible);
    imgClassifier.classify(root, onClassifiedAsReversible);

    if (doRefreshImages) {
      refreshBackgroundImageStyles(root);
    }
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
      currentSrc = $img.attr('src');
      // Add proxied src
      if (savedSrc === null) {
        $img.attr('data-sc-src', currentSrc);
      }
      $img.css('src', imgClassifier.getInvertUrl(currentSrc));
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

  function refreshBackgroundImageStyles() {

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


  return {
    toggle: toggle
  };

});
