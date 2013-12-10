sitecues.def( 'sitepicker', function (sitepicker, callback, log) {
  
  'use strict';

  sitecues.use('jquery', 'mouse-highlight/picker', function ($, mhpicker) {

		sitecues.toggleSitepickerCustomizations = function (customSiteCode, bool) {
		    
	    var _site = customSiteCode;
			var _enabled = bool;
			window.sitecues.getLibraryConfig().sitepickermods._site = _enabled;

		  return _enabled;
		};

	});
	callback();
});