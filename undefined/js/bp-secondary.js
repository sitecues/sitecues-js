"use strict";

// Return the extended font charset name, e.g. 'latin-ext'
sitecues.define("bp-secondary/font-charset", [ "run/locale" ], function(locale) {
  /**
   * Return 'latin-ext' if latin-ext font needed, etc.
   * @returns {*}
   */
  return function() {
    var currExtension, currLangs, lang = locale.getLang(), EXTENDED_LANGS = {
      "latin-ext": [ "hr", // Croatian
      "cs", // Czech
      "et", // Estonian
      "hu", // Hungarian
      "lv", // Latvian
      "lt", // Lithuanian
      "pl", // Polish
      "ro", // Romanian
      "sr", // Serbian
      "sk", // Slovak
      "sl", // Slovenian
      "tr" ]
    }, allExtensions = Object.keys(EXTENDED_LANGS), index = allExtensions.length;
    while (index--) {
      currExtension = allExtensions[index];
      currLangs = EXTENDED_LANGS[currExtension];
      if (currLangs.indexOf(lang) >= 0) {
        return currExtension;
      }
    }
  };
});

// Markup for the secondary panel
sitecues.define("bp-secondary/insert-secondary-markup", [ "run/bp/view/markup-finalizer", "run/bp/helper", "run/platform", "bp-secondary/font-charset", "run/conf/urls", "run/events" ], function(finalizer, helper, platform, fontCharset, urls, events) {
  /*jshint multistr: true */
  var isInitialized, svgSecondary = // xmlns:xlink needed for outerHTML to work on docs with xhtml doctype
  '<g id="scp-secondary" class="scp-secondary-only" aria-label="{{more_features}}" xmlns:xlink="http://www.w3.org/1999/xlink">  <rect id="scp-secondary-fill" role="presentation" x="1" y="1" width="806" height="134" fill="#fff" stroke-width="0"/>  <g id="scp-bottom-secondary">    <use xlink:href="#scp-bottom-def"/>    <g id="scp-tips-label" role="button" class="scp-hand-cursor" data-feature="tips" aria-label="{{tips}}">      <text text-anchor="middle" x="75" y="178">{{tips}}</text>      <rect x="5" y="148" height="40" width="150" class="scp-hidden-target"/>    </g>    <g id="scp-settings-label" role="button" class="scp-hand-cursor" data-feature="settings" aria-label="{{settings}}">      <text text-anchor="middle" x="285" y="178">{{settings}}</text>      <rect x="200" y="148" height="40" width="165" class="scp-hidden-target"/>    </g>    <g id="scp-feedback-label" role="button" class="scp-hand-cursor" data-feature="feedback" aria-label="{{rate_us}}">      <text text-anchor="middle" x="517" y="178">{{rate_us}}</text>      <rect x="432" y="148" height="40" width="165" class="scp-hidden-target"/>    </g>    <g id="scp-about-label" role="button" class="scp-hand-cursor" data-feature="about" aria-label="{{about}}">      <text text-anchor="middle" x="730" y="178">{{about}}</text>      <rect x="660" y="148" height="40" width="145" class="scp-hidden-target"/>    </g>  </g>  <rect id="scp-card-header-bg" class="scp-secondary-feature-only" y="1" width="808" height="133" stroke="#C0BFBF" stroke-width="1" fill="#EEE"/>  <g>    <g id="scp-arrows" role="presentation" class="scp-transition-opacity scp-secondary-feature scp-if-settings scp-if-tips">      <g id="scp-prev-card" class="scp-arrow scp-hand-cursor scp-transition-opacity" transform="translate(640,72) rotate(90) scale(1.4)" role="button" aria-label="{{previous}}" aria-disabled="true">        <g data-hover="scale(1.3)">          <use xlink:href="#scp-arrow"/>          <rect class="scp-hidden-target" x="-25" y="-10" width="50" height="50"/>        </g>      </g>      <g id="scp-next-card" class="scp-arrow scp-hand-cursor" transform="translate(729,72) rotate(-90) scale(1.4)" role="button" aria-label="{{next}}">        <g data-hover="scale(1.3)">          <use xlink:href="#scp-arrow"/>          <rect class="scp-hidden-target" x="-25" y="-25" width="50" height="50"/>        </g>      </g>    </g>    <g id="scp-feedback" class="scp-if-feedback scp-transition-opacity scp-secondary-feature" role="group" aria-labelledby="scp-feedback-header">      <rect id="scp-feedback-input-rect" role="presentation" data-own-focus-ring="true" x="45" y="315" width="715" height="400" stroke-width="3" stroke="#aaa" fill="#fdfcfc" rx="20" ry="20"/>      <g id="scp-rating" class="scp-hand-cursor" role="group" aria-label="{{rating}}">        <use id="scp-stars-1" role="button" aria-pressed="false" aria-label="{{rating_1}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="42" y="736"/>        <use id="scp-stars-2" role="button" aria-pressed="false" aria-label="{{rating_2}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="108" y="736"/>        <use id="scp-stars-3" role="button" aria-pressed="false" aria-label="{{rating_3}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="174" y="736"/>        <use id="scp-stars-4" role="button" aria-pressed="false" aria-label="{{rating_4}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="240" y="736"/>        <use id="scp-stars-5" role="button" aria-pressed="false" aria-label="{{rating_5}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="306" y="736"/>      </g>    </g>    <g id="scp-about" class="scp-if-about" transform="translate(805,16)">      <g id="scp-logo-text" role="presentation">        <image id="scp-sitecues-text" role="presentation" x="-11" y="-12" width="400" height="100"></image>        <text text-anchor="end" style="font-family:Open Sans;font-size:24px" y="96" x="300">{{zoom_and_speech}}</text>      </g>    </g>  </g>  <g id="scp-button-menu" transform="translate(52,66)">    <g id="scp-tips-button" class="scp-if-tips scp-hand-cursor scp-transition-opacity" role="button" data-feature="tips" aria-labelledby="scp-tips-label">      <g data-hover="scale(1.2)">        <circle r="52" fill="#548ECE"/>        <circle r="22" transform="translate(0,-14)" fill="#fff"/> <!-- Fix fill blink bug in Chrome -->        <path fill="#fff" stroke="#fff" stroke-width="3" stroke-miterlimit="10" d="m.9,-34.3c12.3,0 22.2,10 22.2,22.2c0,12.1 -7.3,13.5 -8.7,26.7c0,1.2 -1,2.2 -2.2,2.2h-11.4m.1,0h-.1h-11.3c-1.2,0 -2.2,-1 -2.2,-2.2c-1.4,-13.2 -8.7,-14.6 -8.7,-26.7c0,-12.3 10,-22.2 22.2,-22.2"/>        <path fill="#fff" d="m14,23.5c0,1.2 -1,2.2 -2.2,2.2h-22.2c-1.2,0 -2.2,-1 -2.2,-2.2c0,-1.2 1,-2.2 2.2,-2.2h22.2c1.2,0 2.2,1 2.2,2.2zm0,6.5c0,1.2 -1,2.2 -2.2,2.2h-22.2c-1.2,0 -2.2,-1 -2.2,-2.2c0,-1.2 1,-2.2 2.2,-2.2h22.2c1.2,0 2.2,1 2.2,2.2zm-27,4.5h23c0,2.5 -2,4.5 -4.5,4.5h-8.9c-2.5,0 -4.5,-2 -4.5,-4.5l0,0l0,0l.1,0l-5.2,0z"/>        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>      </g>    </g>    <g id="scp-settings-button" class="scp-if-settings scp-hand-cursor scp-transition-opacity" role="button" data-feature="settings" aria-labelledby="scp-settings-label">      <g data-hover="scale(1.2)">        <path d="m-36,47.8c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6.2c-1.3,0 -2.3,1 -2.3,2.3v91l0,-.2zm61.4,0c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6c-1.3,0 -2.3,1 -2.3,2.3v90.8l-.2,0zm-30.7,0c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6c-1.3,0 -2.3,1 -2.3,2.3v90.8l-.2,0z" fill="#7B7B7B"/>        <path d="m-19.7,4.5c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.3c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.3l0,0zm30.7,-28.5c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.2c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.40001l0,-.2zm31.5,46.4c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.3c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.3l0,0z" fill="#548ECE"/>        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>      </g>    </g>    <g id="scp-feedback-button" class="scp-if-feedback scp-hand-cursor scp-transition-opacity" role="button" data-feature="feedback" aria-labelledby="scp-feedback-label">      <g data-hover="scale(1.2)">        <path d="m-10,40c3,1 7,1 11,1c27,0 49,-19 49,-43c0,-24 -22,-44 -49,-44c-27,0 -50,19 -50,43c0,12 6,23 15,31c-2.2,9.2 -7.6,14.8 -17,20.7c15,-1 25,2 41,-9" stroke="#548ECE" stroke-miterlimit="5" stroke-linejoin="round" stroke-linecap="round" stroke-width="5.5" fill="#FFF"/>        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>      </g>    </g>    <g id="scp-about-button" class="scp-if-about scp-hand-cursor scp-transition-opacity" role="button" data-feature="about" aria-labelledby="scp-about-label">      <g id="scp-about-rotate-helper" role="presentation">        <g data-hover="scale(1.2)">          <path d="m15.8,-9.5h-11.2c-1,0 -3.4,3.9 -3.4,5.2l.1,15.3l-49.8,6.1h0c-1.6,-5 -2.5,-10.3 -2.5,-15.8c0,-27.9 22.6,-50.4 50.4,-50.4c21.2,0 39.4,13 46.8,31.7h0c5,11.2 0,22.2 -10.89999,24.1l-16.10001,2l0,-13.1c0,-1.2 -2.39999,-5.1 -3.39999,-5.1zm-7,47.3c1.6,1.89999 2.8,0 2.8,0l7.1,-11.10001c.2,-.3 .4,-.6 .4,-1v0v-4h26.4h0c-7.8,17.8 -25.5,30.3 -46.2,30.3c-20.7,0 -38.4,-12.4 -46.2,-30.3v0h48.1v4.3c0,.3 .2,.6 .4,.9l7.2,10.9z" fill="#000"/>          <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>        </g>      </g>    </g>  </g>  <g id="scp-secondary-outline" role="presentation">    <path d="M808 186.5c0 6-5 11-11 11H11.5 c-6 0-11-5-11-11" fill="transparent" stroke="#999" stroke-width="1.5"/>    <line stroke="#999" stroke-width="1.5" x1=".5" y1="-700" x2=".5" y2="188"/>    <line stroke="#999" stroke-width="1.5" x1="808" y1="-700" x2="808" y2="188"/>  </g>  <line stroke="#999" stroke-width="1" x1="0" y1=".5" x2="808" y2=".5"/> <!-- outline top --></g>', htmlSecondary = '<sc-h1 id="scp-feedback-header" class="scp-card-header scp-secondary-feature">{{rate_us}}</sc-h1><sc class="scp-secondary-feature scp-transition-opacity scp-if-feedback" role="group" aria-labelledby="scp-feedback-header">  <sc-p id="scp-feedback-prompt">{{rate_us_suggest}} {{rate_us_prompt}}</sc-p>  <textarea id="scp-feedback-textarea" class="scp-hand-cursor" data-allow-scroll="true"     aria-describedby="scp-feedback-prompt" data-visible-focus-on="scp-feedback-input-rect" placeholder="{{tell_us_something}}"></textarea>  <sc-button id="scp-feedback-send-button" aria-disabled="true"><a class="scp-button-link scp-hand-cursor" id="scp-feedback-send-link" class="scp-hand-cursor" data-mailto="mailto:support@sitecues.com">{{send}}</a></sc-button>.</sc><sc id="scp-feedback-thanks" class="scp-if-feedback-sent scp-secondary-feature" role="note" aria-label="{{thank_you}}">  <sc-h1>{{thank_you}}</sc-h1></sc><sc class="scp-about-teaser scp-if-about scp-transition-opacity scp-secondary-feature" role="group" aria-label="{{about}} sitecues">  <sc-p>    <sc-span id="scp-about-preamble">{{about_preamble}}</sc-span>    <a class="scp-link scp-hand-cursor" id="scp-about-sitecues-link" aria-describedby="scp-about-preamble scp-about-sitecues-link" target="_blank" href="https://sitecues.com?utm_source=sitecues-badge-panel&amp;utm_medium=bp3&amp;utm_campaign=BP_redirect&amp;utm_content=link">sitecues.com</a>.  </sc-p>  <sc-p id="scp-about-rate-footer">    <sc-span id="scp-rate-us-suggest" role="heading">{{about_rate_us}}</sc-span><br/>    <sc-button id="scp-about-rate-button" class="scp-hand-cursor" role="button" aria-label="{{rate_us}}" aria-describedby="scp-rate-us-suggest">{{rate_us}}</sc-button>  </sc-p></sc>';
  function insertHtml(insertionId, markup) {
    var where = helper.byId(insertionId), finalMarkup = finalizer(markup);
    where.outerHTML = finalMarkup;
  }
  function insertSvg(insertionId, markup) {
    // Unfortunately innertHTML, outerHTML, insertAdjacentHTML do not work for <svg> in Safari (or probably IE)
    // We have to create the elements in the SVG namespace and then insert it
    var svgElement, svgContentToInsert, where = helper.byId(insertionId), finalMarkup = finalizer(markup), divElement = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    // Use HTML element so that we can use innerHTML property
    divElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + finalMarkup + "</svg>";
    svgElement = divElement.firstChild;
    // This is the <svg> element
    svgContentToInsert = svgElement.firstChild;
    // This is the actual content we want
    where.parentNode.replaceChild(svgContentToInsert, where);
  }
  function insertSheet(name) {
    var cssLink = document.createElement("link"), cssUrl = urls.resolveResourceUrl("css/" + name + ".css");
    cssLink.setAttribute("rel", "stylesheet");
    cssLink.setAttribute("href", cssUrl);
    cssLink.id = "sitecues-js-" + name;
    document.querySelector("head").appendChild(cssLink);
  }
  function insertSheets() {
    // CSS: always use secondary.css
    insertSheet("secondary");
    // CSS: use latin-ext.css etc. if necessary
    var extendedFontCharsetName = fontCharset();
    if (extendedFontCharsetName) {
      insertSheet(extendedFontCharsetName);
    }
    // CSS: use vendor stylesheet as well (e.g. secondary-moz.css, secondary-ie.css, secondary-webkit.css)
    if (platform.cssPrefix) {
      insertSheet("secondary" + platform.cssPrefix);
    }
  }
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      insertHtml("scp-html-secondary-anchor", htmlSecondary);
      insertSvg("scp-secondary-anchor", svgSecondary);
      insertSheets();
      events.emit("bp/did-insert-secondary-markup");
    }
  }
  return {
    init: init
  };
});

