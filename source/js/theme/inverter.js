/*  Support color inversion of elements that are not text.
 *  Used for dark themes.
 */

  define(['$', 'core/conf/user/manager', 'page/style-service/style-service', 'core/platform',
    /*, 'theme/img-classifier' */],
  function($, conf, styleService, platform/* , imgClassifier */) {

  var mutationObserver,
    $allReversibleElems = $(),
    filterProperty = (function() {
      var div = document.createElement('div');
      div.style.filter = 'invert(1)';
      return div.style.filter ? 'filter': platform.cssPrefix + 'filter';
    })();

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
    // SMART-INVERT: imgClassifier.classify(root, onClassifiedAsReversible);

    if (doRefreshImages) {
      refreshBackgroundImageStyles(root);
    }
  }

  function reverseElems($elems, doReverse) {
    $elems.each(function() {
      var $this = $(this),
        savedFilter = this.getAttribute('data-sc-filter');
      if (doReverse) {
        // Add filter
        if (savedFilter === null) {
          this.setAttribute('data-sc-filter', $this.css(filterProperty));
        }
        $this.css(filterProperty, 'invert(1)');
      }
      else {
        // Clear filter
        $this.css(filterProperty,  savedFilter || '');
      }
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
