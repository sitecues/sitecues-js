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
  /*jshint multistr: true */

  'use strict';

  var svg = '\
<sc id="scp-focus-outline" role="presentation"></sc>\
<sc id="scp-tips" class="scp-if-tips scp-cards scp-transition-opacity scp-wait-expand">\
  <sc class="scp-card scp-active">\
    <sc-h1>Welcome</sc-h1>\
    <sc-p>sitecues zoom and speech tools let you see this page better, and even listen to it read aloud.</sc-p>\
    <sc-p>Use the arrow buttons at the top right of this panel to read more tips.</sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Zoom the web page</sc-h1>\
    <sc-p>To zoom the entire page, press <kbd>+</kbd> or <kbd>-</kbd> at any time, or use the zoom slider.</sc-p>\
    <sc-p>The more you zoom, the easier everything is to see &mdash; even the mouse.</sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Zoom in on a part</sc-h1>\
    <sc-p>You can zoom in even more on parts of this web page.</sc-p>\
    <sc-p>Just move your mouse to an area you\'re interested in, and press the spacebar.</sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Listen to it</sc-h1>\
    <sc-p>First &mdash; click the speech button on.</sc-p>\
    <sc-p>Next &mdash; move your mouse to to something and press the spacebar.</sc-p>\
    <sc-p>Now listen as it\'s read aloud.</sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Get more help</sc-h1>\
    <sc-p>Get started with sitecues in the</sc-p>\
    <sc-p><sc-button-big role="button">Quick Start Guide</sc-button-big></sc-p>\
  </sc>\
</sc>\
<sc id="scp-settings" class="scp-if-settings scp-cards scp-transition-opacity scp-wait-expand">\
  <sc class="scp-card scp-active">\
    <sc-h1>Settings</sc-h1>\
    <sc-p>Get more out of sitecues zoom and speech tools by adjusting the settings.</sc-p>\
    <sc-p>Use the arrow buttons at the top right of this panel to find all the provided settings.</sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Color themes</sc-h1>\
    <sc-p>\
      <sc-button role="button" name="scp-setting-theme" id="scp-setting-theme-none" data-setting-name="themeName" data-setting-value="none"> \
        Normal\
      </sc-button>\
    </sc-p>\
    <sc-p>\
      <sc-button role="button" name="scp-setting-theme" id="scp-setting-theme-relaxed" data-setting-name="themeName" data-setting-value="blueReduction">\
        Relaxed tones\
      </sc-button>\
    </sc-p>\
    <sc-p>\
      <sc-button role="button" name="scp-setting-theme" id="scp-setting-theme-contrast" data-setting-name="themeName" data-setting-value="increaseContrast">\
        Enhanced contrast\
      </sc-button>\
    </sc-p>\
    <sc-p>\
      <sc-button role="button" name="scp-setting-theme" id="scp-setting-theme-night" data-setting-name="themeName" data-setting-value="darkOriginal">\
        Nighttime\
      </sc-button>\
    </sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Choose a voice</sc-h1>\
    <sc-p>Who should read your text aloud?</sc-p>\
    <sc-p><button>Sarah</button><button>Rebecca</button><button>Henry</button></sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Voice speed</sc-h1>\
    <sc-p>How fast should sitecues read?</sc-p>\
    <sc-p><span role="button" class="scp-range-label">Slower</span><input type="range" aria-label="Speech rate"/><span role="button" class="scp-range-label">Faster</span></sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Lens Size</sc-h1>\
    <sc-p>How much extra should the spacebar zoom content?</sc-p>\
    <sc-p><button>None</button><button>Small</button><button>Medium</button><button>Large</button></sc-p>\
  </sc>\
  <sc class="scp-card">\
    <sc-h1>Colors</sc-h1>\
    <sc-p>TBD Nothing to see here, move along, la la la. All work and no play makes Aaron a dull boy. This is a joke, I promise.</sc-p>\
  </sc>\
</sc>\
<sc class="scp-about-teaser scp-if-about scp-transition-opacity scp-wait-expand">\
  <sc-button-big role="button" class="scp-hand-cursor scp-hover-expand" id="scp-button-get-sitecues">Get sitecues now!</sc-button-big>\
</sc>\
\
<svg role="group" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1050 300" id="scp-svg" data-sc-reversible="false">\
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
    <path id="scp-outline-def" d="M808 187c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V 187" stroke="#999" stroke-width="1.5"/>\
  </clipPath>\
  <path id="scp-rating-star-def" d="M30 45L48 54L44 35L59 21L39 18L30 0L21 18L1 21L16 35L12 54L30 45"/>\
  <filter id="scp-shadowblur">\
    <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>\
  </filter>\
