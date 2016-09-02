//animation gets its own stylesheet for zoom targets
//be sure to create a new animation just for the primary body's width
//stylesheet for body fixes,
define(
  [
    '$',
    'core/platform',
    'page/zoom/state',
    'page/zoom/constants',
    'page/zoom/util/body-geometry',
    'page/zoom/config/config',
    'core/native-functions',
    'core/inline-style/inline-style',
    'core/util/array-utility'
  ],
  function (
    $,
    platform,
    state,
    constants,
    bodyGeo,
    config,
    nativeFn,
    inlineStyle,
    arrayUtil
  ) {
  'use strict';

  var
    body,
    $zoomStyleSheet,            // <style> element we insert to correct form issues in WebKit
    $zoomFormsStyleSheet,       // <style> element we insert to correct form issues in WebKit
    TRANSFORM_PROP_CSS,
    lastZoom,
    // Optimize fonts for legibility? Helps a little bit with Chrome on Windows
    shouldOptimizeLegibility,
    // Should we repaint when zoom is finished (after any animations)?
    // Should always be true in Chrome, because it makes text crisper
    // Don't use backface repainting method if there is a background-image on the <body>, because it will be erased.
    // (We still want to use the backface method when we can, because it often produces better results than our
    // other method, which is to overlay a transparent div and then remove it)
    shouldRepaintOnZoomChange,
    // Key frame animations
    SITECUES_ZOOM_ID       = constants.SITECUES_ZOOM_ID,
    SITECUES_ZOOM_FORMS_ID = constants.SITECUES_ZOOM_FORMS_ID,
    CRISPING_ATTRIBUTE   = constants.CRISPING_ATTRIBUTE,
    MAX                  = constants.MAX_ZOOM,
    MIN                  = constants.MIN_ZOOM,
    // Decimal places allowed
    ZOOM_PRECISION       = constants.ZOOM_PRECISION,
    KEYFRAMES_ID         = constants.KEYFRAMES_ID,
    // This is conjured out of thin air. Just seems to work.
    REPAINT_FOR_CRISP_TEXT_DELAY = constants.REPAINT_FOR_CRISP_TEXT_DELAY;

    // Create <style> for keyframes animations
    // For initial zoom, call with the targetZoom
    // Otherwise, it will create a reverse (zoom-out) and forward (zoom-in) style sheet
    //This needs to set up a keyframe stylesheet for each zoom target
    /*
    * Each zoom target will need to calculate a desired zoom level:
    *   a. Primary body, 0th zoom target, will calculate full zoom range and translate x / width animations as necessary
    *   b. each succeeding zoom target will use its calculated zoom level (depending on ratio of dimensions to screen size)
    * */
    //instead of taking target zoom on the initial zoom stylesheet, just take a boolean clarifying if it is
    //the initial zoom or not
    function setupNextZoomStyleSheet(targetZoom, doUseKeyFrames) {
      var css = '';

      if (doUseKeyFrames) {
        if (targetZoom) {
          // Style sheet to zoom exactly to targetZoom
          css = getAnimationCSS(targetZoom);
        }
        else {
          if (state.completedZoom > MIN) {
            // Style sheet for reverse zoom (zoom-out to 1x)
            css += getAnimationCSS(MIN);
          }
          if (state.completedZoom < MAX) {
            // Style sheet for forward zoom (zoom-in to 3x)
            css += getAnimationCSS(MAX);
          }
        }
      }

      css += getCssCrispingFixes();

      applyZoomStyleSheet(css);
    }

    // Replace current zoom stylesheet or insert a new one with the
    // requested styles plus generic stylesheet fixes for the current configuration.
    function applyZoomStyleSheet(additionalCss) {
      var styleSheetText = additionalCss || '';
      if (styleSheetText) {
        if ($zoomStyleSheet) {
          $zoomStyleSheet.text(styleSheetText);
        }
        else {
          $zoomStyleSheet = $('<style>')
            .text(styleSheetText)
            .attr('id', SITECUES_ZOOM_ID)
            .appendTo('head');
        }
      }
    }

    function applyZoomFormFixes(zoom) {
      var css;
      if (platform.browser.isWebKit) {
        // Add useful zoom fixes for forms that render incorrectly with CSS transform
        // We turn them off when data-sc-dropdown-fix off is set (need to temporarily turn off for highlight position calculation elsewhere)
        css ='select[size="1"]:not([data-sc-dropdown-fix-off]),select:not([size]):not([data-sc-dropdown-fix-off]) {' +
          platform.transformPropertyCss + ':scale(' + 1 / zoom + ') !important;' +
          'transform-origin:0% 62% !important;' +
          'margin-right:' + (13 * (1 - zoom)) + '% !important;' +
          'margin-top:' + (8 * (1-zoom)) + 'px !important;' +
          'margin-bottom:' + (8 * (1-zoom)) + 'px !important;' +
          'zoom:' + zoom + ' !important;}' +
          '\nbody[data-sc-zooming] select { transition-property: none !important; }'; // Turn off any page transitions for select during zoom, otherwise it will potentially animate the above changes
      }
      else {
        var selector = 'select[size="1"],select:not([size])';
        css = selector + ' {' +
          platform.transformPropertyCss + ': scale(' + 1 / zoom + ') !important;' +
          'transform-origin: 100% 0 !important; }' ;
        var comboBoxes = arrayUtil.toArray(document.querySelectorAll(selector));
        comboBoxes.forEach(function (box) {
          inlineStyle.restore(box, ['font-size', 'width', 'height']);
          if (zoom > 1) {
            var style     = getComputedStyle(box),
                height    = parseFloat(style.height) / (lastZoom ? lastZoom : 1),
                width     = parseFloat(style.width) / (lastZoom ? lastZoom : 1),
                newWidth  = width * zoom,
                newHeight = height * zoom;

            inlineStyle.override(box, {
              fontSize : zoom + 'em',
              height   : newHeight + 'px',
              width    : newWidth + 'px'
            });
          }
        });
        lastZoom = zoom;
      }

      // Don't use any of these rules in print
      css = '@media screen {\n' + css + '\n }';
      if (!$zoomFormsStyleSheet) {
        $zoomFormsStyleSheet = $('<style>')
          .text(css)
          .attr('id', SITECUES_ZOOM_FORMS_ID)
          .appendTo('head');
      }
      else {
        $zoomFormsStyleSheet.text(css);
      }

    }

  // This is used to repaint the DOM after a zoom in WebKit to ensure crisp text
  function getCssCrispingFixes() {
    if (shouldRepaintOnZoomChange) {
      return '\n[' + CRISPING_ATTRIBUTE + '] * { backface-visibility: hidden; }\n';
    }
    return '';
  }

  function getCssKeyFrames(targetZoom, doEase, doIncludeTimePercent) {
    var timePercent,
      animationPercent,
      step = 0,
      // For animation performance, use adaptive algorithm for number of keyframe steps:
      // Bigger zoom jump = more steps
      numSteps = Math.ceil(Math.abs(targetZoom - state.completedZoom) * 20),
      percentIncrement = 1 / numSteps,
      keyFrames = [];

    for (; step <= numSteps; ++step) {
      timePercent = step === numSteps ? 1 : step * percentIncrement;
      if (doEase) {
        // Provide simple sinusoidal easing in out effect for initial load zoom
        animationPercent = (Math.cos(Math.PI * timePercent) - 1) / -2;
      }
      else {
        animationPercent = timePercent;
      }
      var midAnimationZoom = state.completedZoom + (targetZoom - state.completedZoom) * animationPercent;
      keyFrames[step] = getZoomCss(midAnimationZoom);
      if (doIncludeTimePercent) {
        keyFrames[step].timePercent = timePercent;
      }
    }
    return keyFrames;
  }

  function getCssAnimationName(targetZoom) {
    return KEYFRAMES_ID + '-' + Math.round(state.completedZoom * 1000) + '-' + Math.round(targetZoom * 1000);
  }

    // Get keyframes css for animating from completed zoom to target zoom
    function getAnimationCSS(targetZoom) {
      var animationName = getCssAnimationName(targetZoom),
        keyFramesCssProperty = platform.browser.isWebKit ? '@-webkit-keyframes ' : '@keyframes ',
        keyFramesCss = animationName + ' {\n',
        keyFrames = getCssKeyFrames(targetZoom, state.isInitialLoadZoom, true),
        numSteps = keyFrames.length - 1,
        step = 0;

      for (; step <= numSteps; ++step) {
        var keyFrame = keyFrames[step],
          zoomCssString = TRANSFORM_PROP_CSS + ': ' + keyFrame[TRANSFORM_PROP_CSS] + (keyFrame.width ? '; width: ' + keyFrame.width : '');

        keyFramesCss += Math.round(10000 * keyFrame.timePercent) / 100 + '% { ' + zoomCssString + ' }\n';
      }
      keyFramesCss += '}\n\n';

      return keyFramesCssProperty + keyFramesCss;
    }

  // Get a CSS object for the targetZoom level
  //This needs to return the formatted translate x / width only when we're zooming the primary body
  function getZoomCss(targetZoom) {
    var transform = 'scale(' + targetZoom.toFixed(ZOOM_PRECISION) + ') ' + bodyGeo.getFormattedTranslateX(targetZoom),
      css = {};

    css[TRANSFORM_PROP_CSS] = transform;
    if (config.shouldRestrictWidth) {
      css.width = bodyGeo.getRestrictedBodyWidth(targetZoom);
    }

    return css;
  }

  // Add useful zoom fixes to the body's @style
  function fixZoomBodyCss() {
    // Allow the content to be horizontally centered, unless it would go
    // offscreen to the left, in which case start zooming the content from the left-side of the window
    inlineStyle.override(body, [platform.transformOriginProperty, config.shouldRestrictWidth ? '0 0' : '50% 0']);
    if (shouldOptimizeLegibility) {
      inlineStyle.override(body, {
        textRendering : 'optimizeLegibility'
      });
    }
  }

  /**
   * repaintToEnsureCrispText's purpose is to render text clearly in browsers (chrome only)
   * that do not repaint the DOM when using CSS Transforms.  This function simply sets a
   * property, which is hopefully not set on pages sitecues runs on, that forces repaint.
   * 15ms of time is required, because the browser may not be done transforming
   * by the time Javascript is executed without the setTimeout.
   *
   * See here: https://equinox.atlassian.net/wiki/display/EN/Known+Issues
   */
  function repaintToEnsureCrispText() {
    if (!shouldRepaintOnZoomChange) {
      return;
    }
    var $anyBody = $('body'); // Make sure we get clone body as well, if present
    $anyBody.attr(CRISPING_ATTRIBUTE, '');
    nativeFn.setTimeout(function() {
      $anyBody.removeAttr(CRISPING_ATTRIBUTE);
    }, REPAINT_FOR_CRISP_TEXT_DELAY);

    var MAX_ZINDEX = 2147483647,
      $appendedDiv = $('<sc>');

    inlineStyle.set($appendedDiv[0], {
      position        : 'fixed',
      top             : 0,
      left            : 0,
      width           : '100%',
      height          : '100%',
      opacity         : 1,
      backgroundColor : 'transparent',
      zIndex          : MAX_ZINDEX,
      pointerEvents   : 'none'
    });

    $appendedDiv.appendTo('html');

    nativeFn.setTimeout(function () {
      $appendedDiv.remove();
    }, 0);
  }

  //Restore the intended inline style when we're done transforming the body
  function restoreBodyTransitions() {
    inlineStyle.restore(body, 'transition');
  }

  //If there is a transition style applied to the body, we need to be sure that it doesn't apply to transformations
  //otherwise our zoom logic will break
  function fixBodyTransitions() {
    var style  = getComputedStyle(body),
      property = style.transitionProperty,
      delay    = style.transitionDelay.split(',').some(function (dly) {
        return parseFloat(dly);
      }),
      duration;

    if (!delay) {
      duration = style.transitionDuration.split(',').some(function (drtn) {
        return parseFloat(drtn);
      });
    }

    if (!delay && !duration) {
      return;
    }

    if (property.indexOf('all') >= 0 || property.indexOf('transform') >= 0) {
      var transitionValue = inlineStyle(body).transition;
      if (transitionValue) {
        transitionValue += ', ';
      }
      transitionValue += 'transform 0s';
      inlineStyle.override(body, {
        transition : transitionValue
      });
    }

  }

  function getZoomStyleSheet() {
    return $zoomStyleSheet;
  }

  function init() {
    body                      = document.body;
    TRANSFORM_PROP_CSS        = platform.transformPropertyCss;
    shouldRepaintOnZoomChange = platform.browser.isChrome;
    shouldOptimizeLegibility  = platform.browser.isChrome && platform.os.isWin;
  }

  return {
    setupNextZoomStyleSheet: setupNextZoomStyleSheet,
    getZoomCss: getZoomCss,
    getZoomStyleSheet: getZoomStyleSheet,
    fixZoomBodyCss: fixZoomBodyCss,
    getCssAnimationName: getCssAnimationName,
    repaintToEnsureCrispText: repaintToEnsureCrispText,
    fixBodyTransitions: fixBodyTransitions,
    restoreBodyTransitions: restoreBodyTransitions,
    applyZoomFormFixes: applyZoomFormFixes,
    init: init
  };
});