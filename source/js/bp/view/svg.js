// todo:
// 1. move this code to .html file and then convert to js-code
// 2. split the general svg to a smaller pieces
/*
The purpose of some elements:
- #scp-zoom-slider-target used for slider size manipulation while draging the slider thumb or other actions
- #scpspeechtarget adds animation styles for speech icon waves
-
 */
sitecues.def('bp/view/svg', function (bpSVG, callback) {

  'use strict';

  bpSVG.html = '\
<svg role="group"xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1804 440" id="scp-svg">\
<defs>\
  <g id="scp-small-A-def"> \
    <path d="m37 .2l23 62h-14l-5 -14h-23l-5 14h-14l23 -62h14l0 0zm1 38l-9 -23h0l-8 23h16l0 0z"/> \
    <rect opacity="0" x="-22" y="-35" width="102" height="134"/>\
  </g> \
  <g id="scp-large-A-def"> \
    <path d="m54 0l33 89h-20l-7 -20h-33l-7 20h-20l34 -89h20l0 0zm1 55l-11 -32h0l-12 33h23l0 0z"/> \
    <rect opacity="0" x="-22" y="-20" width="140" height="132"/>\
  </g> \
  <path id="scp-zoom-slider-bar-def" d="m278 3v27c0 2 -1 3 -3 3h-273c-2 0 -3 -1 -3 -3v-6c0 -1 1 -2 2 -3l273 -22c1 0 3 1 3 3l0 0z"/> \
  <path id="scp-zoom-slider-thumb-def" d="m11 64l-10 -15c0 0 0 -1 -1 -1l0 -40c0 -2 3 -7 5 -7h15c1 0 5 5 5 7v40v0c0 0 0 1 -1 1l-10 15c0 0 -2 2 -4 0l0 0z" /> \
  <path id="scp-head-def" d="m76 45c0 1 2 4 -2 5c-1 0 -2 .5 -4 .5c-1 0 -2 1 -1 2c0 1 0 2 -2 3c1 0 2 0 2 1c0 1 -1 1 -1 3c0 1 3 5 2 8c-0 3 -10 2 -20 2c0 0 -3 11 10 13c7 1 14 7 14 16h-74c0 -5 0 -12 8 -14c0 0 14 -5 14 -14c1 -13 -9 -17 -11 -27c-5 -21 6 -39 29 -39c8 0 13 2 15 4c10 5 12 16 12 22c0 3 -2 6 .5 8c8 6 8 6 9 7l0 0z"/> \
  <path id="scp-wave1-def" d="m105 26c0 0 26 25 1 52c-3 3 -9 2 -11 1l-0 0c-2 -1 -4 -4 -2 -6l0 0c-0 0 17 -18 0 -41c-1 -2 0 -5 2 -6c2 -1 8 -2 11 1l-0 0z" /> \
  <path id="scp-wave2-def" d="m134 14c37 41 0 74 0 74c-3 3 -9 2 -11 1l0 0c-2 -1 -4 -4 -2 -6c27 -35 0 -64 0 -64l-0 -0c-1 -2 0 -5 2 -6c2 -1 9 -1 11 1l0 0z" /> \
  <path id="scp-wave3-def" d="m167 2c-0 0 48 47 -0 97c-3 3 -9 2 -11 1l0 0c-2 -1 -3 -5 -2 -6c36 -47 0 -87 0 -87c-1 -2 0 -5 2 -6c2 -1 9 -2 11 1l0 0z" /> \
  <g id="scp-bottom-def"> \
    <rect x="0" y="134" width="808" stroke="#C0BFBF" stroke-width="1" height="1" fill="none"/> \
    <path d="M807,186c0,6-5,11-11,11H12C6,196,1,192,1,187v-42 c0-6,0-11,0-11h807c0,0,0,5,0,11V186" fill="#F0EFEF"/> \
  </g> \
  <clipPath id="scp-outline-clip-def"> \
    <path id="scp-outline-def" d="M808 187c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V187" stroke="#989898" stroke-width="1.5"/> \
  </clipPath> \
  <path id="scp-rating-star-def" d="M30 45L48 54L44 35L59 21L39 18L30 0L21 18L1 21L16 35L12 54L30 45"/> \
  <filter id="scp-shadowblur"> \
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" /> \
  </filter> \
</defs> \
<g id="scp-main" aria-label="sitecues main panel">\
  <use id="scp-shadow" xlink:href="#scp-outline-def" x="5" y="5" class="scp-large-only" fill="rgba(0,0,0,.2)" opacity="0" filter="url(#scp-shadowblur)"/>\
  <use id="scp-main-outline" xlink:href="#scp-outline-def" class="scp-large-only" opacity="0" fill="white"/>\
  <use id="scp-small-A" xlink:href="#scp-small-A-def" y="48" role="button" aria-label="Decrease zoom" class="scp-A-button scp-target"/>\
  <g id="scp-zoom-slider-bar" role="slider" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1" aria-labelledby="scp-zoom-label" data-thumb-mover="scp-zoom-slider-thumb" class="scp-target">\
    <use xlink:href="#scp-zoom-slider-bar-def" x="80" y="60"/>\
    <rect id="scp-zoom-slider-target" opacity="0" x="80" y="44" width="280" height="67"/>\
  </g>\
  <use id="scp-zoom-slider-thumb" class="scp-target" xlink:href="#scp-zoom-slider-thumb-def" role="presentation" y="48" x="60"/>\
  <use id="scp-large-A" xlink:href="#scp-large-A-def" x="380" y="21" role="button" aria-label="Increase zoom" class="scp-A-button scp-target"/>\
  <line id="scp-vert-divider" class="scp-large-only" opacity="0" stroke="#8C8C8C" stroke-width="2" x1="500" y1="31" x2="500" y2="99" />\
  <g id="scp-speech" role="checkbox" aria-checked="false" aria-label="Speech"> <!-- ARIA Toggle button not working well with NVDA screen reader -->\
    <use id="scp-head" xlink:href="#scp-head-def" x="530" y="11"/>\
    <use id="scp-wave1" xlink:href="#scp-wave1-def" class="scp-wave" x="530" y="11"/>\
    <use id="scp-wave2" xlink:href="#scp-wave2-def" class="scp-wave" x="530" y="11"/>\
    <use id="scp-wave3" xlink:href="#scp-wave3-def" class="scp-wave" y="11" x="530"/>\
    <rect id="scp-speech-target" opacity="0" x="530" y="5" width="193" height="115" class="scp-target"/>\
  </g>\
  <g id="scp-bottom" class="scp-large-only" opacity="0">\
    <use xlink:href="#scp-bottom-def"/>\
    <text id="scp-zoom-label" class="scp-large-only" opacity="0" x="25" y="178">{{zoom}}<tspan id="scp-zoom-value">{{zoomvalue}}</tspan></text>\
    <text id="scp-speech-label" class="scp-large-only" opacity="0" x="583" y="178">{{speech}}<tspan id="scp-speech-state">{{speechstate}}</tspan></text>\
    <rect opacity="0" x="0" y="195" width="808" height="64"/>\
  </g>\
</g>\
<use id="scp-outline" xlink:href="#scp-outline-def" class="scp-large-only" fill="none" opacity="0"/>\
<rect id="scp-mouseover-target" x="0" y="0" width="700" height="160" opacity="0"/>\
</svg>\
<div id="scp-focus-outline" role="presentation" />\
';

  // Done.
  callback();

});