/**
 * Tips cards, supporting demo animations
 */
sitecues.define("bp-secondary/tips", [ "run/bp/constants", "run/bp/helper", "run/events", "mini-core/native-global", "run/inline-style/inline-style" ], function(BP_CONST, helper, events, nativeGlobal, inlineStyle) {
  var isInitialized, byId = helper.byId, animationTimers = [], animationFns = {
    "scp-zoom-card": "zoom",
    "scp-zoom-keys-card": "zoom",
    "scp-highlight-card": "highlight",
    "scp-lens-card": "lens",
    "scp-speech-card": "lens",
    "scp-full-guide-card": "none"
  }, animationFnMap = {
    zoom: animateZoom,
    highlight: animateHighlight,
    lens: animateLens
  }, ACTORS = [ BP_CONST.DEMO_PAGE_CONTENTS, BP_CONST.DEMO_PARA, BP_CONST.DEMO_MOUSE, //        BP_CONST.DEMO_ZOOM_PLUS,
  //        BP_CONST.DEMO_ZOOM_MINUS,
  BP_CONST.DEMO_LENS_SPACE ];
  function getGeometryTargets(cssValues) {
    return cssValues;
  }
  function cardActivated(id) {
    // Clear existing tips animations
    animationTimers.forEach(clearTimeout);
    animationTimers.length = 0;
    ACTORS.forEach(clearElementDemo);
    // Find an appropriate animation
    var demoPage, hasAnimation, newAnimation = animationFns[id];
    if (!newAnimation) {
      return;
    }
    demoPage = byId(BP_CONST.DEMO_PAGE);
    hasAnimation = "none" !== newAnimation;
    demoPage.setAttribute("data-hasdemo", hasAnimation);
    if (hasAnimation) {
      // Run the animation function for this card (if any)
      animationFnMap[newAnimation](id);
      // Set a class on the demo-page element so it knows what's up
      demoPage.className = "scp-demo-" + newAnimation;
      byId(BP_CONST.TIPS_CONTENT_ID).setAttribute("data-active", id);
    }
  }
  function pushTimeout(fn, howLongMs) {
    animationTimers.push(nativeGlobal.setTimeout(fn, howLongMs));
  }
  // Reset demo page element back to original state
  function clearElementDemo(id) {
    var elem = byId(id);
    if (elem) {
      // Reset element back to normal position instantly (temporarily turn of animations)
      elem.setAttribute("data-demo", false);
      inlineStyle(elem).transitionDuration = "0s";
      nativeGlobal.setTimeout(function() {
        inlineStyle(elem).transitionDuration = "";
      }, 20);
    }
  }
  // Optional -- howLongMs is how long to wait before doing it
  function toggleElementDemo(id, isOn, howLongMs) {
    function toggle() {
      byId(id).setAttribute("data-demo", isOn || false);
    }
    pushTimeout(toggle, howLongMs || 0);
  }
  function animateZoom() {
    function toggleZoom(isOn, key, howLongMs) {
      toggleElementDemo(BP_CONST.DEMO_PAGE_CONTENTS, isOn, howLongMs);
      // Zoom page
      toggleElementDemo(BP_CONST.DEMO_SLIDER_THUMB, isOn, howLongMs);
      // Move slider
      toggleElementDemo(key, true, howLongMs);
      // Push key
      toggleElementDemo(key, false, howLongMs + 2e3);
    }
    function zoomThenUnzoom() {
      toggleZoom(true, BP_CONST.DEMO_ZOOM_PLUS, 2e3);
      toggleZoom(false, BP_CONST.DEMO_ZOOM_MINUS, 6e3);
    }
    zoomThenUnzoom();
    pushTimeout(zoomThenUnzoom, 8e3);
  }
  function animateHighlight() {
    function highlightThenUnhighlight() {
      toggleElementDemo(BP_CONST.DEMO_MOUSE, true, 2e3);
      toggleElementDemo(BP_CONST.DEMO_PARA, true, 4e3);
      toggleElementDemo(BP_CONST.DEMO_MOUSE, false, 6e3);
      toggleElementDemo(BP_CONST.DEMO_PARA, false, 6500);
    }
    highlightThenUnhighlight();
    pushTimeout(highlightThenUnhighlight, 9999);
  }
  function animateLens(id) {
    function toggleSpacebar(isPressed) {
      toggleElementDemo(BP_CONST.DEMO_LENS_SPACE, isPressed);
      toggleElementDemo(BP_CONST.DEMO_SPEECH_SPACE, isPressed);
    }
    function pressSpacebar() {
      toggleSpacebar(true);
      pushTimeout(toggleSpacebar, 1e3);
    }
    function openThenCloseLens() {
      sitecues.require([ "audio/audio" ], function(audio) {
        function speakIt() {
          audio.speakContent(byId(BP_CONST.DEMO_PARA), true);
        }
        pushTimeout(pressSpacebar, 2e3);
        toggleElementDemo(BP_CONST.DEMO_PARA, true, 3200);
        // Open lens
        if ("scp-speech-card" === id) {
          pushTimeout(speakIt, 3200);
        }
        pushTimeout(pressSpacebar, 6e3);
        toggleElementDemo(BP_CONST.DEMO_PARA, false, 7200);
      });
    }
    openThenCloseLens();
    pushTimeout(openThenCloseLens, 12e3);
  }
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      events.on("bp/did-show-card", cardActivated);
    }
  }
  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };
});