</defs>\
<rect id="scp-opaque-badge-bg" fill="white" stroke-width="0" x="0" y="0" width="630" height="124" opacity="0"/>\
<g id="scp-main" aria-label="sitecues main panel">\
  <path id="scp-shadow" d="m808,188c0,6 -5,11 -11,11H11m797,-11v-188" stroke="#000" stroke-width="2" filter="url(#scp-shadowblur)" fill="none"/>\
  <rect id="scp-main-content-fill" fill="white" stroke-width="0" x="1" y="1" width="806" height="134" class="scp-panel-only" opacity="0"/>\
  <use id="scp-main-outline" xlink:href="#scp-outline-def" class="scp-panel-only" opacity="0" fill="none"/>\
  <use id="scp-small-A" xlink:href="#scp-small-A-def" y="48" role="button" aria-label="Decrease zoom" class="scp-A-button"/>\
  <g id="scp-zoom-slider-bar" role="slider" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1" aria-labelledby="scp-zoom-label" data-thumb-mover="scp-zoom-slider-thumb">\
    <use xlink:href="#scp-zoom-slider-bar-def" x="80" y="60"/>\
    <rect id="scp-zoom-slider-target" class="scp-hidden-target" x="80" y="44" width="280" height="67"/>\
  </g>\
  <use id="scp-zoom-slider-thumb" class="scp-hand-cursor" xlink:href="#scp-zoom-slider-thumb-def" role="presentation" y="48" x="60"/>\
  <use id="scp-large-A" xlink:href="#scp-large-A-def" x="380" y="21" role="button" aria-label="Increase zoom" class="scp-A-button"/>\
  <line id="scp-vert-divider" class="scp-panel-only" opacity="0" stroke="#888" stroke-width="2" x1="500" y1="31" x2="500" y2="99"/>\
  <g id="scp-speech" role="checkbox" aria-checked="false" aria-label="Speech"> <!-- ARIA Toggle button not working well with NVDA screen reader -->\
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
<g id="scp-more" class="scp-more-only" aria-label="More features" opacity="0" clip-path="url(#scp-outline-clip-def)">\
  <use id="scp-more-outline" xlink:href="#scp-outline-def" fill="white"/>\
  <g id="scp-bottom-more">\
    <use xlink:href="#scp-bottom-def"/>\
    <text class="scp-hand-cursor" id="scp-tips-label" role="link" data-feature="tips" x="45" y="178">Tips</text>\
    <text class="scp-hand-cursor" id="scp-settings-label" role="link" data-feature="settings" x="240" y="178">Adjust</text>\
    <text class="scp-hand-cursor" id="scp-feedback-label" role="link" data-feature="feedback" x="468" y="178">Rate us</text>\
    <text class="scp-hand-cursor" id="scp-about-label" role="link" data-feature="about" x="685" y="178">About</text>\
  </g>\
  <g>\
    <g id="scp-arrows" class="scp-transition-opacity scp-wait-expand scp-if-settings scp-if-tips">\
      <text id="scp-prev-card" class="scp-hand-cursor scp-hover-expand" role="button" aria-label="Previous" x="655" y="74" aria-disabled="true">\
         &#9668;\
      </text>\
      <text id="scp-next-card" class="scp-hand-cursor scp-hover-expand" role="button" aria-label="Next" x="735" y="74">\
         &#9658;\
      </text>\
    </g>\
    <g id="scp-feedback" class="scp-if-feedback scp-transition-opacity scp-wait-expand">\
      <rect x="45" y="35" width="715" height="200" stroke-width="3" stroke="#aaaaaa" fill="none" rx="20" ry="20"/>\
      <g class="scp-hand-cursor" id="rating" aria-valuemin="1" aria-valuemax="5" role="slider" fill="#bbbbbb">\
        <use xlink:href="#scp-rating-star-def" x="42" y="254" role="button" aria-label="1 star rating"/>\
        <use xlink:href="#scp-rating-star-def" x="104" y="254" role="button" aria-label="2 star rating"/>\
        <use xlink:href="#scp-rating-star-def" x="166" y="254" role="button" aria-label="3 star rating"/>\
        <use xlink:href="#scp-rating-star-def" x="228" y="254" role="button" aria-label="4 star rating"/>\
        <use xlink:href="#scp-rating-star-def" x="290" y="254" role="button" aria-label="5 star rating"/>\
      </g>\
      <g id="scp-feedback-send-button" class="scp-hand-cursor" role="button">\
        <rect x="615" width="150" y="260" height="50" fill="#6B9AE0" rx="20" ry="20"/>\
        <text x="654" y="295" font-family="Arial" fill="white">Send</text>\
      </g>\
    </g>\
    <g id="scp-about" class="scp-if-about">\
      <image id="scp-logo-text" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/images/sitecues-logo-text.png" x="805" y="26" width="330" height="110"></image>\
    </g>\
  </g>\
  <g id="scp-button-menu" transform="translate(52,66)">\
    <g id="scp-tips-button" class="scp-if-tips scp-hand-cursor scp-transition-opacity" role="button" data-feature="tips" aria-labelledby="scp-tips-label">\
      <g class="scp-hover-expand">\
        <circle r="52" fill="#548ECE"/>\
        <path fill="#fff" d="m14,23.5c0,1.2 -1,2.2 -2.2,2.2h-22.2c-1.2,0 -2.2,-1 -2.2,-2.2c0,-1.2 1,-2.2 2.2,-2.2h22.2c1.2,0 2.2,1 2.2,2.2zm0,6.5c0,1.2 -1,2.2 -2.2,2.2h-22.2c-1.2,0 -2.2,-1 -2.2,-2.2c0,-1.2 1,-2.2 2.2,-2.2h22.2c1.2,0 2.2,1 2.2,2.2zm-27,4.5h23c0,2.5 -2,4.5 -4.5,4.5h-8.9c-2.5,0 -4.5,-2 -4.5,-4.5l0,0l0,0l.1,0l-5.2,0z"/>\
        <path fill="#FFF" stroke="#FFF" stroke-width="3.3" stroke-miterlimit="10" d="m.9,-34.3c12.3,0 22.2,10 22.2,22.2c0,12.1 -7.3,13.5 -8.7,26.7c0,1.2 -1,2.2 -2.2,2.2h-11.4m.1,0h-.1h-11.3c-1.2,0 -2.2,-1 -2.2,-2.2c-1.4,-13.2 -8.7,-14.6 -8.7,-26.7c0,-12.3 10,-22.2 22.2,-22.2"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
    <g id="scp-settings-button" class="scp-if-settings scp-hand-cursor scp-transition-opacity" role="button" data-feature="settings" aria-labelledby="scp-settings-label">\
      <g class="scp-hover-expand">\
        <path d="m-36,47.8c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6.2c-1.3,0 -2.3,1 -2.3,2.3v91l0,-.2zm61.4,0c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6c-1.3,0 -2.3,1 -2.3,2.3v90.8l-.2,0zm-30.7,0c0,1.3 1,2.3 2.3,2.3h6.2c1.3,0 2.3,-1 2.3,-2.3v-90.8c0,-1.3 -1,-2.3 -2.3,-2.3h-6c-1.3,0 -2.3,1 -2.3,2.3v90.8l-.2,0z" fill="#7B7B7B"/>\
        <path d="m-19.7,4.5c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.3c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.3l0,0zm30.7,-28.5c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.2c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.40001l0,-.2zm31.5,46.4c0,1.3 -1,2.3 -2.3,2.3h-17.1c-1.3,0 -2.3,-1 -2.3,-2.3v-5.3c0,-1.3 1,-2.3 2.3,-2.3h17.1c1.3,0 2.3,1 2.3,2.3v5.3l0,0z" fill="#548ECE"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
    <g id="scp-feedback-button" class="scp-if-feedback scp-hand-cursor scp-transition-opacity" role="button" data-feature="feedback" aria-labelledby="scp-feedback-label">\
      <g class="scp-hover-expand">\
        <path d="m-10,40c3,1 7,1 11,1c27,0 49,-19 49,-43c0,-24 -22,-44 -49,-44c-27,0 -50,19 -50,43c0,12 6,23 15,31m24,11.5c-6,5 -19,9.4 -41,9m17.4,-20.3c-2.2,9.2 -7.6,14.8 -17,20.7" stroke-miterlimit="10" stroke-linecap="round" stroke-width="5.5" stroke="#548ECE" fill="#FFF"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
    <g id="scp-about-button" class="scp-if-about scp-hand-cursor scp-transition-opacity" role="button" data-feature="about" aria-labelledby="scp-about-label">\
      <g class="scp-hover-expand">\
        <path d="m15.8,-9.5h-11.2c-1,0 -3.4,3.9 -3.4,5.2l.1,15.3l-49.8,6.1h0c-1.6,-5 -2.5,-10.3 -2.5,-15.8c0,-27.9 22.6,-50.4 50.4,-50.4c21.2,0 39.4,13 46.8,31.7h0c5,11.2 0,22.2 -10.89999,24.1l-16.10001,2l0,-13.1c0,-1.2 -2.39999,-5.1 -3.39999,-5.1zm-7,47.3c1.6,1.89999 2.8,0 2.8,0l7.1,-11.10001c.2,-.3 .4,-.6 .4,-1v0v-4h26.4h0c-7.8,17.8 -25.5,30.3 -46.2,30.3c-20.7,0 -38.4,-12.4 -46.2,-30.3v0h48.1v4.3c0,.3 .2,.6 .4,.9l7.2,10.9z" fill="#000"/>\
        <rect fill="none" width="120" height="120" y="-60" x="-60" class="scp-hand-cursor"/>\
      </g>\
    </g>\
  </g>\
