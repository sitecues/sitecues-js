sitecues.def('bp/view/styles', function (styling, callback) {
  'use strict';
  sitecues.use('bp/helper', 'bp/constants', function (helper, BP_CONST) {

    var
      isAnimationDebuggingOn = false,

      doWebKitPrefix = helper.isSafari,
      doMsPrefix = helper.isIE9,

      idDelimiter = '#',
      classDelimiter = '.',
      hover = ':hover',

      BADGE_MODE = classDelimiter + BP_CONST.SMALL,
      PANEL_MODE = classDelimiter + BP_CONST.LARGE,

      A_CLASS = classDelimiter  + BP_CONST.A_CLASS,
      SMALL_A = idDelimiter + BP_CONST.SMALL_A_ID,
      LARGE_A = idDelimiter + BP_CONST.LARGE_A_ID,

      A_CLASS_HOVER = A_CLASS + hover,
      SMALL_A_HOVER = SMALL_A + hover,
      LARGE_A_HOVER = LARGE_A + hover,

      HEAD = idDelimiter+ BP_CONST.HEAD_ID,
      WAVE_ON  = idDelimiter + BP_CONST.SPEECH_ID + '[aria-checked="true"] ',
      WAVE_OFF = idDelimiter + BP_CONST.SPEECH_ID + '[aria-checked="false"] ',
      WAVE_1_ON  = WAVE_ON  + idDelimiter + BP_CONST.WAVE_1_ID,
      WAVE_2_ON  = WAVE_ON  + idDelimiter + BP_CONST.WAVE_2_ID,
      WAVE_3_ON  = WAVE_ON  + idDelimiter + BP_CONST.WAVE_3_ID,
      WAVE_1_OFF = WAVE_OFF + idDelimiter + BP_CONST.WAVE_1_ID,
      WAVE_2_OFF = WAVE_OFF + idDelimiter + BP_CONST.WAVE_2_ID,
      WAVE_3_OFF = WAVE_OFF + idDelimiter + BP_CONST.WAVE_3_ID,

      SLIDER_BAR = idDelimiter + BP_CONST.ZOOM_SLIDER_BAR_ID,
      SLIDER_THUMB = idDelimiter + BP_CONST.ZOOM_SLIDER_THUMB_ID,
      SLIDER_THUMB_HOVER = SLIDER_THUMB + hover,

      TEXT = idDelimiter + BP_CONST.SPEECH_LABEL_ID + ' ' + idDelimiter + BP_CONST.ZOOM_LABEL_ID,
      VERTICAL_DIVIDER = idDelimiter + BP_CONST.VERT_DIVIDER_ID,
      TEXT_BACKGROUND = idDelimiter + BP_CONST.BOTTOM_ID + ' path',
      BACKGROUND = idDelimiter + BP_CONST.MAIN_OUTLINE_ID,
      BORDER = idDelimiter + BP_CONST.MAIN_OUTLINE_BORDER_ID,

    // Map the easy to understand elements of the SVG to CSS selectors.
    // This is useful for creating custom palettes for the badge and panel.
      CUSTOM_CSS_MAP = {
        'panel': {
          'largeA': PANEL_MODE + ' ' + LARGE_A,
          'smallA': PANEL_MODE + ' ' + SMALL_A,
          'A': PANEL_MODE + ' ' + A_CLASS,
          'largeAHover': PANEL_MODE + ' ' + LARGE_A_HOVER,
          'smallAHover': PANEL_MODE + ' ' + SMALL_A_HOVER,
          'AHover': PANEL_MODE + ' ' + A_CLASS_HOVER,
          'sliderBar': PANEL_MODE + ' ' + SLIDER_BAR,
          'sliderThumb': PANEL_MODE + ' ' + SLIDER_THUMB,
          'sliderThumbHover': PANEL_MODE + ' ' + SLIDER_THUMB_HOVER,
          'head': PANEL_MODE + ' ' + HEAD,
          'wave1Off': PANEL_MODE + ' ' + WAVE_1_OFF,
          'wave2Off': PANEL_MODE + ' ' + WAVE_2_OFF,
          'wave3Off': PANEL_MODE + ' ' + WAVE_3_OFF,
          'wave1On': PANEL_MODE + ' ' + WAVE_1_ON,
          'wave2On': PANEL_MODE + ' ' + WAVE_2_ON,
          'wave3On': PANEL_MODE + ' ' + WAVE_3_ON,
          'text': PANEL_MODE + ' ' + TEXT,
          'textBackground': PANEL_MODE + ' ' + TEXT_BACKGROUND,
          'background': PANEL_MODE + ' ' + BACKGROUND,
          'border': PANEL_MODE + ' ' + BORDER,
          'verticalDivider': PANEL_MODE + ' ' + VERTICAL_DIVIDER
        },
        'badge': {
          'largeA': BADGE_MODE + ' ' + LARGE_A,
          'smallA': BADGE_MODE + ' ' + SMALL_A,
          'A': BADGE_MODE + ' ' + A_CLASS,
          'sliderBar': BADGE_MODE + ' ' + SLIDER_BAR,
          'sliderThumb': BADGE_MODE + ' ' + SLIDER_THUMB,
          'head': BADGE_MODE + ' ' + HEAD,
          'wave1Off': BADGE_MODE + ' ' + WAVE_1_OFF,
          'wave2Off': BADGE_MODE + ' ' + WAVE_2_OFF,
          'wave3Off': BADGE_MODE + ' ' + WAVE_3_OFF,
          'wave1On': BADGE_MODE + ' ' + WAVE_1_ON,
          'wave2On': BADGE_MODE + ' ' + WAVE_2_ON,
          'wave3On': BADGE_MODE + ' ' + WAVE_3_ON,
          'text': BADGE_MODE + ' ' + TEXT,
          'textBackground': BADGE_MODE + ' ' + TEXT_BACKGROUND,
          'background': BADGE_MODE + ' ' + BACKGROUND,
          'border': BADGE_MODE + ' ' + BORDER,
          'verticalDivider': BADGE_MODE + ' ' + VERTICAL_DIVIDER
        },
        'both': {
          'largeA': LARGE_A,
          'smallA': SMALL_A,
          'A': A_CLASS,
          'largeAHover': LARGE_A_HOVER,
          'smallAHover': SMALL_A_HOVER,
          'AHover': A_CLASS_HOVER,
          'sliderBar': SLIDER_BAR,
          'sliderThumb': SLIDER_THUMB,
          'sliderThumbHover': SLIDER_THUMB_HOVER,
          'head': HEAD,
          'wave1Off': WAVE_1_OFF,
          'wave2Off': WAVE_2_OFF,
          'wave3Off': WAVE_3_OFF,
          'wave1On': WAVE_1_ON,
          'wave2On': WAVE_2_ON,
          'wave3On': WAVE_3_ON,
          'text': TEXT,
          'textBackground': TEXT_BACKGROUND,
          'background': BACKGROUND,
          'border': BORDER,
          'verticalDivider': VERTICAL_DIVIDER
        }
      },

      BASE_CSS = {
        /**
         General CSS rules for panel

         Basic structure of panel:
         <div #scp-bp-container>
         <div #scp-close-button>
         <div .scp-feature-content>
         <svg #scp-svg>
         <defs>
         <g #scp-main>
         #scp-zoom-slider
         #scp-speech›
         ...
         <g #scp-more>     // Secondary panel that slides down
         <g .scp-feature-content>
         <g .scp-feature-tips-content> etc.
         .cards
         .card
         .card
         ...

         Classes important for CSS:
         - On #scp-bp-container
         .scp-small: Badge mode
         .scp-shrinking: Still shrinking into badge mode
         .scp-large: Panel mode (or in transtion to panel)
         .scp-ready: Fully expanded panel mode
         .scp-animate: Enable CSS animations (e.g. do not enable when first showing badge)
         .scp-keyboard: Keyboard mode
         - Elsewhere:
         .scp-large-only  // Only display in large mode
         .scp-more-only   // Only display in more panel
         .scp-feature-content // Only display in feature panel (reachable for more panel)
         .scp-target: both a click target and good for showing keyboard focus rectangles
         .scp-hidden-target: a click target that is hidden (e.g. a rect that covers more area than the visible part of the target)


         ARIA roles:
         - dialog, button, checkbox (speech button), slider, link, presentation (means don't expose to screen reader)
         ARIA modes:
         - Used for CSS: aria-checked, aria-disabled
         - Not used for CSS: aria-activedescendant (focused item ID), aria-valuenow, aria-valuemin, aria-valuemax, aria-label, aria-labelledby
         Data attributes: data-hasfocus, data-hadfocusonce (so dynamically shown items like close button remain onscreen), data-active (active feature card)
         */

        /***************** Loading/badge  ****************/

        // If there is an old badge image, it will fade out
        '#sitecues-badge>img': {
          'transition': 'opacity 1.5s',
          'opacity': '1 !important'
        },

        '#sitecues-badge #scp-bp-container': {
          'position': 'absolute'
        },

        // Fade in the badge when it appears
        '#scp-bp-container': {
          'position': 'fixed',
          'z-index': '9999999',
          'transition': 'opacity 1.5s',
          'transform-origin': '0% 0%',
//          'will-change': 'transform',   // Removing helps Chrome not get blurry on sitecues.com after zoom
          'outline': 0 // don't show default dotted focus outline
        },

        '#scp-svg': {
          'max-width': 'none'
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

        // .scp-default-badge means it's either a floating badge or toolbar
        // Also has: .scp-toolbar or .scp-floating-badge
        //           .scp-left or .scp-right
        '.scp-default-badge': {
          'position': 'fixed',
          'width': '190px',
          'height': '40px',
          'box-sizing': 'border-box',
          'padding': '6px 8px 8px 8px',
          'background-color': '#f8f8f8',
          'z-index': '9999999'
        },

        '.scp-default-badge[aria-expanded="false"],.scp-toolbar': {
          'box-shadow': '1px 1px 15px 0 rgba(9, 9, 9, .5)'
        },

        '.scp-toolbar': {
          'width': '100%',
          'top': '0px',
          'left': '0px',
          'background-color': '#f7fcff'
        },

        '.scp-default-badge.scp-floating-badge.scp-right': {
          right: '4px',
          bottom: '4px'
        },

        '.scp-default-badge.scp-floating-badge.scp-left': {
          left: '4px',
          bottom: '4px'
        },

        '.scp-toolbar.scp-middle': {
          'padding-left': 'calc(50% - 65px)'
        },

        '.scp-toolbar.scp-right': {
          'padding-left': '88%'
        },

        // Move the body down by the height of the toolbar + 1px for the box-shadow
        '.scp-default-badge.scp-toolbar + head + body': {
          'transform': 'translateY(41px)',
          'width': '100%'
        },


        /********** Transform animation speed **********/

        // TODO: Transitions are pretty efficient for opacity, but it may be worth trading
        //       that for simplicity (using JS animations for EVERYTHING).
        '.scp-animate #scp-main > *, .scp-animate .scp-wave': {
          'transition': 'fill .2s, opacity .2s'
        },

        // TODO text needs to fade in at the end
        // todo: looks like this style will apply to all the text nodes, not only sitecues-related: is it what we want?
        'text': {
          'display': 'none',
          'transition': 'opacity 1s',
          'font-family': 'Arial',
          'font-size': '29px',
          'font-weight': 'bold',
          'opacity': 0,
          'user-select': 'none',
          '-webkit-user-select': 'none',
          '-moz-user-select': 'none',
          '-ms-user-select': 'none'
        },

        /* Text label animation for main panel labels */
        /* The problem with the text scale transition is jerkiness, so for now we delay text labels until panel is large */
        /* One way to fix this might be to render text into a canvas element, or maybe there's another font that doesn't do this */
        '.scp-ready text': {
          'display': 'block'
        },

        '.fade-in-text text': {
          'opacity': 1
        },

        '#scp-shadow': {
          'transition': 'opacity 1s',
          'opacity': 0
        },

        '.scp-large.scp-ie9-false #scp-shadow': {
          'opacity': 1
        },

        /************ Small vs. large  *************/

        '.scp-large > #scp-svg': {
          'opacity': '1 !important'
        },

        '.scp-large:not(.scp-ready) > #scp-svg': {
          'pointer-events': 'none'   // Fix for SC-2542: don't process mouseover hovers while expanding toward large state
        },

        '.scp-large .scp-large-only': { // element is visible in the large state of the badge-panel
          'opacity': '1 !important'
        },

        '.scp-more .scp-more-only': { // element is visible in the more state of the badge-panel
          'opacity': '1 !important'
        },

        '.scp-large #scp-mouseover-target': {
          'display': 'none'  // Don't let badge mouseover target interfere with actual use of panel
        },

        /**************** Waves ************************/

        '.scp-wave,.scp-head': {
          'pointer-events': 'none'
        },

        /* Waves use gray off state if not hovering and showing real settings (not first time badge) */
        '.scp-realsettings #scp-speech[aria-checked="false"]:not(.scp-dim-waves) > .scp-wave': {
          /* First time we're small we always show on state because it's more inviting. However, going from small to large the first time, we're going from fake on to real off. Transition gently, don't draw attention to that. */
          'fill': '#B0B0B0' /* Gray */
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

        '#scp-more': {
          'opacity'   : 1
        },

        '#scp-more-button-container': {
          'opacity': 0,
          'transform-origin': '50% 50%'
        },

        '.origin-center': {
          'transform-origin': '50% 50%'
        },

        '.scp-transition-opacity' : {
          'transition': 'opacity 0.8s'
        },

        '.scp-transition-opacity-fast' : {
          'transition': 'opacity 0.4s'
        },

        '.scp-transition-opacity-instant' : {
          'transition': 'opacity 0s'
        },

        /******** Mouse targets must be hidden but still able to handle events *************/

        '.scp-hidden-target': {
          'opacity': 0
        },

        '.scp-ie9-true .scp-hidden-target': {
          'opacity': .001    // Can't be seen but still gets click events
        },

        /*************** Close button **********************/

        '#scp-close-button': {
          'visibility': 'hidden',
          'position': 'absolute',
          'width': '70px',
          'height': '70px'
        },

        '.scp-ready.scp-keyboard #scp-close-button': {
          'visibility': 'visible',
          'z-index': '99999999'
        },

        /*************** Range *************************/

        '#scp-bp-container input[type="range"]': {
          'margin': '0px 15px'
        },

        /*************** Focus **************************/

        /* Do not use outline because it ends up being larger than the visible content, at least in Firefox */
        '#sitecues-badge:focus': {
          'outline': 0
        },
        '#sitecues-badge[aria-expanded="false"]:focus #scp-badge-rect': {
          'stroke': 'rgba(82, 168, 236, 0.8)',
          'stroke-width': '14px'
        }
      },

      // The 'b' normal blue palette is the default
      PALETTE_CSS = {

        '#scp-head': {
          'fill': '#000'
        },

        '.scp-A-button': {
          'fill': '#000'
        },

        '#scp-zoom-slider-bar': {
          'fill': '#383838'
        },

        '#scp-focus-outline': {
          'border': '5px solid rgba(82, 168, 236, 0.8)',
          'border-radius': '3px',
          'display': 'none',
          'position': 'absolute',
          'pointer-events': 'none'
        },

        '.scp-ready.scp-keyboard > #scp-focus-outline': {
          'display': 'block'
        },

        '#scp-svg text[role="link"]:hover': {
          'fill': '#447AC4 !important'
        },

        '#scp-wave1': {
          'fill': '#80A9F8'
        },

        '#scp-wave2': {
          'fill': '#6B9AE0'
        },

        '#scp-wave3': {
          'fill': '#447AC4'
        },

        /* Letter A buttons match slider thumb when hovered */
        '#scp-zoom-slider-thumb': {
          'fill': '#447AC4'
        },

        // .scp-palette-rb = reverse-blue
        // .scp-palette-ry = reverse-yellow

        '.scp-palette-rb #scp-wave1': {
          'fill': '#80A9F8'
        },

        '.scp-palette-rb #scp-wave2': {
          'fill': '#6B9AE0'
        },

        '.scp-palette-rb #scp-wave3': {
          'fill': '#447AC4'
        },

        '.scp-palette-rb #scp-zoom-slider-thumb': {
          'fill': '#447AC4'
        },

        '.scp-palette-rb .scp-A-button, .scp-palette-rb #scp-head, .scp-palette-rb #scp-zoom-slider-bar': {
          'fill': '#fff'
        },

        '.scp-large.scp-palette-rb .scp-A-button, .scp-large.scp-palette-rb #scp-head, .scp-large.scp-palette-rb #scp-zoom-slider-bar': {
          'fill': '#000'
        },

        '.scp-ready.scp-palette-rb .scp-A-button:hover': {
          'fill': '#447AC4'
        },

        '.scp-ready.scp-palette-rb #scp-zoom-slider-thumb:hover': {
          'fill': '#6B9AE0'
        },
        '.scp-small.scp-palette-ry #scp-wave1': {
          'fill': '#FFE460'
        },

        '.scp-small.scp-palette-ry #scp-wave2': {
          'fill': '#FFCC00'
        },

        '.scp-small.scp-palette-ry #scp-wave3': {
          'fill': '#FDAC00'
        },

        '.scp-small.scp-palette-ry #scp-zoom-slider-thumb': {
          'fill': '#FFCD00'
        },

        '.scp-palette-ry .scp-A-button, .scp-palette-ry #scp-head, .scp-palette-ry #scp-zoom-slider-bar': {
          'fill': '#fff'
        },

        '.scp-large.scp-palette-ry .scp-A-button, .scp-large.scp-palette-ry #scp-head, .scp-large.scp-palette-ry #scp-zoom-slider-bar': {
          'fill': '#000'
        },

        '.scp-ready .scp-A-button:hover': {
          'fill': '#447AC4'
        },

        '.scp-ready #scp-zoom-slider-thumb:hover': {
          'fill': '#6B9AE0'
        },

        // todo: maybe think of a more unique name for this class?
        // General way of showing the content if sitecues-badge is shown.
        '.sitecues-only': {
          'visibility': 'visible',
          'opacity': 1
        }
      };

    function provideCustomPalette (palette) {
      var panelOnly         = 'panel',
          badgeOnly         = 'badge',
          both              = 'both',
          customCSS         = {},
          paletteStylesheet = document.getElementById(BP_CONST.PALETTE_STYLESHEET_ID);

      for (var prop in palette) {

        if (palette.hasOwnProperty(prop)) {

          if (prop === panelOnly) {
            for (var panelProp in palette[panelOnly]) {
              if (palette[panelOnly].hasOwnProperty(panelProp)) {
                customCSS[CUSTOM_CSS_MAP[panelOnly][panelProp]] = {
                  'fill': palette[panelOnly][panelProp] + ' !important'
                };
              }
            }
          } else if (prop === badgeOnly) {
            for (var badgeProp in palette[badgeOnly]) {
              if (palette[badgeOnly].hasOwnProperty(badgeProp)) {
                customCSS[CUSTOM_CSS_MAP[badgeOnly][badgeProp]] = {
                  'fill': palette[badgeOnly][badgeProp] + ' !important'
                };
              }
            }
          } else {
            customCSS[CUSTOM_CSS_MAP[both][prop]] = {
              'fill': palette[prop] + ' !important'
            };
          }
        }
      }

      if (paletteStylesheet) {
        paletteStylesheet.innerHTML += toCSS(customCSS);
      }

    }

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
                  } else if (doMsPrefix && attribute !== 'transition') {
                    attribute = '-ms-' + attribute;
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

    function createStyleSheet(sheetId, cssDefs) {
      var sheet = document.createElement('style');
      sheet.id = sheetId;
      sheet.innerHTML = toCSS(cssDefs);
      document.head.appendChild(sheet);
    }

    createStyleSheet(BP_CONST.BASE_STYLESHEET_ID, BASE_CSS);
    createStyleSheet(BP_CONST.PALETTE_STYLESHEET_ID, PALETTE_CSS);

    if (typeof sitecues.config.palette === 'object') {
      provideCustomPalette(sitecues.config.palette);
    }

    if (SC_DEV) {
      sitecues.toggleSlowBPAnimations = function() {
        isAnimationDebuggingOn = !isAnimationDebuggingOn;
        document.head.removeChild(helper.byId(BP_CONST.BASE_STYLESHEET_ID));
        createStyleSheet(BP_CONST.BASE_STYLESHEET_ID, BASE_CSS);
      };
    }

    // Unless callback() is queued, the module is not registered in global constants.modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });
});