sitecues.define("bp-secondary/settings", [ "run/bp/constants", "run/bp/helper", "run/conf/preferences", "run/bp/model/state", "run/metric/metric", "run/platform", "page/cursor/cursor", "run/events", "run/dom-events", "mini-core/native-global", "run/inline-style/inline-style" ], function(BP_CONST, helper, pref, state, metric, platform, cursor, events, domEvents, nativeGlobal, inlineStyle) {
  var isInitialized, settingsPanel, byId = helper.byId, isActive = false, lastDragUpdateTime = 0, SLIDER_DRAG_UPDATE_MIN_INTERVAL = 50, rangeValueMap = {};
  function onPanelUpdate() {
    var willBeActive = "settings" === state.getSecondaryPanelName() && state.get("isSecondaryExpanded"), settingsCards = byId(BP_CONST.SETTINGS_CONTENT_ID);
    if (isActive !== willBeActive) {
      if (willBeActive) {
        mouseSlidersInit();
        // Always use current mouse size as starting point
        if (!settingsPanel) {
          initContents();
        }
        settingsCards.addEventListener("click", onSettingsClick);
        settingsCards.addEventListener("change", onSettingsNativeInputChange);
        settingsCards.addEventListener("input", onSettingsNativeInputChangeDrag);
      } else {
        settingsCards.removeEventListener("click", onSettingsClick);
        settingsCards.removeEventListener("change", onSettingsNativeInputChange);
        settingsCards.removeEventListener("input", onSettingsNativeInputChangeDrag);
      }
    }
    isActive = willBeActive;
  }
  function initContents() {
    settingsPanel = byId(BP_CONST.SETTINGS_CONTENT_ID);
    if (platform.featureSupport.themes) {
      // MSIE/Edge -- no support yet
      // TODO support themes in IE -- need to break up theme CSS into chunks for pages like atkratter.com,
      // otherwise it locks up the page -- 537k of styles is a lot for IE to handle
      sitecues.require([ "theme/theme" ], function(theme) {
        theme.init(true);
      });
    }
    initButtons();
    initRanges();
    themeSlidersInit();
  }
  // Set up setting synchronization
  function initButtons() {
    var name, allSettingNames = {}, allSettingElems = settingsPanel.querySelectorAll("[data-setting-name]"), index = allSettingElems.length;
    // For each setting name, get a list of elements
    while (index--) {
      name = allSettingElems[index].getAttribute("data-setting-name");
      allSettingNames[name] = 1;
    }
    function themeListener(newValue) {
      newValue = newValue || "none";
      // Will now be 'none', 'warm', 'bold' or 'dark'
      var elem, currentButtonValue, isCurrentValue, settingElems = settingsPanel.querySelectorAll('sc-button[data-setting-name="' + name + '"]'), index = settingElems.length;
      while (index--) {
        elem = settingElems[index];
        // This button is used for what theme? 'none', 'warm', 'bold' or 'dark'
        currentButtonValue = elem.getAttribute("data-setting-value") || "none";
        isCurrentValue = newValue === currentButtonValue;
        elem.setAttribute("aria-pressed", isCurrentValue);
      }
    }
    Object.keys(allSettingNames).forEach(function(name) {
      pref.bindListener(name, themeListener);
    });
  }
  function getThemePowerGroup() {
    return byId(BP_CONST.THEME_POWER_ID);
  }
  function getThemeTextHueGroup() {
    return byId(BP_CONST.THEME_TEXT_HUE_ID);
  }
  function getMouseSizeRange() {
    return byId(BP_CONST.MOUSE_SIZE_ID);
  }
  function initRangeListener(settingName, rangeElem) {
    pref.bindListener(settingName, function(val) {
      rangeElem.value = val;
    });
  }
  function initRanges() {
    var rangeElem, settingName, rangeElems = settingsPanel.querySelectorAll('input[type="range"]'), index = rangeElems.length;
    while (index--) {
      rangeElem = rangeElems[index];
      settingName = rangeElem.getAttribute("data-setting-name");
      initRangeListener(settingName, rangeElem);
      domEvents.on(rangeElem, "blur", fireInputRangeMetric);
      rangeValueMap[settingName] = pref.get(settingName);
      adjustRangeBackground(rangeElem);
    }
  }
  function themeNameListener(name) {
    var isThemePowerEnabled = Boolean(name), isThemeTextHueEnabled = "dark" === name;
    getThemePowerGroup().setAttribute("data-show", isThemePowerEnabled);
    getThemeTextHueGroup().setAttribute("data-show", isThemeTextHueEnabled);
  }
  function themeSlidersInit() {
    pref.bindListener("themeName", themeNameListener);
  }
  function mouseSlidersInit() {
    var size = cursor.getSize(), MIN_BP_CURSOR_SIZE = 1.9;
    if (!pref.get("mouseSize")) {
      // No setting, so start from current cursor size means using the BP cursor size as a minimum
      size = Math.max(size, MIN_BP_CURSOR_SIZE);
    }
    getMouseSizeRange().value = size;
  }
  function getGeometryTargets(cssValues) {
    return cssValues;
  }
  function isNativeInput(elem) {
    return "undefined" !== typeof elem.value;
  }
  function onSettingsClick(evt) {
    var settingName, target = helper.getEventTarget(evt);
    if (target && !isNativeInput(target)) {
      settingName = target.getAttribute("data-setting-name");
      if (settingName) {
        pref.set(settingName, target.getAttribute("data-setting-value"));
      }
    }
  }
  function fireInputRangeMetric(event) {
    var target = event.target, id = target.id, settingName = target.getAttribute("data-setting-name"), oldValue = rangeValueMap[settingName], newValue = pref.get(settingName);
    if (oldValue !== newValue) {
      // Only fire on change
      rangeValueMap[settingName] = newValue;
      new metric.SliderSettingChange({
        id: id.split("scp-")[1] || id,
        // Trim off scp- prefix
        settingName: settingName,
        old: oldValue,
        new: newValue
      }).send();
    }
  }
  // Use native value for things like <input type="range">
  // For sliders, this occurs when user drops the thumb (lets go of mouse button)
  function onSettingsNativeInputChange(evt) {
    var target = helper.getEventTarget(evt);
    if (target) {
      var settingName = target.getAttribute("data-setting-name"), newValue = +target.value;
      if (settingName) {
        pref.set(settingName, newValue);
      }
    }
  }
  // Firefox doesn't have a pure CSS way of adjusting the background
  function adjustRangeBackground(slider) {
    if (platform.browser.isMS) {
      // Not needed for IE/Edge, which do this via -ms- CSS
      // We prefer CSS approach in IE, because JS may have trouble keeping up with slider thumb movements
      return;
    }
    if (slider.className.indexOf("scp-normal-range") < 0) {
      return;
    }
    var value = +slider.value, min = parseFloat(slider.min), max = parseFloat(slider.max), percent = 100 * (value - min) / (max - min) + "%", LEFT_COLOR = "#538eca", RIGHT_COLOR = "#e2e2e2", gradient = "linear-gradient(to right, " + LEFT_COLOR + " 0%," + LEFT_COLOR + " " + percent + "," + RIGHT_COLOR + " " + percent + "," + RIGHT_COLOR + " 100%)";
    inlineStyle(slider).backgroundImage = gradient;
  }
  // Native input change
  // For sliders, this occurs when thumb moves at all, it doesn't need to be dropped there
  // We don't want to update too much, hence the timer
  function onSettingsNativeInputChangeDrag(evt) {
    adjustRangeBackground(evt.target);
    var currTime = +Date.now();
    if (currTime - lastDragUpdateTime > SLIDER_DRAG_UPDATE_MIN_INTERVAL) {
      lastDragUpdateTime = currTime;
      nativeGlobal.setTimeout(function() {
        onSettingsNativeInputChange(evt);
      }, 0);
    }
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    events.on("bp/did-open-subpanel", onPanelUpdate);
  }
  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };
});

