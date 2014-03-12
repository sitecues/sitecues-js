//badge.js depends on this module to load first!
sitecues.def('ui', function (ui, callback, log) {

  'use strict';
  // this module should be used by all modules
  // which are injecting elements on the page
  // or ui elements. this way we can postpone
  // actual initializing of user interface until
  // important resources will be loaded for example

  // require load module for async style loading
  //sitecues.use('load', function(load){

    // load default style, and only after it
    // is loaded module is ready
    //load.style('../css/sitecues-default.css', callback);
  ui.CONSTANTS = {
    'SITECUES_CSS_ID'      : 'sitecues-default',
    'SITECUES_CSS_DEFAULT' : 
      '@media print {#sitecues-BWCG{display:none!important;}#sitecues-panel{display:none!important;}#sitecues-badge{display:none!important;}}\n' +
      '.sitecues-badge {z-index: 2147483645;margin: 0px;visibility: visible;position: fixed;width: 150px;top: 5px;color: rgba(0, 0, 0, 0.6);-webkit-transition: color 1s;-webkit-box-sizing: content-box; /* Safari/Chrome, other WebKit */-moz-box-sizing: content-box;/* Firefox, other Gecko */box-sizing: content-box;/* Opera/IE 8+ */}\n' +
      '.sitecues-badge #sitecues-badge-image {height: 23px;}\n' +
      '#sitecues-badge, #sitecues-badge-image {-webkit-box-sizing: content-box; /* Safari/Chrome, other WebKit */-moz-box-sizing: content-box;/* Firefox, other Gecko */box-sizing: content-box;/* Opera/IE 8+ */}\n' +
      '.sitecues-badge:hover {color: rgba(0, 0, 0, 1);-webkit-transition: color 1s;}\n' +
      '#sitecues-badge-image {width: 134px;border: 2px solid #A3A3A3;padding: 4px;background-color: white;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;-webkit-box-shadow:  1px 1px 5px 0px rgba(10, 10, 10, .5);box-shadow:  1px 1px 5px 0px rgba(10, 10, 10, .5);-moz-box-shadow: 1px 1px 5px 0px rgba(10, 10, 10, .5);}\n' +
      '#sitecues-panel {opacity: 0.25;z-index: 2147483646;position: fixed;top: 0px;right: 15px;/*border: 1px solid #aaa;*/white-space: nowrap;margin: 5px;width: 500px;height: 80px;background-color: #fff;border-radius: 5px;-moz-box-shadow: 2px 2px 10px 2px rgba(119, 119, 119, 0.75);-webkit-box-shadow: 2px 2px 10px 2px rgba(119, 119, 119, 0.75);box-shadow: 2px 2px 10px 2px rgba(119, 119, 119, 0.75);/*background-clip: content-box;*/user-select: none;border:2px solid red;}\n' +
      '#sitecues-panel input[type="range"] {position:absolute;-webkit-appearance: none;left: 5px;height: 0px;width: 198px;top: 26px;}\n' +
      '#sitecues-panel input[type="range"]::-webkit-slider-thumb {-webkit-appearance: none;background-color: none;background-image: url('+sitecues.resolveSitecuesUrl('../images/panel/slider_marker.png')+');width: 19px;height: 44px;border-radius: 4px;border: none;/*-webkit-box-shadow: 0 0 4px #555;*/z-index: 1;}\n' +
      '#sitecues-panel .slider-wrap {display:block;width:340px;height:80px;-webkit-user-select : none;-khtml-user-select  : none;-moz-user-select    : none;-o-user-select      : none;user-select         : none;}\n' +
      '#sitecues-panel .slider-wrap *{-webkit-user-select: none;-khtml-user-select  : none;-moz-user-select    : none;-o-user-select      : none;user-select        : none;}\n' +
      '#sitecues-panel .small {position: absolute;left: 3px;top: 23px;font-family: Verdana, "Bitstream Vera Sans", "DejaVu Sans", Tahoma, Geneva, Arial, Sans-serif;font-weight: bolder;font-size: 36pt;}\n' +
      '#sitecues-panel .big {position: absolute;left: 270px;top: -10px;font-family: Verdana, "Bitstream Vera Sans", "DejaVu Sans", Tahoma, Geneva, Arial, Sans-serif;font-weight: bolder;font-size: 60pt;}\n' +
      '#sitecues-panel .tts {position: absolute;top: 0;right: 0;width: 136px;height: 76px;background-image: url('+sitecues.resolveSitecuesUrl('../images/tts-icon-1.png')+');background-size: 270px;background-position: 0% 0%;}\n' +
      '#sitecues-panel .tts.tts-disabled {position: absolute;top: 0;right: 0;width: 136px;height: 76px;background-image: url('+sitecues.resolveSitecuesUrl('../images/tts-icon-1.png')+');background-size: 270px;background-position: -135px 0%;}\n' +
      '#sitecues-cursor {top: 0;left: 0;position: fixed !important;display: none;pointer-events: none;height: 15px;z-index: 2147483647;}\n' +
      '.sitecues-eq360-focus {position: absolute !important;pointer-events: none !important;z-index: 2147483645 !important;  /* below the Equinox cursor and panel */}\n' +
      '#sitecues-caret {position: absolute;border: 0px solid transparent;z-index: 2147483647;background-color: red;opacity: 0.75;width: 2px;margin: 0;padding: 0;}\n' +
      '#sitecues-eq360-bg {display: block;position: fixed;left: 0;top: 0;width: 100%;height: 100%;}\n' +
      '#sitecues-toolbar {background:     black;color:          ghostwhite;display:        none;height:         30px;left:           0;margin:         0;margin-bottom:  5px;position:fixed;top:            0;vertical-align: middle;width:          100%;z-index:        2147483647;}\n' +
      '.sitecues-toolbar,.sitecues-toolbar *{-moz-user-select:    none !important;-ms-user-select:     none !important;-o-user-select:      none !important;-webkit-user-select: none !important;user-select:         none !important;}\n' +
      '#sitecues-toolbar-close-button {height: 20px;margin: 5px;width:  20px;}\n' +
      '#sitecues-close-button {position: absolute;height: 36px;width:  36px;border: 0;border-radius: 15px;background-image: url('+sitecues.resolveSitecuesUrl('../images/hlb_close_button.png')+');background-size: 36px 36px;z-index: 2147483647; /* above all */}\n' +
      '.sitecues-highlight-outline {position: absolute !important;pointer-events: none;}\n' +
      '.sitecues-iframe-modal {border:  2px solid #000;border-radius: 3px;background-color: #FFF;margin:  0;padding: 0;overflow-x: hidden;overflow-y: scroll;position: absolute;z-index: 2147483644; /* Below the close button */}\n' +
      '.sitecues-iframe-dimmer {border: 0;background-color: #000;opacity: 0.65;margin:  0;padding: 0;overflow-x: hidden;overflow-y: hidden;position: absolute;z-index: 2147483643; /* behind the toolbar */}\n'
  };

  var sheet       = document.createElement('style');
  sheet.innerHTML = ui.CONSTANTS.SITECUES_CSS_DEFAULT;
  sheet.id        = ui.CONSTANTS.SITECUES_CSS_ID;

  document.head.appendChild(sheet);

  callback();

  //});
});