</g>\
<use id="scp-outline" xlink:href="#scp-outline-def" class="scp-panel-only" fill="none" opacity="0"/>\
<g id="scp-more-button-container" transform="translate(400,198)">\
  <g id="scp-more-button-group" class="scp-hover-expand scp-hand-cursor" role="button" aria-label="View more options">\
    <circle id="scp-more-button" fill="#FFF" stroke="#777" stroke-width="5" stroke-miterlimit="10" cx="0" cy="0" r="31"/>\
    <path id="scp-more-arrow" class="scp-hand-cursor" fill="#777" d="m18,-1.9c-1.3,1.4 -15.6,15 -15.6,15c-.7,.7 -1.7,1.2 -2.7,1.2c-1,0 -1.89999,-.4 -2.7,-1.2c0,0 -14.2,-13.6 -15.6,-15c-1.3,-1.4 -1.4,-3.9 0,-5.3c1.4,-1.5 3.5,-1.6 5.2,0l13,12.5l13,-12.5c1.8,-1.6 3.8,-1.5 5.2,0c1.3,1.8 1.3,4 0,5.3l.2,0z"/>\
   </g>\
</g>\
<rect id="scp-mouseover-target" x="0" y="0" width="700" height="160" opacity="0"/>\
<sc id="scp-feedback-textarea" class="scp-if-feedback">\
  <sc class="scp-feedback-content">\
     <textarea id="feedback-textarea-id" style="font-size: 22px; font-family: Arial; width: 430px; height: 142px; padding: 10px; border: 0 !important; outline: 0 !important; resize: none !important; background-color: transparent !important;" placeholder="Tell us something ...."></textarea>\
  </sc>\
</sc>\
</svg>';
  sitecues.use('locale', 'platform', function(locale, platform) {
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

  // Done.
  callback();

});
