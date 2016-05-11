/**
 * Post-zoom hacks to make form controls render correctly
 */

define(['$', 'core/platform'], function ($, platform) {

    var DEFAULT_COMBOBOX_ZOOM_CSS = {
        outlineOffset: '2px',  // Make sure focus outline goes outside
        transformOrigin: '0 0',
        '-webkit-transform-origin': '0 0'
      },
      getComboboxFixesFn = (function() {
        // The purpose of these functions is best described here: http://i.imgur.com/CgrMo.gif
        if (platform.browser.isWebKit) {
          // In WebKit, the dropdown menu is:
          // - Placed correctly
          // - Sized too small
          return getWebkitComboboxFixes;
        }
        else if (platform.browser.isFirefox) {
          // In Firefox, the dropdown menu is:
          // - Placed wrong
          // - Sized too small
          return getFirefoxComboboxFixes;
        }
      })();

    // Add useful zoom fixes for forms that render incorrectly with CSS transform
    function applyZoomFixes(currZoom) {
      // **** Buttons ****
      if (platform.browser.isChrome) {
        // In WebKit, buttons are weird
        // http://i.imgur.com/CgrMo.gif
        $('body>input,button').css(platform.transformPropertyCss, 'scale3d(1,1,1)');
      }

      // **** Comboboxes (<select>) ****
      if (!getComboboxFixesFn) {
        return;
      }

      var completedZoom = currZoom,
        undoTransformScale = 'scale(' + 1/completedZoom + ') ',
        COMBOBOX_SELECTOR = 'select[size="1"],select:not([size])';  // We don't want size >= 2, which is a listbox

      $(COMBOBOX_SELECTOR).each(function() {
        var $combobox = $(this);
        clearComboboxCssFixes($combobox);

        var desiredRect = this.getBoundingClientRect();

        // 1. Init combobox zoom fix data
        if (!$combobox.data('sc-sizing')) {  // We only init the data the first time we encounter the combobox
          initComboboxSizingData($combobox, desiredRect, completedZoom);
        }

        // 2. Apply CSS fixes
        var origSize = $combobox.data('sc-sizing'),
          fixes = getComboboxFixesFn(desiredRect, origSize, completedZoom);
        $combobox
          .css(platform.transformPropertyCss, undoTransformScale)
          .css(DEFAULT_COMBOBOX_ZOOM_CSS)
          .css(fixes.css)
          .children().css(fixes.childCss || {});

        removeExtraSpaceAroundFixedCombobox($combobox, fixes.removeSpaceRight, undoTransformScale);
      });
    }

    function initComboboxSizingData($combobox, initialRect, completedZoom) {
      // It's important to get these size measurements before before we mess with it
      $combobox
        .data('sc-sizing', {
          width: initialRect.width / completedZoom,
          height: initialRect.height / completedZoom,
          fontSize: parseFloat($combobox.css('fontSize'))
        });
    }

    function getWebkitComboboxFixes(desiredRect, origSize, completedZoom) {
      return {
        css: {
          height: origSize.height + 'px',
          width: origSize.width + 'px',
          zoom: completedZoom
        },
        removeSpaceRight: (origSize.width - desiredRect.width) / completedZoom
      };
    }

    function getFirefoxComboboxFixes(desiredRect, origSize, completedZoom) {
      var fontSizeCss = (origSize.fontSize * completedZoom) + 'px';
      return {
        css: {
          height: (origSize.height * completedZoom) + 'px',
          width: (origSize.width * completedZoom) + 'px',
          // Reverse the scale applied so that the location of the dropdown menu is in the correct place
          fontSize: fontSizeCss,
          // Use the same amount of space on the left side of the label
          paddingLeft: (9 * (completedZoom - 1)) + 'px'
          // Add padding so that selection options doesn't overflow the <select>'s visible bounding box / dropmarker
          // TODO remove if unnecessary -- does not seem necessary now that we get the width right
          // paddingRight: (24 * (completedZoom - 1)) + 'px'
        },
        childCss: {
          fontSize: fontSizeCss
        },
        removeSpaceRight: origSize.width * (1 - completedZoom)
      };
    }

    function clearComboboxCssFixes($combobox) {
      $combobox
        .css({
          zoom: '',
          transform: '',
          margin: '',
          padding: '',
          fontSize: ''
        });
    }

    function removeExtraSpaceAroundFixedCombobox($combobox, removeSpaceRight, transformScale) {
      var combobox = $combobox[0],
        preSpaceRemovalRect = combobox.getBoundingClientRect(),
        removeSpaceVert = '-99px';

      // Suck in the extra space we created
      $combobox.css({
        marginRight: removeSpaceRight + 'px',
        marginTop: removeSpaceVert,
        marginBottom: removeSpaceVert
      });

      // Adjust vertical position so that it remains where it was before space removal
      var postSpaceRemovalRect = combobox.getBoundingClientRect(),
        transY = preSpaceRemovalRect.top - postSpaceRemovalRect.top + getExtraTranslateY($combobox);
      $combobox.css('transform', transformScale + 'translateY(' + transY + 'px)');
    }

    function getExtraTranslateY($combobox) {
      var appearance = $combobox.css('appearance');
      if (appearance === 'none') {
        return 0;
      }
      return platform.browser.isWebKit ? 1 : 5;
    }

    return {
      applyZoomFixes: applyZoomFixes
    };
  });
