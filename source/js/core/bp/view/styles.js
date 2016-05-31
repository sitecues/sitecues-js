define(['core/bp/helper', 'core/platform', 'core/conf/site'],
  function (helper, platform, site) {

  var
    isInitialized,

    isAnimationDebuggingOn = false,

    palette,
    hasCustomPalette,
    customBadgePalette,

    doWebKitPrefix,

    BASE_SHEET_ID    = 'sitecues-js-bp-css',

    BASE_CSS;

  function toCSS(jsonObject) {

    var styles = '';
    var isTransformPrefixNeeded = document.createElement('p').style.transform === undefined;

    for (var selector in jsonObject) {
      if (jsonObject.hasOwnProperty(selector)) {
        styles += selector + ' {\n';
        for (var attribute in jsonObject[selector]) {
          if (jsonObject[selector].hasOwnProperty(attribute)) {
            var value = jsonObject[selector][attribute];
            if (isTransformPrefixNeeded) {
              if (attribute === 'transform' || attribute === 'transition' ||
                attribute === 'transform-origin') {
                // TEMPORARY DEBUGGING CODE
                if (SC_DEV && isAnimationDebuggingOn && attribute === 'transition') {
                  value = value.replace('.', ''); // Slow down transition
                }
                if (doWebKitPrefix) {
                  attribute = '-webkit-' + attribute;
                  value = value.replace('transform', '-webkit-transform');
                }
              }
            }
            styles += '  ' + attribute + ': ' + value + ';\n';
          }
        }
        styles += '}\n';
      }
    }

    return styles;
  }

  function initBaseCss() {
    BASE_CSS = {
      /**
       General CSS rules for panel

       Basic structure of panel:
       <sc #scp-bp-container>
       <sc #scp-close-button>
       <sc .scp-feature-content>
       <svg #scp-svg>
       <defs>
       <g #scp-main>
       #scp-zoom-slider
       #scp-speech›
       ...
       <g #scp-secondary>     // Secondary panel that slides down
       <g .scp-feature-content>
       <g .scp-tips> etc.
       <sc-cards>
       <sc-card>
       <sc-card>
       ...

       Classes important for CSS:
       - On #scp-bp-container
       .scp-is-badge: BP is badge
       .scp-is-panel: BP is panel
       .scp-want-badge: BP is badge or shrinking into one
       .scp-want-panel: BP is panel or expanding into one
       .scp-is-panel-only  // Only display in panel mode or when becoming panel
       .scp-keyboard: Keyboard mode
       - Elsewhere:
       .scp-secondary-only   // Only display in more panel
       .scp-feature-content // Only display in feature panel (reachable for more panel)
       .scp-hand-cursor: show a hand (aka pointer) cursor over this element
       .scp-hidden-target: a click target that is hidden (e.g. a rect that covers more area than the visible part of the target)


       ARIA roles:
       - dialog, button, checkbox (speech button), slider, link, presentation (means don't expose to screen reader)
       ARIA modes:
       - Used for CSS: aria-checked, aria-disabled
       - Not used for CSS: aria-activedescendant (focused item ID), aria-valuenow, aria-valuemin, aria-valuemax, aria-label, aria-labelledby
       */

      '#scp-bp-container,#scp-bp-container textarea': {
        // We used to do #scp-bp-container *, but this could be dangerously slow
        'box-sizing': 'content-box !important'  // In case the web page overrode it for anything
      },

      /***************** Loading/badge  ****************/

      // If there is an old badge image, do not show it -- we will show new BP-based badge in place of it
      'img#sitecues-badge, #sitecues-badge>img': {
        'visibility': 'hidden !important',
        'opacity': '0 !important'
      },

      // When panel is closed, we use position: absolute
      // When open, we use position: fixed
      '#sitecues-badge>#scp-bp-container': {
        'position': 'absolute'
      },

      // Fade in the badge when it appears
      '#scp-bp-container': {
        'position': 'fixed',
        'direction': 'ltr !important',
        'z-index': '9999999',
        'transition': 'opacity 1.5s',
        'transform-origin': '0 0',
        'text-align': 'left', // To prevent style pollution found on http://codecanyon.net/
//          'will-change': 'transform',   // Removing helps Chrome not get blurry on sitecues.com after zoom
        'outline': 0, // don't show default dotted focus outline
        '-webkit-user-select': 'none',
        '-moz-user-select': 'none',
        '-ms-user-select': 'none'
      },

      '#scp-svg': {
        'direction': 'ltr !important',
        'max-width': 'none',
        'overflow': 'hidden',
        'position': 'absolute'
      },

      // The new badge is hidden until sitecues is loaded
      // The old badge is visible until sitecues is loaded
      '#scp-bp-container.scp-loading,#sitecues-badge[aria-busy="false"]>img': {
        'opacity': '0 !important',

        // We force the <img> placeholder to have a display of block so the wrapper height
        // is the same as the <img> height.  vertical-align:top was tried, tested, but
        // it did not work on faast.org.  Below is a link to information about the problem
        // and solutions.
        // http://stackoverflow.com/questions/11447707/div-container-larger-than-image-inside
        'display': 'block'
      },

      '#scp-bp-container:not(.scp-loading)': {
        'opacity': '1 !important'
      },

      // .scp-toolbar means it's a toolbar
      '.scp-toolbar': {
        'position': 'fixed !important',
        'top': 0,
        'left': 0,
        'width': '100%',
        'height': '38px !important',
        'margin': '0 !important',  // Prevent page style pollution
        'box-sizing': 'border-box',
        'box-shadow': '1px 1px 15px 0 rgba(9, 9, 9, .5)',
        'padding': '6px 0 8px calc(50% - 66px)',
        'background-color': customBadgePalette.toolbar || '#f7fcff',  // Ensure our own theme engine doesn't turn the toolbar dark
        'z-index': '9999999',
        'direction': 'ltr !important'
      },

      '.scp-toolbar > #scp-bp-container': {
        'background-color': 'transparent !important',
        'margin': '0 !important'  // Prevent page style pollution
      },

      // Move the body down by the height of the toolbar
      'html[data-sitecues-toolbar]': {
        'padding-top': '38px !important'
      },

      /********** Transform animation speed **********/

      // TODO: Transitions are pretty efficient for opacity, but it may be worth trading
      //       that for simplicity (using JS animations for EVERYTHING).
      '#scp-main > *, .scp-wave': {
        'transition': 'fill .2s, opacity .2s'
      },

      '#scp-bottom-text': {
        'transition': 'opacity 1s',
        'visibility': 'hidden'
      },

      '.scp-is-panel text': {
        'font-family': 'Arial',
        'font-size': '29px',
        'font-weight': 'bold'
      },

      /* Text label animation for main panel labels */
      /* The problem with the text scale transition is jerkiness, so for now we delay text labels until panel is large */
      /* One way to fix this might be to render text into a canvas element, or maybe there's another font that doesn't do this */
      '.scp-is-panel #scp-bottom-text': {
        'visibility': 'visible !important',
        'opacity': '1 !important'
      },

      /************** Shadow *********************/

      '#scp-shadow': {
        'position': 'absolute',
        'top': '-437px',
        'width': '513px',
        'height': '564px',
        'background-image': 'url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20820%20902%22%20preserveAspectRatio%3D%22xMinYMin%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22shadowblur%22%3E%20%3CfeGaussianBlur%20in%3D%22SourceGraphic%22%20stdDeviation%3D%225%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Cpath%20filter%3D%22url%28%23shadowblur%29%22%20d%3D%22m808%2C888c0%2C6%20-5%2C11%20-11%2C11H11m797%2C-11v-888%22%20stroke%3D%22%23222%22%20stroke-width%3D%222%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E)'
      },

      '#scp-shadow-container': {
        'display': 'none',
        'opacity': 0,
        'pointer-events': 'none'
      },

      '.scp-want-panel #scp-shadow-container': {
        'transition': 'opacity 1s',
        'display': 'block'
      },

      '.scp-is-panel #scp-shadow-container': {
        'opacity': 1
      },

      /************ Small vs. large  *************/

      '.scp-want-panel > #scp-svg': {
        'opacity': '1 !important'
      },

      '.scp-want-panel:not(.scp-is-panel) .scp-hand-cursor': {
        'pointer-events': 'none'   // Fix for SC-2542: don't process mouseover hovers while expanding toward large state
      },

      '.scp-want-panel .scp-panel-only': { // element is visible in the large state of the badge-panel
        'opacity': '1 !important'
      },

      '.scp-want-panel #scp-mouseover-target': {
        'display': 'none'  // Don't let badge mouseover target interfere with actual use of panel
      },

      /**************** Waves ************************/

      '.scp-wave,.scp-head': {
        'pointer-events': 'none'
      },

      /* Waves use gray off state if not hovering and showing real settings (not first time badge) */
      '.scp-realsettings #scp-speech[aria-checked="false"]:not(.scp-dim-waves) > .scp-wave': {
        /* First time we're small we always show on state because it's more inviting. However, going from small to large the first time, we're going from fake on to real off. Transition gently, don't draw attention to that. */
        'fill': '#aaa' /* Gray */
      },

      '.scp-dim-waves> #scp-wave1': {
        'opacity': '.3'
      },

      '.scp-dim-waves > #scp-wave2': {
        'opacity': '.38'
      },

      '.scp-dim-waves > #scp-wave3': {
        'opacity': '.44'
      },

      /******************* More **********************/

      '.scp-classic-true #scp-more-arrow': {
        'display': 'none'
      },

      '.scp-classic-false #scp-question': {
        'display': 'none'   // Classic mode: weak browsers and sites incompatible with themes -- provide help only
      },

      '#scp-more-button-opacity': {
        'opacity': 0,
        'pointer-events': 'all'
      },

      '.scp-transition-opacity' : {
        'transition': 'opacity .8s'
      },

      '.scp-transition-opacity-fast' : {
        'transition': 'opacity 0.4s'
      },

      '.scp-transition-opacity-instant' : {
        'transition': 'opacity 0s'
      },

      '#scp-secondary, .scp-secondary-feature': {
        'display': 'none'  /* Do this here to prevent flashing in case content loads before secondary.css */
      },

      /******** Mouse targets must be hidden but still able to handle events *************/

      '.scp-hidden-target': {
        'opacity': 0
      },

      /*************** Focus **************************/

      /* Do not use outline because it ends up being larger than the visible content, at least in Firefox */
      '#sitecues-badge:focus,#scp-bp-container:focus,#scp-bp-container *:focus': {
        'outline': '0 !important'
      },

      '#sitecues-badge[aria-expanded="false"]:focus > .scp-is-badge #scp-badge-focus-rect': {
        'stroke': 'rgba(82, 168, 236, 0.8)',
        'stroke-width': '24px'
      },

      '#scp-focus-outline': {
        'box-shadow': '0 0 4px 6px rgba(82,168,236,0.8)',
        'border-radius': '4px',
        'display': 'none',
        'position': 'absolute',
        'pointer-events': 'none',
        'z-index': 99999
      },

      /*** Firefox focus rules, since getBoundingClientRect() is broken for SVG */
      // Firefox focus for SVG
      '.scp-is-panel [data-show-focus="stroke-child"]:not([data-own-focus-ring]) rect,.scp-is-panel [data-show-focus="stroke-child"]:not([data-own-focus-ring])>.scp-hidden-target': {
        'stroke': 'rgba(82,168,236,.8)',
        'stroke-width': '8px',
        'opacity': 1,
        'display': 'block',
        'fill': 'transparent',
        'z-index': -1,
        'filter': 'url(#scp-focusblur)'
      },

      // Firefox focus for HTML
      '.scp-is-panel [data-show-focus="box-shadow"]:not([data-own-focus-ring])': {
        'box-shadow': '0 0 10px 3px rgb(82,168,236)'
      },

      '.scp-is-panel.scp-keyboard:not(.scp-secondary-expanding) > #scp-focus-outline[data-show]': {
        'display': 'block'
      },

      // The feedback text area has its own focus ring so that it can show behind the feedback button :/ !
      '#scp-feedback-input-rect[data-show-focus]': {   // Using id selector which is faster than [data-own-focus-ring][data-show-focus]
        'stroke': 'rgba(82,168,236,.8)',
        'stroke-width': '6px',
        'filter': 'url(#scp-focusblur)',
        '-webkit-filter': 'url(#scp-focusblur)'
      },

      /*************** Clipping rules for badge **************************/
      // When the badge is fully collapsed, we clip it so that the invisible parts
      // of the SVG do not take mouse events.
      // The clipping is computed in placement.js
      // This rule undoes the placement.js clipping when the BP is not currently fully collapsed.
      '#scp-bp-container:not(.scp-is-badge)': {
        'clip': 'auto !important'
      },

      // ---- Badge colors (normal or object-based palette) ----
      // For instructions on setting up a palette, see https://equinox.atlassian.net/wiki/display/EN/sitecues+config+options
      '#scp-head': {
        'fill': customBadgePalette.head || '#000'
      },

      '.scp-A-button': {
        'fill': customBadgePalette.A || '#000'
      },

      '#scp-zoom-slider-thumb': {
        'fill': customBadgePalette.sliderThumb || '#447AC4'
      },

      '#scp-zoom-slider-bar': {
        'fill': customBadgePalette.sliderBar || '#383838'
      },

      '#scp-wave1': {
        'fill': customBadgePalette.wave1On || '#80A9F8'
      },

      '#scp-wave2': {
        'fill': customBadgePalette.wave2On || '#6B9AE0'
      },

      '#scp-wave3': {
        'fill': customBadgePalette.wave3On || '#447AC4'
      },

      // ----- Pre-packaged palettes -----
      // .scp-palette-n  = palette: 'normal'
      // .scp-palette-rb = palette: 'reverse-blue'
      // .scp-palette-ry = palette: 'reverse-yellow'

      // -- Reverse blue ---
      '.scp-palette-rb #scp-zoom-slider-thumb': {
        'fill': '#447AC4'
      },

      '.scp-palette-rb #scp-wave1': {
        'fill': '#80A9F8'
      },

      '.scp-palette-rb #scp-wave2': {
        'fill': '#6B9AE0'
      },

      '.scp-palette-rb #scp-wave3': {
        'fill': '#447AC4'
      },

      '.scp-palette-rb .scp-A-button, .scp-palette-rb #scp-head, .scp-palette-rb #scp-zoom-slider-bar': {
        'fill': '#fff'
      },

      '.scp-palette-rb.scp-toolbar': {
        'background-color': '#080300'
      },

      // -- Reverse yellow ---
      '.scp-palette-ry #scp-wave1': {
        'fill': '#FFE460'
      },

      '.scp-palette-ry #scp-wave2': {
        'fill': '#FFCC00'
      },

      '.scp-palette-ry #scp-wave3': {
        'fill': '#FDAC00'
      },

      '.scp-palette-ry #scp-zoom-slider-thumb': {
        'fill': '#FFCD00'
      },

      '.scp-palette-ry .scp-A-button, .scp-palette-ry #scp-head, .scp-palette-ry #scp-zoom-slider-bar': {
        'fill': '#fff'
      },

      '.scp-palette-ry.scp-toolbar': {
        'background-color': '#080300'
      },

      // -- Expanded panel colors --
      // Panel must go back to normal colors when expanded
      // This is currently true for all palettes
      '.scp-want-panel .scp-A-button, .scp-want-panel #scp-head, .scp-want-panel  #scp-zoom-slider-bar': {
        'fill': '#000'
      },

      '.scp-want-panel #scp-zoom-slider-thumb': {
        'fill': '#447AC4'
      },

      '.scp-want-panel #scp-wave1': {
        'fill': '#80A9F8'
      },

      '.scp-want-panel #scp-wave2': {
        'fill': '#6B9AE0'
      },

      '.scp-want-panel #scp-wave3': {
        'fill': '#447AC4'
      },

      '.scp-is-panel .scp-A-button:hover': {
        'fill': '#447AC4'
      },

      '.scp-is-panel #scp-zoom-slider-thumb:hover': {
        'fill': '#6B9AE0'
      },

      // General way of showing the content only if sitecues-badge is also shown.
      // Note: the page must also have the following rule:
      // .sitecues-only { visibility: hidden; opacity: 0; }
      '.sitecues-only': {
        'visibility': 'visible',
        'opacity': 1
      }
    };
  }

  function createStyleSheet(sheetId, cssDefs) {
    var sheet = document.createElement('style');
    sheet.id = sheetId;
    sheet.innerHTML = toCSS(cssDefs);
    document.head.appendChild(sheet);
  }

  function init() {
    palette = site.get('palette');
    hasCustomPalette = typeof palette === 'object';
    customBadgePalette = (hasCustomPalette && palette.badge) || {};
    doWebKitPrefix = platform.browser.isSafari;
    initBaseCss();

    if (!isInitialized) {
      isInitialized = true;
      createStyleSheet(BASE_SHEET_ID, BASE_CSS);
    }
  }

  if (SC_DEV) {
    sitecues.toggleSlowBPAnimations = function () {
      isAnimationDebuggingOn = !isAnimationDebuggingOn;
      document.head.removeChild(helper.byId(BASE_SHEET_ID));
      createStyleSheet(BASE_SHEET_ID, BASE_CSS);
    };
  }

  return {
    init: init
  };
});