sitecues.define("bp-secondary/feedback", [ "run/bp/constants", "run/bp/helper", "run/bp/model/state", "run/metric/metric", "run/bp/view/view", "run/events", "mini-core/native-global", "run/inline-style/inline-style" ], function(BP_CONST, helper, state, metric, view, events, nativeGlobal, inlineStyle) {
  var isInitialized, // Zero = no rating defined
  currentStatus, byId = helper.byId, isActive = false, currentRating = 0;
  function getFeedbackArea() {
    return byId(BP_CONST.FEEDBACK_TEXTAREA);
  }
  function getFeedbackInputRect() {
    return byId(BP_CONST.FEEDBACK_INPUT_RECT);
  }
  function getRating() {
    return byId(BP_CONST.RATING);
  }
  function getFeedbackSendButton() {
    return byId(BP_CONST.FEEDBACK_SEND_BUTTON);
  }
  // Child of button: handles clicks
  function getFeedbackSendLink() {
    return byId(BP_CONST.FEEDBACK_SEND_LINK);
  }
  function getBPContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }
  function autoSizeTextarea() {
    var feedbackTextarea = getFeedbackArea(), feedbackInputRect = getFeedbackInputRect().getBoundingClientRect(), scale = state.get("scale"), ROOM_FOR_ROUNDED_OUTLINE = 22, ROOM_FOR_SCROLLBAR = 20, // Scrollbar will be hidden via css clip
    width = (feedbackInputRect.width - ROOM_FOR_ROUNDED_OUTLINE) / scale, height = (feedbackInputRect.height - ROOM_FOR_ROUNDED_OUTLINE) / scale;
    inlineStyle.set(feedbackTextarea, {
      width: width + "px",
      height: height + "px",
      // Hide scrollbar by clipping horizontally - don't clip vertically (just large height of 999px for that)
      clip: "rect(0," + (width - ROOM_FOR_SCROLLBAR) + "px,999px,0)"
    });
  }
  function onPanelUpdate() {
    var willBeActive = "feedback" === state.getSecondaryPanelName(), addOrRemoveFn = willBeActive ? "addEventListener" : "removeEventListener";
    if (isActive !== willBeActive) {
      getFeedbackArea()[addOrRemoveFn]("keyup", updateSendButton);
      getRating()[addOrRemoveFn]("click", onRatingClick);
      if (true) {
        getFeedbackSendLink()[addOrRemoveFn]("click", onSendFeedbackClick);
      }
      if (willBeActive) {
        sitecues.require([ "status/status" ], function(status) {
          status(function(statusObj) {
            currentStatus = statusObj;
          });
        });
      } else {
        currentStatus = null;
        state.set("isFeedbackSent", false);
      }
    }
    isActive = willBeActive;
  }
  function onRatingClick(evt) {
    var star, ratingElem = getRating(), stars = getBPContainer().getElementsByClassName(BP_CONST.RATING_STAR_CLASS), // svgElem.children not supported in IE
    index = stars.length, targetStar = helper.getEventTarget(evt);
    currentRating = 0;
    while (index--) {
      star = stars[index];
      if (star === targetStar) {
        currentRating = index + 1;
      }
      star.setAttribute("aria-pressed", currentRating > 0);
    }
    // Copy current rating to group
    // TODO need to test usability of ratings with screen reader
    ratingElem.setAttribute("aria-label", targetStar.getAttribute("aria-label"));
    updateMailtoLink();
    toggleSendEnabled(true);
  }
  function getFeedbackText() {
    return getFeedbackArea().value;
  }
  // User's feedback text + status text
  function getFeedbackTextToSend() {
    if (true) {
      return getFeedbackText();
    }
    // Add status text to mail messages because we don't have a metrics details field in that case.
    // Prepend blank lines so that status is on next screen of mail message in order not to confuse the user.
    var NUM_NEWLINES = 99, STATUS_PREFIX = Array(NUM_NEWLINES).join("\n") + "---- User configuration: ----\n\n", currentStatusText = nativeGlobal.JSON.stringify(currentStatus, null, "    ");
    return getFeedbackText() + STATUS_PREFIX + currentStatusText;
  }
  function getCurrentRatingText() {
    var ratingElem = getRating();
    return ratingElem.getAttribute("aria-label");
  }
  // Need to use mailto link instead of xhr in local (e.g. extension) mode
  function updateMailtoLink() {
    if (false) {
      var sendButton = getFeedbackSendLink(), mailto = sendButton.getAttribute("data-mailto") + "?subject=" + encodeURIComponent(getCurrentRatingText()) + "&body=" + encodeURIComponent(getFeedbackTextToSend());
      sendButton.setAttribute("href", mailto);
    }
  }
  function updateSendButton() {
    updateMailtoLink();
    var isEnabled = getFeedbackText().length > 0 || currentRating > 0;
    toggleSendEnabled(isEnabled);
  }
  function toggleSendEnabled(doEnable) {
    // We do both a fake button and a link child -- the link is for the mailto: we do in the extension
    getFeedbackSendButton().setAttribute("aria-disabled", !doEnable);
    getFeedbackSendLink().setAttribute("aria-disabled", !doEnable);
  }
  function isSendEnabled() {
    return "true" !== getFeedbackSendButton().getAttribute("aria-disabled");
  }
  function onSendFeedbackClick() {
    if (isSendEnabled()) {
      var details = {
        feedbackText: getFeedbackTextToSend(),
        rating: currentRating,
        // 0 = no rating, otherwise 1-5 stars
        statusText: nativeGlobal.JSON.stringify(currentStatus)
      };
      if (true) {
        console.log("Sending feedback: %o", details);
      }
      new metric.Feedback(details).send();
      toggleSendEnabled(false);
      // Disable feedback button after sent, so that feedback isn't accidentally clicked twice
      state.set("isFeedbackSent", true);
      view.update(true);
    }
  }
  function getGeometryTargets(cssValues) {
    return cssValues;
  }
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      events.on("bp/did-open-subpanel", onPanelUpdate);
      events.on("bp/will-show-secondary-feature", function(name) {
        if ("feedback" === name) {
          autoSizeTextarea();
        }
      });
    }
  }
  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };
});

