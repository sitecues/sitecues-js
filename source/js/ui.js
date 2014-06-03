//badge.js depends on this module to load first!
sitecues.def('ui', function (ui, callback) {

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
      '@media print {#sitecues-panel{display:none!important;}#sitecues-badge{display:none!important;}}\n' +
      '.sitecues-badge {z-index: 2147483645;margin: 0px;visibility: visible;position: absolute;width: 150px;top: 5px;-webkit-box-sizing: content-box; /* Safari/Chrome, other WebKit */-moz-box-sizing: content-box;/* Firefox, other Gecko */box-sizing: content-box;/* Opera/IE 8+ */}\n' +
      '.sitecues-badge #sitecues-badge-image {height: 23px;}\n' +
      '#sitecues-badge, #sitecues-badge-image {-webkit-box-sizing: content-box; /* Safari/Chrome, other WebKit */-moz-box-sizing: content-box;/* Firefox, other Gecko */box-sizing: content-box;/* Opera/IE 8+ */}\n' +
      '#sitecues-badge-image {width: 134px;border: 2px solid #A3A3A3;padding: 4px;background-color: white;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;-webkit-box-shadow:  1px 1px 5px 0px rgba(10, 10, 10, .5);box-shadow:  1px 1px 5px 0px rgba(10, 10, 10, .5);-moz-box-shadow: 1px 1px 5px 0px rgba(10, 10, 10, .5);}\n' +
      '#sitecues-panel {opacity: 0.25;z-index: 2147483646;position: fixed;top: 0; white-space: nowrap;margin: 5px;background-color: #fff;border-radius: 5px;-moz-box-shadow: 2px 2px 10px 2px rgba(119, 119, 119, 0.75);-webkit-box-shadow: 2px 2px 10px 2px rgba(119, 119, 119, 0.75);box-shadow: 2px 2px 10px 2px rgba(119, 119, 119, 0.75);user-select: none;border:2px solid red;}\n' +
      '#sitecues-slider-wrap {display:block;width:340px;height:80px;}\n' +
      '#sitecues-tts {position: absolute;top: 0;right: 0;width: 136px;height: 76px;background-image: url('+sitecues.resolveSitecuesUrl('../images/tts-icon-1.png')+');background-size: 270px;background-position: 0% 0%;}\n' +
      '#sitecues-tts.tts-disabled {position: absolute;top: 0;right: 0;width: 136px;height: 76px;background-image: url('+sitecues.resolveSitecuesUrl('../images/tts-icon-1.png')+');background-size: 270px;background-position: -135px 0%;}\n' +
      '.sitecues-highlight-outline {position: absolute !important;pointer-events: none;}\n'
  };

  var sheet       = document.createElement('style');
  sheet.innerHTML = ui.CONSTANTS.SITECUES_CSS_DEFAULT;
  sheet.id        = ui.CONSTANTS.SITECUES_CSS_ID;

  document.head.appendChild(sheet);

  callback();
});
