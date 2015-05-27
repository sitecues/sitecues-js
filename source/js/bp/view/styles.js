sitecues.def('bp/view/styles', function (styling, callback) {
  'use strict';
  sitecues.use('bp/helper', 'bp/constants', 'conf/site', function (helper, BP_CONST, site) {

    var
      isAnimationDebuggingOn = false,

      doWebKitPrefix = helper.isSafari,
      doMsPrefix = helper.isIE9,

      idDelimiter = '#',
      classDelimiter = '.',
      hover = ':hover',

      WANT_BADGE = classDelimiter + BP_CONST.WANT_BADGE,
      WANT_PANEL = classDelimiter + BP_CONST.WANT_PANEL,

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
      TEXT_BACKGROUND = idDelimiter + BP_CONST.BOTTOM_DEF_ID + '>path',
      BACKGROUND = idDelimiter + BP_CONST.MAIN_OUTLINE_ID,
      BORDER = idDelimiter + BP_CONST.MAIN_OUTLINE_BORDER_ID,

    // Map the easy to understand elements of the SVG to CSS selectors.
    // This is useful for creating custom palettes for the badge and panel.
      CUSTOM_CSS_MAP = {
        'panel': {
          'largeA': WANT_PANEL + ' ' + LARGE_A,
          'smallA': WANT_PANEL + ' ' + SMALL_A,
          'A': WANT_PANEL + ' ' + A_CLASS,
          'largeAHover': WANT_PANEL + ' ' + LARGE_A_HOVER,
          'smallAHover': WANT_PANEL + ' ' + SMALL_A_HOVER,
          'AHover': WANT_PANEL + ' ' + A_CLASS_HOVER,
          'sliderBar': WANT_PANEL + ' ' + SLIDER_BAR,
          'sliderThumb': WANT_PANEL + ' ' + SLIDER_THUMB,
          'sliderThumbHover': WANT_PANEL + ' ' + SLIDER_THUMB_HOVER,
          'head': WANT_PANEL + ' ' + HEAD,
          'wave1Off': WANT_PANEL + ' ' + WAVE_1_OFF,
          'wave2Off': WANT_PANEL + ' ' + WAVE_2_OFF,
          'wave3Off': WANT_PANEL + ' ' + WAVE_3_OFF,
          'wave1On': WANT_PANEL + ' ' + WAVE_1_ON,
          'wave2On': WANT_PANEL + ' ' + WAVE_2_ON,
          'wave3On': WANT_PANEL + ' ' + WAVE_3_ON,
          'text': WANT_PANEL + ' ' + TEXT,
          'textBackground': WANT_PANEL + ' ' + TEXT_BACKGROUND,
          'background': WANT_PANEL + ' ' + BACKGROUND,
          'border': WANT_PANEL + ' ' + BORDER,
          'verticalDivider': WANT_PANEL + ' ' + VERTICAL_DIVIDER
        },
        'badge': {
          'largeA': WANT_BADGE + ' ' + LARGE_A,
          'smallA': WANT_BADGE + ' ' + SMALL_A,
          'A': WANT_BADGE + ' ' + A_CLASS,
          'sliderBar': WANT_BADGE + ' ' + SLIDER_BAR,
          'sliderThumb': WANT_BADGE + ' ' + SLIDER_THUMB,
          'head': WANT_BADGE + ' ' + HEAD,
          'wave1Off': WANT_BADGE + ' ' + WAVE_1_OFF,
          'wave2Off': WANT_BADGE + ' ' + WAVE_2_OFF,
          'wave3Off': WANT_BADGE + ' ' + WAVE_3_OFF,
          'wave1On': WANT_BADGE + ' ' + WAVE_1_ON,
          'wave2On': WANT_BADGE + ' ' + WAVE_2_ON,
          'wave3On': WANT_BADGE + ' ' + WAVE_3_ON,
          'text': WANT_BADGE + ' ' + TEXT,
          'textBackground': WANT_BADGE + ' ' + TEXT_BACKGROUND,
          'background': WANT_BADGE + ' ' + BACKGROUND,
          'border': WANT_BADGE + ' ' + BORDER,
          'verticalDivider': WANT_BADGE + ' ' + VERTICAL_DIVIDER
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
         <sc #scp-bp-container>
         <sc #scp-close-button>
         <sc .scp-feature-content>
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
         .scp-is-badge: BP is badge
         .scp-is-panel: BP is panel
         .scp-want-badge: BP is badge or shrinking into one
         .scp-want-panel: BP is panel or expanding into one
         .scp-is-panel-only  // Only display in panel mode or when becoming panel
         .scp-animate: Enable CSS animations (e.g. do not enable when first showing badge)
         .scp-keyboard: Keyboard mode
         - Elsewhere:
         .scp-more-only   // Only display in more panel
         .scp-feature-content // Only display in feature panel (reachable for more panel)
         .scp-hand-cursor: show a hand (aka pointer) cursor over this element
         .scp-hidden-target: a click target that is hidden (e.g. a rect that covers more area than the visible part of the target)


         ARIA roles:
         - dialog, button, checkbox (speech button), slider, link, presentation (means don't expose to screen reader)
         ARIA modes:
         - Used for CSS: aria-checked, aria-disabled
         - Not used for CSS: aria-activedescendant (focused item ID), aria-valuenow, aria-valuemin, aria-valuemax, aria-label, aria-labelledby
         Data attributes: data-hasfocus, data-hadfocusonce (so dynamically shown items like close button remain onscreen), data-active (active feature card)
         */

        /***************** sitecues div ******************/
        // Prevent page style pollution, use our own <sc> element rather than
        // <div> which may be styled by the page, e.g. at
        // - Margins http://www.independent.ie/entertainment/trending/westboro-baptist-church-accidentally-hates-the-ivory-coast-31251240.html
        // - Fonts: https://shuttle.support.signiant.com/customer/portal/articles/1720613-why-am-i-repeatedly-asked-to-make-my-media-shuttle-site-trusted-
        'sc': {
          'margin': '0',
          'display': 'block',
          'font-family': 'Arial',
          'color': '#000',
          'line-height': 'normal'
        },

        'sc-h1': {
          'margin': '16px 0',
          'font-size': '40px'
        },

        'sc-p': {
          'font-size': '18px',
          'margin': '12px 0'
        },



        /***************** Loading/badge  ****************/

        // If there is an old badge image, it will fade out
        '#sitecues-badge>img': {
          'transition': 'opacity 1.5s',
          'opacity': '1 !important'
        },

        // When panel is closed, we use position: absolute
        // When open, we use position: fixed
        '#sitecues-badge>#scp-bp-container': {
          'position': 'absolute'
        },

        // Fade in the badge when it appears
        '#scp-bp-container': {
          'position': 'fixed',
          'z-index': '9999999',
          'transition': 'opacity 1.5s',
          'transform-origin': '0% 0%',
          'text-align': 'left', // To prevent style pollution found on http://codecanyon.net/
//          'will-change': 'transform',   // Removing helps Chrome not get blurry on sitecues.com after zoom
          'outline': 0 // don't show default dotted focus outline
        },

        '#scp-svg': {
          'max-width': 'none',
          'overflow': 'hidden'
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
          'position': 'fixed',
          'top': '0px',
          'left': '0px',
          'width': '100%',
          'height': '38px',
          'margin': '0 !important',  // Prevent page style pollution
          'box-sizing': 'border-box',
          'box-shadow': '1px 1px 15px 0 rgba(9, 9, 9, .5)',
          'padding': '6px 8px 8px calc(50% - 66px)',
          'background-color': '#f7fcff !important',  // Ensure our own theme engine doesn't turn the toolbar dark
          'z-index': '9999999'
        },

        '.scp-toolbar > #scp-bp-container': {
          'background-color': 'transparent !important',
          'margin': '0 !important'  // Prevent page style pollution
        },

        // Move the body down by the height of the toolbar + 1px for the box-shadow
        'html[data-sitecues-toolbar]': {
          'padding-top': '41px !important'
        },

        // Fixed position elements will now be relative to the <body>, so that they move down below the toolbar
        // This messes up Google maps for some reason. We've disabled google maps in the extension.
        // TODO This also messes up https://www.yahoo.com/movies/monkey-kingdom-disneynature-116935977622.html
        'html[data-sitecues-toolbar] > body:not([data-sc-extra-toolbar-bump])': {
          'transform': 'translateY(0)'
        },

        'body[data-sc-extra-toolbar-bump]': {
          'transform': 'translateY(41px)'
        },

        /********** Transform animation speed **********/

        // TODO: Transitions are pretty efficient for opacity, but it may be worth trading
        //       that for simplicity (using JS animations for EVERYTHING).
        '.scp-animate #scp-main > *, .scp-animate .scp-wave': {
          'transition': 'fill .2s, opacity .2s'
        },

        '#scp-bottom-text': {
          'transition': 'opacity 1s',
          'visibility': 'hidden',
          'font-family': 'Arial',
          'font-size': '29px',
          'font-weight': 'bold',
          'user-select': 'none',
          '-webkit-user-select': 'none',
          '-moz-user-select': 'none',
          '-ms-user-select': 'none'
        },

        /* Text label animation for main panel labels */
        /* The problem with the text scale transition is jerkiness, so for now we delay text labels until panel is large */
        /* One way to fix this might be to render text into a canvas element, or maybe there's another font that doesn't do this */
        '.scp-is-panel #scp-bottom-text': {
          'visibility': 'visible !important',
          'opacity': '1 !important'
        },

        '#scp-shadow': {
          'transition': 'opacity 1s',
          'opacity': 0
        },

        '.scp-want-panel.scp-ie9-false #scp-shadow': {
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

        '.scp-more .scp-more-only': { // element is visible in the more state of the badge-panel
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

        // These are the 3 different ways the "?" button might fade in.
        //
        // We want to turn on pointer-events when the "?" becomes visible.
        // If none of these classes are set, then the "?" opacity is 0 and pointer-events are disabled.
        // COMMENTED OUT BECAUSE IT DOESNT WORK!
        // '.scp-transition-opacity, .scp-transition-opacity-fast, .scp-transition-opacity-instant': {
        //  'pointer-events': 'all !important'
        // },

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

        '.scp-is-panel.scp-keyboard #scp-close-button': {
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
        },

        '#sitecues-badge[aria-expanded="true"]:focus': {
          'box-shadow': 'none'
        },

        /* Secondary Panel - Blue Button */
        '.sitecues-button-big': {
          'padding'      : '10px 30px',
          'font-size'    : '22px',
          'margin-right' : '22px',
          'border'       : '3px solid #447AC4',
          'border-radius': '4px',
          'color'        : '#FFF',
          'text-align'   : 'center',
          'background'   : '#447AC4',
          'transform'    : 'none !important',
          'display'      : 'none'
        },

        '.scp-cards': {
          'position': 'relative',
          'font-family': 'Arial',
          'left': '130px',
          'width': '340px',
          'z-index': 999,
          'opacity': 0,
          'pointer-events': 'none'
        },

        '.scp-card': {
          'position': 'absolute',
          'display' : 'none'
        },

        '.scp-card p': {
          'font-size':'20px'
        },

        '#scp-arrows>text': {
          'font-size': '44px'
        },

        '.active, .active *': {
          'display': 'block'
        },

        '#scp-svg h1': {
          'font-size': '32px'
        },

        '#scp-svg p': {
          'font-size': '20px'
        },

        /*************** Clipping rules for badge **************************/
        // When the badge is fully collapsed, we clip it so that the invisible parts
        // of the SVG do not take mouse events.
        // The clipping is computed in placement.js
        // This rule undoes the placement.js clipping when the BP is not currently fully collapsed.
        '#scp-bp-container:not(.scp-is-badge)': {
          'clip': 'auto !important'
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

        '.scp-is-panel.scp-keyboard > #scp-focus-outline': {
          'display': 'block'
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

        // .scp-palette-n  = normal
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

        '.scp-want-panel.scp-palette-rb .scp-A-button, .scp-want-panel.scp-palette-rb #scp-head, .scp-want-panel.scp-palette-rb #scp-zoom-slider-bar': {
          'fill': '#000'
        },

        '.scp-is-panel.scp-palette-rb .scp-A-button:hover': {
          'fill': '#447AC4'
        },

        '.scp-is-panel.scp-palette-rb #scp-zoom-slider-thumb:hover': {
          'fill': '#6B9AE0'
        },

        '.scp-want-badge.scp-palette-ry #scp-wave1': {
          'fill': '#FFE460'
        },

        '.scp-want-badge.scp-palette-ry #scp-wave2': {
          'fill': '#FFCC00'
        },

        '.scp-want-badge.scp-palette-ry #scp-wave3': {
          'fill': '#FDAC00'
        },

        '.scp-want-badge.scp-palette-ry #scp-zoom-slider-thumb': {
          'fill': '#FFCD00'
        },

        '.scp-palette-ry .scp-A-button, .scp-palette-ry #scp-head, .scp-palette-ry #scp-zoom-slider-bar': {
          'fill': '#fff'
        },

        '.scp-want-panel.scp-palette-ry .scp-A-button, .scp-want-panel.scp-palette-ry #scp-head, .scp-want-panel.scp-palette-ry #scp-zoom-slider-bar': {
          'fill': '#000'
        },

        '.scp-is-panel .scp-A-button:hover': {
          'fill': '#447AC4'
        },

        '.scp-is-panel #scp-zoom-slider-thumb:hover': {
          'fill': '#6B9AE0'
        },

        // todo: maybe think of a more unique name for this class?
        // General way of showing the content if sitecues-badge is shown.
        '.sitecues-only': {
          'visibility': 'visible',
          'opacity': 1
        }
      };

    // Palette behavior is based on the type:
    // - string: predefined palette name like 'reverse-blue'
    // - object: custom palette
    function isCustomPalette(palette) {
      return typeof palette === 'object';
    }

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

    if (site.get('uiMode') !== 'toolbar') {
      // TODO Tony how does this work? We need docs
      // TODO clean this up -- weird to be checking toolbar in this general code here
      var palette = site.get('palette');
      if (isCustomPalette(palette)) {
        provideCustomPalette(palette);
      }
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
