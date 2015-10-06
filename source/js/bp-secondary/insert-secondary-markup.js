// Markup for the secondary panel
define(['bp/view/markup-finalizer', 'bp/helper', 'core/platform', 'bp-secondary/font-charset', 'core/conf/urls'],
  function(finalizer, helper, platform, fontCharset, urls) {
  /*jshint multistr: true */

var isInitialized,
  svgSecondary =
'<g id="scp-secondary" class="scp-secondary-only" aria-label="{{more_features}}" clip-path="url(#scp-outline-clip-def)">\
  <use id="scp-secondary-outline" xlink:href="#scp-outline-def" fill="white"/>\
  <g id="scp-bottom-secondary">\
    <use xlink:href="#scp-bottom-def"/>\
    <text id="scp-tips-label" text-anchor="middle" class="scp-hand-cursor" role="button" aria-label="{{tips}}" data-feature="tips" x="75" y="178">{{tips}}</text>\
    <text id="scp-settings-label" text-anchor="middle" class="scp-hand-cursor" role="button" aria-label="{{settings}}" data-feature="settings" x="285" y="178">{{settings}}</text>\
    <text id="scp-feedback-label" text-anchor="middle" class="scp-hand-cursor" role="button" aria-label="{{rate_us}}" data-feature="feedback" x="517" y="178">{{rate_us}}</text>\
    <text id="scp-about-label" text-anchor="middle" class="scp-hand-cursor" role="button" aria-label="{{about}}" data-feature="about" x="730" y="178">{{about}}</text>\
  </g>\
  <rect id="scp-card-header-bg" class="scp-secondary-feature-only" width="808" height="134" stroke="#C0BFBF" stroke-width="1" fill="#EEE"/>\
  <g>\
    <g id="scp-arrows" class="scp-transition-opacity scp-secondary-feature scp-if-settings scp-if-tips">\
      <g id="scp-prev-card" class="scp-arrow scp-hand-cursor scp-transition-opacity" transform="translate(640,72) rotate(90) scale(1.4)" role="button" aria-label="{{previous}}" aria-disabled="true">\
        <g data-hover="scale(1.3)">\
          <use xlink:href="#scp-arrow"/>\
          <rect class="scp-hidden-target" x="-25" y="-10" width="50" height="50"/>\
        </g>\
      </g>\
      <g id="scp-next-card" class="scp-arrow scp-hand-cursor" transform="translate(729,72) rotate(-90) scale(1.4)" role="button" aria-label="{{next}}">\
        <g data-hover="scale(1.3)">\
          <use xlink:href="#scp-arrow"/>\
          <rect class="scp-hidden-target" x="-25" y="-25" width="50" height="50"/>\
        </g>\
      </g>\
    </g>\
    <g id="scp-feedback" class="scp-if-feedback scp-transition-opacity scp-secondary-feature" role="group" aria-labelledby="scp-feedback-header">\
      <rect id="scp-feedback-input-rect" data-own-focus-ring x="45" y="315" width="715" height="400" stroke-width="3" stroke="#aaa" fill="#fdfcfc" rx="20" ry="20"/>\
      <g id="scp-rating" class="scp-hand-cursor" role="group" aria-label="{{rating}}">\
        <use id="scp-stars-1" role="button" aria-pressed="false" aria-label="{{rating_1}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="42" y="736"/>\
        <use id="scp-stars-2" role="button" aria-pressed="false" aria-label="{{rating_2}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="108" y="736"/>\
        <use id="scp-stars-3" role="button" aria-pressed="false" aria-label="{{rating_3}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="174" y="736"/>\
        <use id="scp-stars-4" role="button" aria-pressed="false" aria-label="{{rating_4}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="240" y="736"/>\
        <use id="scp-stars-5" role="button" aria-pressed="false" aria-label="{{rating_5}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="306" y="736"/>\
      </g>\
      <g id="scp-feedback-send" class="scp-hand-cursor" aria-disabled="true" role="button" aria-label="{{send}}">\
        <rect x="595" width="165" y="740" height="50" rx="20" ry="20"/>\
        <text x="678" y="775" text-anchor="middle" font-family="Arial" fill="white">{{send}}</text>\
      </g>\
    </g>\
    <g id="scp-about" class="scp-if-about" transform="translate(805,16)">\
      <g id="scp-logo-text">\
        <image id="scp-sitecues-text" transform="scale(.84) translate(-28, -12)" width="400" height="100"></image>\
        <text text-anchor="end" style="font-family:Open Sans;font-size:24px" y="96" x="300">{{zoom_and_speech}}</text>\
      </g>\
    </g>\
  </g>\
  <g id="scp-button-menu" transform="translate(52,66)">\
    <g id="scp-tips-button" class="scp-if-tips scp-hand-cursor scp-transition-opacity" role="button" data-feature="tips" aria-labelledby="scp-tips-label">\
      <g data-hover="scale(1.2)">\
        <circle r="52" fill="#548ECE"/>\
        <circle r="22" transform="translate(0,-14)" fill="#fff"/> <!-- Fix fill blink bug in Chrome -->\
        <path fill="#fff" stroke="#fff" stroke-width="3" stroke-miterlimit="10" d="m.9,-34.3c12.3,0 22.2,10 22.2,22.2c0,12.1 -7.3,13.5 -8.7,26.7c0,1.2 -1,2.2 -2.2,2.2h-11.4m.1,0h-.1h-11.3c-1.2,0 -2.2,-1 -2.2,-2.2c-1.4,-13.2 -8.7,-14.6 -8.7,-26.7c0,-12.3 10,-22.2 22.2,-22.2"/>\
        <path fill="#fff" d="m14,23.5c0,1.2 -1,2.2 -2.2,2.2h-22.2c-1.2,0 -2.2,-1 -2.2,-2.2c0,-1.2 1,-2.2 2.2,-2.2h22.2c1.2,0 2.2,1 2.2,2.2zm0,6.5c0,1.2 -1,2.2 -2.2,2.2h-22.2c-1.2,0 -2.2,-1 -2.2,-2.2c0,-1.2 1,-2.2 2.2,-2.2h22.2c1.2,0 2.2,1 2.2,2.2zm-27,4.5h23c0,2.5 -2,4.5 -4.5,4.5h-8.9c-2.5,0 -4.5,-2 -4.5,-4.5l0,0l0,0l.1,0l-5.2,0z"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
    <g id="scp-settings-button" class="scp-if-settings scp-hand-cursor scp-transition-opacity" role="button" data-feature="settings" aria-labelledby="scp-settings-label">\
      <g data-hover="scale(1.2)">\
        <path d="m-36,47.8c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6.2c-1.3,0 -2.3,1 -2.3,2.3v91l0,-.2zm61.4,0c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6c-1.3,0 -2.3,1 -2.3,2.3v90.8l-.2,0zm-30.7,0c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6c-1.3,0 -2.3,1 -2.3,2.3v90.8l-.2,0z" fill="#7B7B7B"/>\
        <path d="m-19.7,4.5c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.3c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.3l0,0zm30.7,-28.5c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.2c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.40001l0,-.2zm31.5,46.4c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.3c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.3l0,0z" fill="#548ECE"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
    <g id="scp-feedback-button" class="scp-if-feedback scp-hand-cursor scp-transition-opacity" role="button" data-feature="feedback" aria-labelledby="scp-feedback-label">\
      <g data-hover="scale(1.2)">\
        <path d="m-10,40c3,1 7,1 11,1c27,0 49,-19 49,-43c0,-24 -22,-44 -49,-44c-27,0 -50,19 -50,43c0,12 6,23 15,31c-2.2,9.2 -7.6,14.8 -17,20.7c15,-1 25,2 41,-9" stroke="#548ECE" stroke-miterlimit="5" stroke-linejoin="round" stroke-linecap="round" stroke-width="5.5" fill="#FFF"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
    <g id="scp-about-button" class="scp-if-about scp-hand-cursor scp-transition-opacity" role="button" data-feature="about" aria-labelledby="scp-about-label">\
      <g data-hover="scale(1.2)">\
        <path d="m15.8,-9.5h-11.2c-1,0 -3.4,3.9 -3.4,5.2l.1,15.3l-49.8,6.1h0c-1.6,-5 -2.5,-10.3 -2.5,-15.8c0,-27.9 22.6,-50.4 50.4,-50.4c21.2,0 39.4,13 46.8,31.7h0c5,11.2 0,22.2 -10.89999,24.1l-16.10001,2l0,-13.1c0,-1.2 -2.39999,-5.1 -3.39999,-5.1zm-7,47.3c1.6,1.89999 2.8,0 2.8,0l7.1,-11.10001c.2,-.3 .4,-.6 .4,-1v0v-4h26.4h0c-7.8,17.8 -25.5,30.3 -46.2,30.3c-20.7,0 -38.4,-12.4 -46.2,-30.3v0h48.1v4.3c0,.3 .2,.6 .4,.9l7.2,10.9z" fill="#000"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
  </g>\
</g>',
htmlSecondary =
'<sc-h1 id="scp-feedback-header" class="scp-card-header">{{rate_us}}</sc-h1>\
<sc class="scp-secondary-feature scp-transition-opacity scp-if-feedback" role="group" aria-labelledby="scp-feedback-header">\
  <sc-p id="scp-feedback-prompt">{{rate_us_suggest}} {{rate_us_prompt}}</sc-p>\
  <textarea id="scp-feedback-textarea" class="scp-hand-cursor" \
    aria-describedby="scp-feedback-prompt" data-visible-focus-on="scp-feedback-input-rect" placeholder="{{tell_us_something}}"></textarea>\
</sc>\
<sc id="scp-feedback-thanks" class="scp-if-feedback-sent" role="note" aria-label="{{thank_you}}">\
  <sc-h1>{{thank_you}}</sc-h1>\
</sc>\
<sc class="scp-about-teaser scp-if-about scp-transition-opacity scp-secondary-feature" role="group" aria-label="{{about}} sitecues">\
  <sc-p>\
    <sc-span id="scp-about-preamble">{{about_preamble}}</sc-span>\
    <a id="scp-about-sitecues-link" aria-describedby="scp-about-preamble" target="_blank" href="http://sitecues.com">sitecues.com</a>.\
  </sc-p>\
  <sc-p id="scp-about-rate-footer">\
    <sc-span id="scp-rate-us-suggest" role="heading">{{about_rate_us}}</sc-span><br/>\
    <sc-button id="scp-about-rate-button" role="button" aria-describedby="scp-rate-us-suggest">{{rate_us}}</sc-button>\
  </sc-p>\
</sc>';

  function insertHtml(insertionId, markup) {
    var where = helper.byId(insertionId),
      finalMarkup = finalizer(markup);
    where.outerHTML = finalMarkup;
  }

  function insertSvg(insertionId, markup) {
    // Unfortunately innertHTML, outerHTML, insertAdjacentHTML do not work for <svg> in Safari (or probably IE)
    // We have to create the elements in the SVG namespace and then insert it
    var where = helper.byId(insertionId),
      finalMarkup = finalizer(markup),
      divElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
      svgElement,
      svgContentToInsert;

    // Use HTML element so that we can use innerHTML property
    divElement.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg">' + finalMarkup + '</svg>';
    svgElement = divElement.firstChild; // This is the <svg> element
    svgContentToInsert = svgElement.firstChild;  // This is the actual content we want
    where.parentNode.replaceChild(svgContentToInsert, where);
  }

  function insertSheet(name) {
    var cssLink = document.createElement('link'),
      cssUrl = urls.resolveResourceUrl('css/' + name + '.css');
    cssLink.setAttribute('rel', 'stylesheet');
    cssLink.setAttribute('href', cssUrl);
    cssLink.id = 'sitecues-' + name;
    document.querySelector('head').appendChild(cssLink);
  }

  function insertSheets() {
    // CSS: always use secondary.css
    insertSheet('secondary');
    // CSS: use latin-ext.css etc. if necessary
    var extendedFontCharsetName = fontCharset();
    if (extendedFontCharsetName) {
      insertSheet(extendedFontCharsetName);
    }
    // CSS: use vendor stylesheet as well (e.g. secondary-moz.css, secondary-ie.css, secondary-webkit.css)
    if (platform.cssPrefix) {
      insertSheet('secondary' + platform.cssPrefix);
    }
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      insertHtml('scp-html-secondary-anchor', htmlSecondary);
      insertSvg('scp-secondary-anchor', svgSecondary, true);
      insertSheets();
    }
  }

  return {
    init: init
  };
});