sitecues.define("bp-secondary/about", [ "run/bp/constants", "run/bp/helper", "run/conf/urls" ], function(BP_CONST, helper, urls) {
  var isInitialized, byId = helper.byId;
  function loadImage() {
    byId("scp-sitecues-text").setAttributeNS("http://www.w3.org/1999/xlink", "href", urls.resolveResourceUrl("images/sitecues-logo-text.svg"));
  }
  function getGeometryTargets(cssValues) {
    // Which additional animations
    cssValues[false].menuImageTranslateX = 0;
    // About logo transitions to the left following the rolling icon
    cssValues[true].menuBtnTranslateX = 175;
    // The about icon, which rolls to the left
    cssValues[true].menuBtnTranslateY = BP_CONST.TRANSFORMS[BP_CONST.ABOUT_BUTTON_ID].translateY;
    // The about icon
    cssValues[true].menuBtnScale = 1;
    // About icon scales to 1
    cssValues[true].menuBtnRotate = -359.5;
    // Roll the about icon counter-clockwise
    cssValues[true].menuImageTranslateX = -500;
    return cssValues;
  }
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      loadImage();
      byId("scp-about-rate-button").addEventListener("click", function() {
        sitecues.require([ "bp-secondary/bp-secondary" ], function(secondaryPanel) {
          secondaryPanel.toggleFeature("feedback");
        });
      });
    }
  }
  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };
});

/**
 * Generic module for handling the cards used by tips and settings
 */
