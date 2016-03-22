// todo:
// 1. move this code to .svg file so it's easier to edit
/*
The purpose of some elements:
- #scp-zoom-slider-target used for slider size manipulation while dragging the slider thumb or other actions
- #scpspeechtarget adds animation styles for speech icon waves
-
 */
define(['core/bp/view/markup-finalizer', 'core/bp/view/styles'], function(finalizer, styles) {
  /*jshint multistr: true */

  var svg = '\
<sc id="scp-focus-outline" role="presentation"></sc>\
<sc id="scp-shadow-container" role="presentation" style="position:absolute;width:513px;height:630px;overflow:hidden">\
  <sc id="scp-shadow"></sc>\
</sc>\
\
<svg id="scp-svg" role="group" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 810 300" preserveAspectRatio="xMinYMin" data-sc-reversible="false" data-metric="panel">\
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
  <path id="scp-zoom-slider-thumb-def" d="m11,64l-10,-15v-41c0,-2 3,-7 5,-7h15c1,0 5,3 5,7v41l-10,15c0,0 -2.5,2 -5,0"/>\
  <path id="scp-head-def" d="m76 45c0 1 2 4 -2 5c-1 0 -2 .5 -4 .5c-1 0 -2 1 -1 2c0 1 0 2 -2 3c1 0 2 0 2 1c0 1 -1 1 -1 3c0 1 3 5 2 8c0 3 -10 2 -20 2c0 0 -3 11 10 13c7 1 14 7 14 16h-74c0 -5 0 -12 8 -14c0 0 14 -5 14 -14c1 -13 -9 -17 -11 -27c-5 -21 6 -39 29 -39c8 0 13 2 15 4c10 5 12 16 12 22c0 3 -2 6 .5 8c8 6 8 6 9 7z"/>\
  <path id="scp-wave1-def" d="m105 26c0 0 26 25 1 52c-3 3 -9 2 -11 1c-2 -1 -4 -4 -2 -6c0 0 17 -18 0 -41c-1 -2 0 -5 2 -6c2 -1 8 -2 11 1z"/>\
  <path id="scp-wave2-def" d="m134 14c37 41 0 74 0 74c-3 3 -9 2 -11 1c-2 -1 -4 -4 -2 -6c27 -35 0 -64 0 -64l0 0c-1 -2 0 -5 2 -6c2 -1 9 -1 11 1z"/>\
  <path id="scp-wave3-def" d="m167 2c0 0 48 47 0 97c-3 3 -9 2 -11 1c-2 -1 -3 -5 -2 -6c36 -47 0 -87 0 -87c-1 -2 0 -5 2 -6c2 -1 9 -2 11 1z"/>\
  <g id="scp-bottom-def">\
    <rect x="0" y="134" width="808" stroke="#C0BFBF" stroke-width="1" height="1" fill="none"/>\
    <path transform="translate(0,1)" d="M806,186c0,6-5,11-11,11H12C6,196,1,192,1,187v-42 c0-6,0-11,0-11h806c0,0,0,5,0,11V186" fill="#EEE"/>\
  </g>\
  <path id="scp-outline-def" d="M 808 187c0 6-5 11-11 11H11.5 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V187" stroke="#999" stroke-width="1.5"/>\
  <g id="scp-rating-star-def">\
    <path d="M30 45L48 54L44 35L59 21L39 18L30 0L21 18L1 21L16 35L12 54L30 45"/>\
    <rect class="scp-hidden-target scp-hand-cursor" width="66" height="62"/>\
  </g>\
  <filter id="scp-focusblur">\
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/>\
  </filter>\
  <path id="scp-arrow" d="m18,-1.9c-1.3,1.4 -15.6,15 -15.6,15c-.7,.7 -1.7,1.2 -2.7,1.2c-1,0 -1.89999,-.4 -2.7,-1.2c0,0 -14.2,-13.6 -15.6,-15c-1.3,-1.4 -1.4,-3.9 0,-5.3c1.4,-1.5 3.5,-1.6 5.2,0l13,12.5l13,-12.5c1.8,-1.6 3.8,-1.5 5.2,0c1.3,1.8 1.3,4 0,5.3l.2,0z"/>\
</defs>\
<rect id="scp-badge-bg" fill="white" stroke-width="0" x="0" y="0" width="630" height="124" opacity="0"/>\
<rect id="scp-badge-focus-rect" fill="transparent" stroke-width="0" x="10" y="10" width="620" height="114" rx="15" ry="15" filter="url(#scp-focusblur)"/>\
<g id="scp-main" aria-label="{{sitecues_main_panel}}">\
  <rect id="scp-main-content-fill" role="presentation" fill="white" stroke-width="0" x="1" y="1" width="806" height="134" class="scp-panel-only" opacity="0"/>\
  <use id="scp-small-A" xlink:href="#scp-small-A-def" y="48" role="button" aria-label="{{zoom_out}}" class="scp-A-button"/>\
  <g id="scp-zoom-slider-bar" role="slider" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1" aria-labelledby="scp-zoom-label" data-thumb-mover="scp-zoom-slider-thumb">\
    <use xlink:href="#scp-zoom-slider-bar-def" x="80" y="60"/>\
    <rect id="scp-zoom-slider-target" role="presentation" class="scp-hidden-target scp-hand-cursor" x="80" y="44" width="280" height="67"/>\
  </g>\
  <use id="scp-zoom-slider-thumb" class="scp-hand-cursor" xlink:href="#scp-zoom-slider-thumb-def" role="presentation" aria-controls="scp-zoom-slider-bar" y="48" x="60"/>\
  <use id="scp-large-A" xlink:href="#scp-large-A-def" x="380" y="21" role="button" aria-label="{{zoom_in}}" class="scp-A-button"/>\
  <line id="scp-vert-divider" class="scp-panel-only" opacity="0" stroke="#888" stroke-width="2" x1="500" y1="31" x2="500" y2="99"/>\
  <g id="scp-speech" role="checkbox" aria-checked="false" aria-label="{{speech}}"> <!-- ARIA Toggle button not working well with NVDA screen reader -->\
    <use id="scp-head" role="presentation" xlink:href="#scp-head-def" x="530" y="11"/>\
    <use id="scp-wave1" role="presentation" xlink:href="#scp-wave1-def" class="scp-wave" x="530" y="11"/>\
    <use id="scp-wave2" role="presentation" xlink:href="#scp-wave2-def" class="scp-wave" x="530" y="11"/>\
    <use id="scp-wave3" role="presentation" xlink:href="#scp-wave3-def" class="scp-wave" y="11" x="530"/>\
    <rect id="scp-speech-target" role="presentation" x="530" y="5" width="193" height="115" class="scp-hidden-target scp-hand-cursor"/>\
  </g>\
  <g id="scp-bottom" class="scp-panel-only" opacity="0">\
    <use id="scp-bottom-mousetarget" role="presentation" xlink:href="#scp-bottom-def"/>\
    <g id="scp-bottom-text" role="presentation" opacity="0">\
      <text id="scp-zoom-label" x="25" y="178"><tspan id="scp-zoom-value" role="presentation">{{zoom_off}}</tspan></text>\
      <text id="scp-speech-label" x="581" y="178" data-x-start="581" data-x-end="795">\
        {{speech}} {{off}}\
      </text>\
    </g>\
    <rect opacity="0" x="0" y="195" width="808" height="64"/>\
  </g>\
</g>\
<g id="scp-secondary-anchor" role="presentation" />\
<use id="scp-main-outline" role="presentation" xlink:href="#scp-outline-def" class="scp-panel-only" fill="none" opacity="0"/>\
<g id="scp-more-button-opacity" role="presentation" transform="translate(400,198)">\
  <g id="scp-more-button-container" role="presentation">\
    <g id="scp-more-button-group" data-hover="scale(1.2)" class="scp-hand-cursor" role="button" aria-label="{{more_features}}">\
      <circle fill="#FFF" stroke="#777" stroke-width="5" stroke-miterlimit="10" cx="0" cy="0" r="34"/>\
      <use id="scp-more-arrow" role="presentation" fill="#777" xlink:href="#scp-arrow"/>\
      <path id="scp-question" role="presentation" fill="#777" stroke="#777" stroke-width="2" d="M0,-16c-3.4 0-6 1-7.5 2.6-1.6 1.6-2.2 3.6-2.4 5.1l4 .5c.2-1 .5-2 1.2-2.8 .8-.8 2-1.5 4.6-1.5 2.6 0 4.1 .5 4 1.4 .8 .7 1.1 1.6 1.1 2.6 0 3.3-1.4 4.2-3.4 6-2 1.8-4.6 4.3-4.6 9v1h4v-1c0-3.3 1.2-4.2 3.2-6 2-1.8 4.8-4.3 4.8-9 0-2-.7-4.1-2.4-5.6-1.7-1.6-4.3-2.4-7.6-2.4zm-2.8 28v4h4v-4h-4z"></path>\
      <circle cx="0" cy="0" r="36" class="scp-hidden-target"/>\
    </g>\
  </g>\
</g>\
<rect id="scp-mouseover-target" role="presentation" x="0" y="0" width="700" height="160" opacity="0"/>\
</svg>\
\
<sc id="scp-html-secondary-anchor" role="presentation" style="display:none"></sc>'; // Hack to make sure innerHTML doesn't remove any important last element

  return function() {
    styles.init();
    return finalizer(svg);
  };
});
