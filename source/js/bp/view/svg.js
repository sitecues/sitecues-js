// todo:
// 1. move this code to .html file and then convert to js-code
// 2. split the general svg to a smaller pieces
/*
The purpose of some elements:
- #scp-zoom-slider-target used for slider size manipulation while draging the slider thumb or other actions
- #scpspeechtarget adds animation styles for speech icon waves
-
 */
define(['locale/locale', 'util/platform'], function(locale, platform) {
  /*jshint multistr: true */

  'use strict';

  var svg = '\
<sc id="scp-focus-outline" role="presentation"></sc>\
\
<svg id="scp-svg" role="group" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1050 300" preserveAspectRatio="xMinYMin" data-sc-reversible="false">\
<defs>\
  <g id="scp-small-A-def">\
    <path d="m37 .2l23 62h-14l-5 -14h-23l-5 14h-14l23 -62h14zm1 38l-9 -23h0l-8 23h16z"/>\
    <rect class="scp-hidden-target scp-hand-cursor" x="-22" y="-35" width="102" height="134"/>\
  </g>\
  <g id="scp-large-A-def">\
    <path d="m54 0l33 89h-20l-7 -20h-33l-7 20h-20l34 -89h20zm1 55l-11 -32h0l-12 33h23z"/>\
    <rect class="scp-hidden-target scp-hand-cursor" x="-22" y="-20" width="140" height="132"/>\
  </g>\
  <path id="scp-zoom-slider-bar-def" d="m278 3v27c0 2 -1 3 -3 3h-273c-2 0 -3 -1 -3 -3v-6c0 -1 1 -2 2 -3l273 -22c1 0 3 1 3 3z"/>\
  <path id="scp-zoom-slider-thumb-def" d="m11,64l-10,-15v-41c0,-2 3,-7 5,-7h15c1,0 5,5 5,7v41l-10,15c0,0 -2.5,2 -5,0"/>\
  <path id="scp-head-def" d="m76 45c0 1 2 4 -2 5c-1 0 -2 .5 -4 .5c-1 0 -2 1 -1 2c0 1 0 2 -2 3c1 0 2 0 2 1c0 1 -1 1 -1 3c0 1 3 5 2 8c0 3 -10 2 -20 2c0 0 -3 11 10 13c7 1 14 7 14 16h-74c0 -5 0 -12 8 -14c0 0 14 -5 14 -14c1 -13 -9 -17 -11 -27c-5 -21 6 -39 29 -39c8 0 13 2 15 4c10 5 12 16 12 22c0 3 -2 6 .5 8c8 6 8 6 9 7z"/>\
  <path id="scp-wave1-def" d="m105 26c0 0 26 25 1 52c-3 3 -9 2 -11 1c-2 -1 -4 -4 -2 -6c0 0 17 -18 0 -41c-1 -2 0 -5 2 -6c2 -1 8 -2 11 1z"/>\
  <path id="scp-wave2-def" d="m134 14c37 41 0 74 0 74c-3 3 -9 2 -11 1c-2 -1 -4 -4 -2 -6c27 -35 0 -64 0 -64l0 0c-1 -2 0 -5 2 -6c2 -1 9 -1 11 1z"/>\
  <path id="scp-wave3-def" d="m167 2c0 0 48 47 0 97c-3 3 -9 2 -11 1c-2 -1 -3 -5 -2 -6c36 -47 0 -87 0 -87c-1 -2 0 -5 2 -6c2 -1 9 -2 11 1z"/>\
  <g id="scp-bottom-def">\
    <rect x="0" y="134" width="808" stroke="#C0BFBF" stroke-width="1" height="1" fill="none"/>\
    <path d="M807,186c0,6-5,11-11,11H12C6,196,1,192,1,187v-42 c0-6,0-11,0-11h807c0,0,0,5,0,11V186" fill="#EEE"/>\
  </g>\
  <clipPath id="scp-outline-clip-def">\
    <path id="scp-outline-def" d="M 808 187c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V 187" stroke="#999" stroke-width="1.5"/>\
  </clipPath>\
  <g id="scp-rating-star-def">\
    <path d="M30 45L48 54L44 35L59 21L39 18L30 0L21 18L1 21L16 35L12 54L30 45"/>\
    <rect class="scp-hidden-target scp-hand-cursor" width="66" height="62"/>\
  </g>\
  <filter id="scp-shadowblur">\
    <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>\
  </filter>\
  <filter id="scp-focusblur">\
    <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>\
  </filter>\
  <path id="scp-arrow" d="m18,-1.9c-1.3,1.4 -15.6,15 -15.6,15c-.7,.7 -1.7,1.2 -2.7,1.2c-1,0 -1.89999,-.4 -2.7,-1.2c0,0 -14.2,-13.6 -15.6,-15c-1.3,-1.4 -1.4,-3.9 0,-5.3c1.4,-1.5 3.5,-1.6 5.2,0l13,12.5l13,-12.5c1.8,-1.6 3.8,-1.5 5.2,0c1.3,1.8 1.3,4 0,5.3l.2,0z"/>\
</defs>\
<rect id="scp-badge-bg" fill="white" stroke-width="0" x="0" y="0" width="630" height="124" opacity="0"/>\
<rect id="scp-badge-focus-rect" fill="transparent" stroke-width="0" x="10" y="10" width="620" height="114" rx="15" ry="15" filter="url(#scp-shadowblur)"/>\
<g id="scp-main" aria-label="{{sitecues_main_panel}}">\
  <path id="scp-shadow" d="m808,188c0,6 -5,11 -11,11H11m797,-11v-188" stroke="#000" stroke-width="2" filter="url(#scp-shadowblur)" fill="none"/>\
  <rect id="scp-main-content-fill" fill="white" stroke-width="0" x="1" y="1" width="806" height="134" class="scp-panel-only" opacity="0"/>\
  <use id="scp-main-outline" xlink:href="#scp-outline-def" class="scp-panel-only" opacity="0" fill="none"/>\
  <use id="scp-small-A" xlink:href="#scp-small-A-def" y="48" role="button" aria-label="{{zoom_out}}" class="scp-A-button"/>\
  <g id="scp-zoom-slider-bar" role="slider" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1" aria-labelledby="scp-zoom-label" data-thumb-mover="scp-zoom-slider-thumb">\
    <use xlink:href="#scp-zoom-slider-bar-def" x="80" y="60"/>\
    <rect id="scp-zoom-slider-target" class="scp-hidden-target scp-hand-cursor" x="80" y="44" width="280" height="67"/>\
  </g>\
  <use id="scp-zoom-slider-thumb" class="scp-hand-cursor" xlink:href="#scp-zoom-slider-thumb-def" role="presentation" aria-controls="scp-zoom-slider-bar" y="48" x="60"/>\
  <use id="scp-large-A" xlink:href="#scp-large-A-def" x="380" y="21" role="button" aria-label="{{zoom_in}}" class="scp-A-button"/>\
  <line id="scp-vert-divider" class="scp-panel-only" opacity="0" stroke="#888" stroke-width="2" x1="500" y1="31" x2="500" y2="99"/>\
  <g id="scp-speech" role="checkbox" aria-checked="false" aria-label="{{speech}}"> <!-- ARIA Toggle button not working well with NVDA screen reader -->\
    <use id="scp-head" xlink:href="#scp-head-def" x="530" y="11"/>\
    <use id="scp-wave1" xlink:href="#scp-wave1-def" class="scp-wave" x="530" y="11"/>\
    <use id="scp-wave2" xlink:href="#scp-wave2-def" class="scp-wave" x="530" y="11"/>\
    <use id="scp-wave3" xlink:href="#scp-wave3-def" class="scp-wave" y="11" x="530"/>\
    <rect id="scp-speech-target" x="530" y="5" width="193" height="115" class="scp-hidden-target scp-hand-cursor"/>\
  </g>\
  <g id="scp-bottom" class="scp-panel-only" opacity="0">\
    <use id="scp-bottom-mousetarget" xlink:href="#scp-bottom-def"/>\
    <g id="scp-bottom-text" opacity="0">\
      <text id="scp-zoom-label" x="25" y="178"><tspan id="scp-zoom-value"> </tspan></text>\
      <text id="scp-speech-label" x="581" y="178" data-x-start="581" data-x-end="795">\
        {{speech}}<tspan> </tspan><tspan id="scp-speech-state"> </tspan>\
      </text>\
    </g>\
    <rect opacity="0" x="0" y="195" width="808" height="64"/>\
  </g>\
</g>\
<g id="scp-secondary" class="scp-secondary-only" aria-label="{{more_features}}" clip-path="url(#scp-outline-clip-def)">\
  <use id="scp-secondary-outline" xlink:href="#scp-outline-def" fill="white"/>\
  <g id="scp-bottom-secondary">\
    <use xlink:href="#scp-bottom-def"/>\
    <text id="scp-tips-label" text-anchor="middle" class="scp-hand-cursor" role="link" data-feature="tips" x="75" y="178">{{tips}}</text>\
    <text id="scp-settings-label" text-anchor="middle" class="scp-hand-cursor" role="link" data-feature="settings" x="285" y="178">{{settings}}</text>\
    <text id="scp-feedback-label" text-anchor="middle" class="scp-hand-cursor" role="link" data-feature="feedback" x="517" y="178">{{rate_us}}</text>\
    <text id="scp-about-label" text-anchor="middle" class="scp-hand-cursor" role="link" data-feature="about" x="730" y="178">{{about}}</text>\
  </g>\
  <rect id="scp-card-header-bg" class="scp-if-tips scp-secondary-feature" width="808" height="134" stroke="#C0BFBF" stroke-width="1" fill="#EEE"/>\
  <g>\
    <g id="scp-arrows" class="scp-transition-opacity scp-secondary-feature scp-if-settings scp-if-tips">\
      <g id="scp-prev-card" class="scp-arrow scp-hand-cursor scp-transition-opacity" transform="translate(640,72) rotate(90) scale(1.4)" role="button" aria-label="{{previous}}" aria-disabled="true">\
        <g data-hover="scale(1.3)">\
          <use xlink:href="#scp-arrow"/>\
          <rect class="scp-hidden-target" x="-25" y="-15" width="50" height="50"/>\
        </g>\
      </g>\
      <g id="scp-next-card" class="scp-arrow scp-hand-cursor" transform="translate(729,72) rotate(-90) scale(1.4)" role="button" aria-label="{{next}}">\
        <g data-hover="scale(1.3)">\
          <use xlink:href="#scp-arrow"/>\
          <rect class="scp-hidden-target" x="-25" y="-15" width="50" height="50"/>\
        </g>\
      </g>\
    </g>\
    <g id="scp-feedback" class="scp-if-feedback scp-transition-opacity scp-secondary-feature">\
      <rect id="scp-feedback-input-rect" data-own-focus-ring x="45" y="35" width="715" height="200" stroke-width="3" stroke="#aaaaaa" fill="none" rx="20" ry="20"/>\
      <g id="scp-rating" class="scp-hand-cursor" role="group" aria-label="{{rating}}">\
        <use id="scp-stars-1" role="button" aria-pressed="false" aria-label="{{rating_1}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="42" y="254"/>\
        <use id="scp-stars-2" role="button" aria-pressed="false" aria-label="{{rating_2}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="108" y="254"/>\
        <use id="scp-stars-3" role="button" aria-pressed="false" aria-label="{{rating_3}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="174" y="254"/>\
        <use id="scp-stars-4" role="button" aria-pressed="false" aria-label="{{rating_4}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="240" y="254"/>\
        <use id="scp-stars-5" role="button" aria-pressed="false" aria-label="{{rating_5}}" class="scp-rating-star" xlink:href="#scp-rating-star-def" x="306" y="254"/>\
      </g>\
      <g id="scp-feedback-send" class="scp-hand-cursor" aria-disabled="true" role="button">\
        <rect x="615" width="150" y="260" height="50" rx="20" ry="20"/>\
        <text x="654" y="295" font-family="Arial" fill="white">{{send}}</text>\
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
        <path d="m-10,40c3,1 7,1 11,1c27,0 49,-19 49,-43c0,-24 -22,-44 -49,-44c-27,0 -50,19 -50,43c0,12 6,23 15,31m24,11.5c-6,5 -19,9.4 -41,9m17.4,-20.3c-2.2,9.2 -7.6,14.8 -17,20.7" stroke-miterlimit="10" stroke-linecap="round" stroke-width="5.5" stroke="#548ECE" fill="#FFF"/>\
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
</g>\
<use id="scp-outline" xlink:href="#scp-outline-def" class="scp-panel-only" fill="none" opacity="0"/>\
<g id="scp-more-button-container" transform="translate(400,198)">\
  <g id="scp-more-button-group" data-hover="scale(1.2)" class="scp-hand-cursor" role="button" aria-label="{{more_features}}">\
    <circle fill="#FFF" stroke="#777" stroke-width="5" stroke-miterlimit="10" cx="0" cy="0" r="34"/>\
    <use fill="#777" xlink:href="#scp-arrow"/>\
   </g>\
</g>\
<rect id="scp-mouseover-target" x="0" y="0" width="700" height="160" opacity="0"/>\
</svg>\
\
<textarea id="scp-feedback-textarea" class="scp-if-feedback scp-transition-opacity scp-secondary-feature scp-hand-cursor" data-visible-focus-on="scp-feedback-input-rect" placeholder="{{tell_us_something}}"></textarea>\
<sc class="scp-if-feedback-sent scp-transition-opacity scp-secondary-feature">\
  <sc-h1>{{thank_you}}</sc-h1>\
</sc>\
<sc class="scp-about-teaser scp-if-about scp-transition-opacity scp-secondary-feature">\
  <sc-p>\
    <a id="scp-about-1" target="_blank" href="http://sitecues.com">sitecues.com</a>\
    </sc-p>\
  <sc-p>\
    <a id="scp-about-2" target="_blank" href="tel:+1-857-259-5272">+1-857-259-5272</a>\
  </sc-p>\
  <sc-p>\
    <a id="scp-about-3" target="_blank" href="mailto:sales@sitecues.com">sales@sitecues.com</a>\
  </sc-p>\
</sc>\
<sc style="display:none"></sc>'; // Hack to make sure innerHTML doesn't remove any important last element

  // The original base URL for the current page regardless of <base> tag
  function removeEnd(loc) {
    var locString = '' + loc; // Convert to string
    return locString.substring(0, locString.lastIndexOf('/'));
  }

  function removeHash(loc) {
    return loc.replace(/\#.*/, '');
  }

  function getBaseURI() {
    var link = document.createElement('a');
    link.href = '';
    return link.href;
  }

  function hasAlteredBaseURI() {
    return removeEnd(getBaseURI()) !== removeEnd(document.location.href);
  }

  // Sitecues URLs must be absolute.
  // For example, change /images/foo.png to http://js.sitecues.com/images/foo.png
  function convertSitecuesUrlsToAbsolute(text) {
    var MATCH_URLS = /(href="|url\()(\/.*)"/g;

    return text.replace(MATCH_URLS, function (totalMatch, attributeName, url) {
      return attributeName + sitecues.resolveSitecuesUrl(url);
    });
  }

  // Relative URLs must be full URLS that <base> tag doesn't mess them up!
  // Without this fix, markup such as xlink:href="#foo" or filter="url(#foo)" will not work in Firefox
  // when the source document uses a <base> tag.
  function convertRelativeUrlsToAbsolute(text) {
    if (hasAlteredBaseURI() && !platform.isIE9()) {
      var MATCH_URLS = /(href="|url\()(?:#)/g,
        pageUrlMinusHash = removeHash(document.location.href);

      return text.replace(MATCH_URLS, function (totalMatch, attributeName) {
        return attributeName + pageUrlMinusHash + '#';
      });
    }

    return text;
  }
  bpSVG.getSvg = function() {
    var svgWithCorrectSitecuesUrls = convertSitecuesUrlsToAbsolute(svg),
      svgWithAllAbsoluteUrls = convertRelativeUrlsToAbsolute(svgWithCorrectSitecuesUrls),
      localizedSvg = locale.localizeStrings(svgWithAllAbsoluteUrls);

    return localizedSvg;
  };
});