sitecues.define("bp-secondary/cards", [ "run/bp/constants", "run/bp/helper", "run/locale", "run/bp/model/state", "run/util/xhr", "run/conf/urls", "run/events", "run/platform", "run/inline-style/inline-style" ], function(BP_CONST, helper, locale, state, xhr, urls, events, platform, inlineStyle) {
  var isInitialized, activePanelName, activePanel, PANELS_WITH_CARDS = {
    tips: 1,
    settings: 1
  }, byId = helper.byId, isActive = false, NUM_PANELS_WITH_CARDS = 2, // can also be computed via PANELS_WITH_CARDS.keys().length;
  panelsToLoad = NUM_PANELS_WITH_CARDS;
  function loadPanelContents(panelName) {
    var localizedPanelName = panelName + "-" + locale.getUiLocale(), panelUrl = urls.resolveResourceUrl("html/" + panelName + "/" + localizedPanelName + ".html");
    xhr.get({
      url: panelUrl,
      success: function(html) {
        var panelElement, finalHTML = addSemanticSugar(html), htmlContainer = document.createElement("div");
        // Just a container where we can parse out the desired contents
        htmlContainer.innerHTML = finalHTML;
        panelElement = htmlContainer.firstElementChild;
        removeUnsupportedContent(panelElement);
        getContainer().appendChild(panelElement);
        toggleCardActive(panelElement.firstElementChild, true);
        if (0 === --panelsToLoad) {
          events.emit("bp/content-loaded");
        }
      }
    });
  }
  function getContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }
  function getPanelElement(panelName) {
    return document.getElementById("scp-" + panelName);
  }
  // Add useful attributes to various elements, based on elemTypes
  function addSemanticSugar(html) {
    var INTERACTIVE = ' class="scp-hand-cursor scp-tabbable';
    return html.replace(/(<sc-button )/g, '<sc-button role="button" ').replace(/<sc-menuitem /g, '<sc-menuitem role="button"' + INTERACTIVE + '" ').replace(/<sc-card /g, '<sc-card role="tabpanel" ').replace(/<sc-link /g, '<sc-link role="button"' + INTERACTIVE + '" ').replace(/<sc-tab /g, '<sc-link role="tab" aria-selected="false"' + INTERACTIVE + '" ').replace(/<\/sc-tab/g, "</sc-link").replace(/<sc-normal-range /g, '<input type="range"' + INTERACTIVE + ' scp-normal-range" ').replace(/<\/sc-normal-range>/g, "</input>").replace(/<sc-hue-range /g, '<input type="range"' + INTERACTIVE + ' scp-hue-range" ').replace(/<\/sc-hue-range>/g, "</input>");
  }
  // Remove elements unless required by the site config
  function removeAllElements(panelElement, elementsToRemoveSelector) {
    function hide(elements) {
      var element, index = elements.length;
      while (index--) {
        element = elements[index];
        element.parentNode.removeChild(element);
      }
    }
    var elementsToRemove = panelElement.querySelectorAll(elementsToRemoveSelector);
    hide(elementsToRemove);
  }
  function removeUnsupportedContent(panelElement) {
    if (!platform.featureSupport.themes) {
      removeAllElements(panelElement, "#scp-theme-settings,#scp-theme-settings-tab");
    }
  }
  function onPanelUpdate() {
    var panelName = state.getSecondaryPanelName(), willBeActive = panelName && PANELS_WITH_CARDS.hasOwnProperty(panelName), addOrRemoveFn = willBeActive ? "addEventListener" : "removeEventListener", bpContainer = byId(BP_CONST.BP_CONTAINER_ID);
    // Event listeners
    if (isActive !== willBeActive) {
      byId(BP_CONST.PREV_ID)[addOrRemoveFn]("click", prevCard);
      byId(BP_CONST.NEXT_ID)[addOrRemoveFn]("click", nextCard);
      // TODO: This should be moved into the controller, somehow.
      // bpContainer[addOrRemoveFn]('keydown', onKeyDown);
      bpContainer[addOrRemoveFn]("click", onClick);
      bpContainer[addOrRemoveFn]("keydown", onKeyDown);
    }
    // Active state
    if (willBeActive) {
      if (activePanelName !== panelName) {
        activePanelName = panelName;
        activePanel = getPanelElement(panelName);
        moveIndicator();
        newCardNotification();
      }
    } else {
      activePanelName = null;
      activePanel = null;
    }
    isActive = willBeActive;
  }
  function onClick(evt) {
    var clickedElem = helper.getEventTarget(evt), linkTarget = clickedElem.getAttribute("data-target");
    if (linkTarget) {
      if ("#" === linkTarget.charAt(0)) {
        // Help target
        sitecues.require([ "info/info" ], function(info) {
          info.showHelp(linkTarget.substring(1));
        });
      } else {
        // Card link
        selectNewCard(byId(linkTarget), true);
      }
    }
  }
  function onKeyDown(event) {
    var LEFT = 37, RIGHT = 39;
    if ("input" !== event.target.localName) {
      if (event.keyCode === LEFT) {
        switchCard(-1);
      } else {
        if (event.keyCode === RIGHT) {
          switchCard(1);
        }
      }
    }
  }
  function newCardNotification(isFromLink) {
    events.emit("bp/did-show-card", getActiveCard().id, getActiveTab(), isFromLink);
  }
  // This interferes with slider usage which also needs left/right arrow keys
  //    function onKeyDown(evt) {
  //      var LEFT     = 37,
  //        RIGHT    = 39;
  //
  //      if (evt.keyCode === LEFT) {
  //        prevCard();
  //      }
  //      else if (evt.keyCode === RIGHT) {
  //        nextCard();
  //      }
  //    }
  function toggleCardActive(cardElement, isActive) {
    if (isActive) {
      cardElement.className = cardElement.className + " scp-active";
    } else {
      cardElement.className = cardElement.className.replace("scp-active", "");
    }
  }
  function getActiveTab() {
    var activeCard = getActiveCard(), tabId = activeCard.getAttribute("aria-labelledby");
    return document.getElementById(tabId);
  }
  function moveIndicator() {
    if (!activePanel) {
      return;
    }
    var chosenItem = getActiveTab(), bpScale = state.get("scale"), indicator = activePanel.querySelector(".scp-card-indicator"), indicatorRect = indicator.getBoundingClientRect(), chosenItemRect = chosenItem.getBoundingClientRect(), choseItemLeft = chosenItemRect.left - indicatorRect.left, indicatorLeft = -442 + (choseItemLeft + chosenItemRect.width / 2) / bpScale, previouslyChosen = chosenItem.parentNode.querySelector('[aria-selected="true"]');
    // Reset old selection
    if (previouslyChosen) {
      previouslyChosen.setAttribute("aria-selected", "false");
    }
    // Set indicator
    inlineStyle(indicator).backgroundPosition = indicatorLeft + "px 0";
    chosenItem.setAttribute("aria-selected", "true");
  }
  function isDisabled(id) {
    return byId(id).hasAttribute("aria-disabled");
  }
  function getActiveCard() {
    return activePanel && activePanel.getElementsByClassName("scp-active")[0];
  }
  /**
     * Switch to a new card
     * @param direction 1 for next card, -1 for previous
     * @param fromCard (optional) Card to navigate to next/prev from. If not specified will use current active card
     */
  function switchCard(direction, fromCard) {
    var cardToSelect, activeCard = fromCard || getActiveCard();
    if (activeCard) {
      cardToSelect = 1 === direction ? activeCard.nextElementSibling : activeCard.previousElementSibling;
      if (!cardToSelect) {
        cardToSelect = 1 === direction ? activePanel.firstElementChild : activePanel.lastElementChild;
      }
      if (!selectNewCard(cardToSelect)) {
        switchCard(direction, cardToSelect);
      }
    }
  }
  // Returns true on success
  function selectNewCard(cardToSelect, isFromLink) {
    if (cardToSelect) {
      // Always skip advanced cards for now
      if ("sc-card" === cardToSelect.localName && !cardToSelect.hasAttribute("data-advanced")) {
        toggleCardActive(getActiveCard(), false);
        toggleCardActive(cardToSelect, true);
        moveIndicator();
        newCardNotification(isFromLink);
        // At first, back button is disabled when on first card
        // However, once we've gone forward we allow backwards cycling
        byId(BP_CONST.PREV_ID).removeAttribute("aria-disabled");
        return true;
      }
    }
  }
  function nextCard() {
    switchCard(1);
  }
  function prevCard() {
    if (!isDisabled(BP_CONST.PREV_ID)) {
      switchCard(-1);
    }
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    loadPanelContents("settings");
    loadPanelContents("tips");
    events.on("bp/did-open-subpanel", onPanelUpdate);
  }
  return {
    init: init
  };
});

sitecues.define("bp-secondary/bp-secondary-features", [ "run/bp/constants", "bp-secondary/tips", "bp-secondary/settings", "bp-secondary/feedback", "bp-secondary/about", "bp-secondary/cards" ], function(BP_CONST, tips, settings, feedback, about, cards) {
  var featureDefs = {
    tips: {
      module: tips,
      menuButtonId: BP_CONST.TIPS_BUTTON_ID,
      labelId: BP_CONST.TIPS_LABEL_ID,
      panelId: BP_CONST.TIPS_CONTENT_ID
    },
    settings: {
      module: settings,
      menuButtonId: BP_CONST.SETTINGS_BUTTON_ID,
      labelId: BP_CONST.SETTINGS_LABEL_ID,
      panelId: BP_CONST.SETTINGS_CONTENT_ID
    },
    feedback: {
      module: feedback,
      menuButtonId: BP_CONST.FEEDBACK_BUTTON_ID,
      labelId: BP_CONST.FEEDBACK_LABEL_ID,
      panelId: BP_CONST.FEEDBACK_CONTENT_ID
    },
    about: {
      module: about,
      menuButtonId: BP_CONST.ABOUT_BUTTON_ID,
      menuButtonHelperId: BP_CONST.ABOUT_ROTATE_HELPER_ID,
      animatedImageId: BP_CONST.ABOUT_CONTENT_IMAGE_ID,
      labelId: BP_CONST.ABOUT_LABEL_ID,
      panelId: BP_CONST.ABOUT_CONTENT_ID,
      heightAnimationDelay: 1200
    }
  };
  function init() {
    about.init();
    feedback.init();
    settings.init();
    tips.init();
    cards.init();
  }
  return {
    featureDefs: featureDefs,
    init: init
  };
});

/**
 * Secondary panel including animations
 */
sitecues.define("bp-secondary/bp-secondary", [ "run/bp/constants", "run/bp/model/state", "run/bp/view/view", "run/bp/helper", "bp-expanded/view/transform-animate", "bp-expanded/view/transform-util", "run/locale", "run/platform", "bp-secondary/insert-secondary-markup", "bp-secondary/bp-secondary-features", "run/events", "mini-core/native-global", "run/inline-style/inline-style" ], function(BP_CONST, state, view, helper, animate, transformUtil, locale, platform, markup, secondaryFeatures, events, nativeGlobal, inlineStyle) {
  var origPanelContentsRect, origOutlineHeight, origFillHeight, isInitialized, hasOpened, fadeInTimer, animateHeightTimer, animationsCompleteTimer, BUTTON_DROP_ANIMATION_MS = 800, ENABLED_PANEL_TRANSLATE_Y = 0, DISABLED_PANEL_TRANSLATE_Y = -198, MORE_BUTTON_ROTATION_ENABLED = -180, runningAnimations = [], isActive = false, features = secondaryFeatures.featureDefs, // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
  byId = helper.byId, CONTENTS_HEIGHT = 780;
  /********************** UTIL **************************/
  // TODO code related to the individual features should move into bp-secondary-features.js
  function forEachFeature(fn) {
    for (var feature in features) {
      if (features.hasOwnProperty(feature)) {
        fn(features[feature]);
      }
    }
  }
  /**
   * Notify the entire panel that changes have occurred
   * @param featureName or falsey value for button menu
   */
  function updateGlobalState(featureName, isSecondaryExpanding) {
    state.set("secondaryPanelName", featureName || "button-menu");
    state.set("isSecondaryExpanding", isSecondaryExpanding);
    state.set("wasMouseInPanel", false);
    // When panel shrinks mouse needs to go back inside of it before mouseout closes again
    view.update();
  }
  function getBPContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }
  function getSecondary() {
    return byId(BP_CONST.SECONDARY_ID);
  }
  function getMoreButton() {
    return byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
  }
  function getBottom() {
    return byId(BP_CONST.BOTTOM_MORE_ID);
  }
  function getShadow() {
    return byId("scp-shadow");
  }
  function getOutlineFill() {
    return byId("scp-secondary-fill");
  }
  function getSecondaryOutline() {
    return byId("scp-secondary-outline");
  }
  /********************** ANIMATIONS **************************/
  // When something major happens, such as an action to open a new panel, we cancel all current animations
  function finishAllAnimations() {
    runningAnimations.forEach(function(animation) {
      animation.finishNow();
    });
    clearTimeout(fadeInTimer);
    clearTimeout(animateHeightTimer);
    clearTimeout(animationsCompleteTimer);
    runningAnimations.length = 0;
  }
  // Create an animation and store it in runningAnimations so we can cancel it if need be
  function createAnimation(elems, values, duration, onFinishFn) {
    nativeGlobal.setTimeout(function() {
      var newAnimation = animate.animateTransforms(elems, values, duration, onFinishFn);
      runningAnimations.push(newAnimation);
    }, 18);
  }
  // Move up to make sure we fit onscreen when the secondary feature expands
  function getAmountToShiftSecondaryTop() {
    var panelTop = byId(BP_CONST.MAIN_OUTLINE_ID).getBoundingClientRect().top, secondaryBottom = panelTop + CONTENTS_HEIGHT, FUDGE_FACTOR = 190, // Extra space at bottom -- for more button and just space itself
    MIN_TOP = 10, screenBottomOverlap = secondaryBottom - FUDGE_FACTOR - window.innerHeight;
    // Don't shift above top of screen, and only shift up (or not at all)
    return Math.max(Math.min(screenBottomOverlap, panelTop - MIN_TOP), 0);
  }
  function animateButtonMenuDrop(willEnable) {
    var secondaryId = BP_CONST.SECONDARY_ID, secondaryPanel = byId(secondaryId), fromTranslateY = willEnable ? DISABLED_PANEL_TRANSLATE_Y : ENABLED_PANEL_TRANSLATE_Y, toTranslateY = willEnable ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y, moreBtnEndRotation = willEnable ? MORE_BUTTON_ROTATION_ENABLED : 0, moreButtonTransform = {
      translateY: willEnable ? toTranslateY : 0,
      rotate: moreBtnEndRotation
    }, secondaryPanelTransform = {
      translateY: toTranslateY
    };
    function onFinish() {
      secondaryFeatures.init();
      state.set("isSecondaryPanel", willEnable);
      view.update(true);
      updateMoreButtonLabel(willEnable);
    }
    finishAllAnimations();
    transformUtil.setElemTransform(secondaryPanel, {
      translateY: fromTranslateY
    });
    // Starting point
    createAnimation([ secondaryPanel, getMoreButton() ], [ secondaryPanelTransform, moreButtonTransform ], BUTTON_DROP_ANIMATION_MS, onFinish);
  }
  function getGeometryTargets(featureName, menuButton) {
    var feature = features[featureName], origMenuBtnTransforms = BP_CONST.TRANSFORMS[menuButton.id], panelContentsHeight = CONTENTS_HEIGHT, baseGeometryTargets = {
      false: {
        // Feature disabled
        outlineHeight: origOutlineHeight,
        menuBtnTranslateX: origMenuBtnTransforms.translateX,
        menuBtnRotate: 0,
        // Will be used by icons that roll
        bpContainerTranslateY: 0
      },
      true: {
        // Feature enabled
        outlineHeight: panelContentsHeight + 103,
        // The outline
        menuBtnTranslateX: 26,
        // The icon rolls left by default
        menuBtnRotate: 0,
        // Will be used by the icons that roll
        bpContainerTranslateY: getAmountToShiftSecondaryTop()
      }
    };
    return feature.module.getGeometryTargets(baseGeometryTargets);
  }
  function getCurrentOutlineHeight() {
    function getOutlineSVG() {
      return byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
    }
    var outlinePath = getOutlineSVG().getAttribute("d");
    return parseInt(outlinePath.split(" ")[2]);
  }
  function animateFeature(name, doEnable) {
    var feature = features[name], animatedImageElem = byId(feature.animatedImageId), rotationHelperElem = byId(feature.menuButtonHelperId), menuButton = byId(feature.menuButtonId), bpContainer = getBPContainer(), currentBpContainerTransforms = transformUtil.getStyleTransformMap(bpContainer), geometryTargets = getGeometryTargets(name, menuButton), toGeo = geometryTargets[doEnable], ENABLE_ANIMATION_MS = 1500, DISABLE_ANIMATION_MS = 750, wasEnabled = !!getFeaturePanelName(), percentRemaining = wasEnabled === doEnable ? 0 : 1, heightAnimationDuration = (doEnable ? ENABLE_ANIMATION_MS : DISABLE_ANIMATION_MS) * percentRemaining, heightAnimationDelay = doEnable && feature.heightAnimationDelay || 0, openFeatureDuration = doEnable && feature.heightAnimationDelay ? ENABLE_ANIMATION_MS : heightAnimationDuration, animationsCompleteMs = Math.max(openFeatureDuration, heightAnimationDelay + heightAnimationDuration);
    // When is feature fully visible
    function fadeInTextContentWhenLargeEnough() {
      fadeInTimer = nativeGlobal.setTimeout(function() {
        state.set("isSecondaryExpanding", false);
        view.update();
      }, heightAnimationDelay + .7 * heightAnimationDuration);
    }
    function onAnimationsComplete() {
      state.set("isSecondaryExpanded", doEnable);
      view.update(true);
    }
    function animateHeight() {
      var newPanelHeight = toGeo.outlineHeight, newTranslateY = currentBpContainerTransforms.translateY - toGeo.bpContainerTranslateY, bottomTranslateY = newPanelHeight - origOutlineHeight, BOTTOM_Y_OFFSET = -188, moreButtonTransform = {
        translateY: newPanelHeight + BOTTOM_Y_OFFSET
      }, bottomTransform = {
        translateY: newPanelHeight + BOTTOM_Y_OFFSET
      }, outlineFillTransform = {
        scale: newPanelHeight / origFillHeight,
        scaleType: "scaleY"
      }, secondaryOutlineTransform = {
        translateY: bottomTranslateY
      }, shadowTransform = {
        translateY: doEnable ? 435 : 0
      }, bpContainerTransform = {
        translateY: newTranslateY
      };
      createAnimation([ getMoreButton(), getBottom(), getOutlineFill(), getSecondaryOutline(), getShadow(), bpContainer ], [ moreButtonTransform, bottomTransform, outlineFillTransform, secondaryOutlineTransform, shadowTransform, bpContainerTransform ], heightAnimationDuration);
    }
    function openFeatureAnimation() {
      var // Rotations (for the about button) need to be done half and half, otherwise the rotation does not happen
      // Basically, the browser optimizes a -360deg rotation as 0!
      // So we do -180 on the parent and -180 on the child
      // Don't need to use in IE where CSS transitions aren't used with SVG
      toRotation = toGeo.menuBtnRotate / 2, menuButtonTransform = {
        translateX: toGeo.menuBtnTranslateX,
        rotate: toRotation
      }, rotationHelperTransform = {
        rotate: toRotation
      }, animatedImageTransform = {
        translateX: toGeo.menuImageTranslateX
      };
      createAnimation([ menuButton, rotationHelperElem, animatedImageElem ], [ menuButtonTransform, rotationHelperTransform, animatedImageTransform ], openFeatureDuration);
    }
    finishAllAnimations();
    if (doEnable && getFeaturePanelName()) {
      // If we are switching from one panel to another, make sure buttons start from initial state
      resetButtonStyles();
    }
    updateGlobalState(doEnable && name, doEnable);
    // Animate the menu button and anything else related to opening the feature
    openFeatureAnimation();
    // Animate the height at the right time
    animateHeightTimer = nativeGlobal.setTimeout(animateHeight, heightAnimationDelay);
    animationsCompleteTimer = nativeGlobal.setTimeout(onAnimationsComplete, animationsCompleteMs);
    fadeInTextContentWhenLargeEnough();
    events.emit("bp/will-show-secondary-feature", name);
  }
  /********************** INTERACTIONS **************************/
  function onMenuButtonClick(e) {
    var featureName = e.currentTarget.getAttribute("data-feature");
    if (featureName) {
      toggleFeature(featureName);
    }
  }
  function getFeaturePanelName() {
    var secondaryPanelName = state.getSecondaryPanelName();
    return features[secondaryPanelName] && secondaryPanelName;
  }
  /**
   * Toggle back and forth between main panel and secondary panel
   */
  function toggleSecondaryPanel(feature) {
    var featurePanelName = feature || getFeaturePanelName();
    if (featurePanelName) {
      toggleFeature(featurePanelName);
      return;
    }
    var ENABLED = BP_CONST.SECONDARY_PANEL_ENABLED, DISABLED = BP_CONST.SECONDARY_PANEL_DISABLED, willEnable = state.get("secondaryPanelTransitionTo") !== ENABLED;
    state.set("secondaryPanelTransitionTo", willEnable ? ENABLED : DISABLED);
    updateGlobalState();
    if (true) {
      console.log("Transitioning secondary panel to mode: " + state.get("secondaryPanelTransitionTo"));
    }
    //Text anchors don't work in Edge, and furthermore the secondary panel isn't rendered in Edge until it is enabled
    //So this is where we have access to the length of the string and can reposition the text elements correctly
    if (!hasOpened) {
      hasOpened = true;
      if (platform.browser.isEdge) {
        helper.fixTextAnchors(byId(BP_CONST.SECONDARY_ID));
      }
    }
    animateButtonMenuDrop(willEnable);
    toggleMouseListeners(willEnable);
  }
  function updateMoreButtonLabel(doPointToMainPanel) {
    nativeGlobal.setTimeout(function() {
      var labelName = doPointToMainPanel ? "sitecues_main_panel" : "more_features", localizedLabel = locale.translate(labelName);
      byId(BP_CONST.MORE_BUTTON_GROUP_ID).setAttribute("aria-label", localizedLabel);
    }, 500);
  }
  /**
   * Return truthy value if feature is loaded and available
   * @param featureName
   * @returns {*|HTMLElement}
   */
  function isFeatureAvailable(featureName) {
    return byId(features[featureName].panelId);
  }
  /**
   * Toggle back and forth between button menu and a feature
   * @param featureName
   */
  function toggleFeature(featureName) {
    var willEnable = state.getSecondaryPanelName() !== featureName;
    updateMoreButtonLabel(!willEnable);
    if (willEnable && !isFeatureAvailable(featureName)) {
      // The feature was not loaded yet -- wait until loaded
      events.on("bp/content-loaded", function() {
        if (state.isButtonMenu()) {
          // Make sure user hasn't left the 4 button menu while we waited
          toggleFeature(featureName);
        }
      });
    } else {
      events.emit("bp/will-toggle-feature");
      animateFeature(featureName, willEnable);
    }
  }
  function toggleMouseListeners(willBeActive) {
    if (isActive === willBeActive) {
      return;
    }
    isActive = willBeActive;
    var addOrRemoveFn = isActive ? "addEventListener" : "removeEventListener";
    function addOrRemoveClick(id) {
      var elem = byId(id);
      elem[addOrRemoveFn]("click", onMenuButtonClick);
    }
    forEachFeature(function(feature) {
      addOrRemoveClick(feature.menuButtonId);
      addOrRemoveClick(feature.labelId);
    });
  }
  /********************** INIT / RESET **************************/
  function resetStyles() {
    var moreButton = getMoreButton(), HEIGHT_RELATED_ELEMS = [ getSecondary(), moreButton, getBottom(), getOutlineFill(), getSecondaryOutline(), getShadow() ];
    HEIGHT_RELATED_ELEMS.forEach(function(elem) {
      transformUtil.setElemTransform(elem, {});
      if (!platform.browser.isFirefox) {
        // Do not use will-change in Firefox as it caused SC-3421 on some sites
        inlineStyle(elem).willChange = "transform";
      }
    });
    resetWebKitLayout(moreButton);
    resetButtonStyles();
  }
  function resetWebKitLayout(elem) {
    // Hack to fix Chrome/Safari bug where the more button was in the wrong place after resetting styles
    // This forces WebKit to reflow the element's layout.
    var style = inlineStyle(elem), display = style.display;
    style.display = "none";
    // jshint unused:false
    getBPContainer().offsetHeight;
    // Force layout refresh
    style.display = display;
  }
  function resetButtonStyles() {
    // Menu buttons
    forEachFeature(function(feature) {
      var button = feature.menuButtonId, transform = BP_CONST.TRANSFORMS[button], buttonElem = byId(button);
      transformUtil.setElemTransform(buttonElem, transform);
      if (feature.menuButtonHelperId) {
        transformUtil.setElemTransform(byId(feature.menuButtonHelperId), {});
      }
      if (feature.animatedImageId) {
        transformUtil.setElemTransform(byId(feature.animatedImageId), {});
      }
      resetWebKitLayout(buttonElem);
    });
  }
  function onPanelClose() {
    if (state.isSecondaryPanelRequested()) {
      // Toggle current panel off
      events.emit("bp/did-toggle-" + state.getSecondaryPanelName(), false);
    }
    finishAllAnimations();
    resetStyles();
    // Next time panel opens, it will be at the main panel;
    // Therefore, the more button label for screen readers needs to indicate the secondary panel will open
    updateMoreButtonLabel();
    state.set("secondaryPanelTransitionTo", BP_CONST.SECONDARY_PANEL_DISABLED);
    updateGlobalState();
    toggleMouseListeners(false);
  }
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      // Insert the markup for the secondary panel
      markup.init();
      resetButtonStyles();
      origOutlineHeight = getCurrentOutlineHeight();
      origFillHeight = parseFloat(getOutlineFill().getAttribute("height"));
      origPanelContentsRect = document.getElementById(BP_CONST.MAIN_CONTENT_FILL_ID).getBoundingClientRect();
      events.on("bp/will-shrink", onPanelClose);
      events.emit("bp/did-init-secondary");
    }
  }
  return {
    init: init,
    toggleSecondaryPanel: toggleSecondaryPanel,
    toggleFeature: toggleFeature
  };
});

sitecues.define("bp-secondary", function() {});
//# sourceMappingURL=bp-secondary.js.map