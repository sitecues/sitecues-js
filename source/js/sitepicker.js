sitecues.def( 'sitepicker', function (fallback, callback, log) {
  
  'use strict';

  sitecues.use('jquery',  function ($) {


			sitecues.toggleSitepickerCustomizations = function (customSiteCode, bool) {
			    
			    var _site = customSiteCode;
				var _enabled = bool;
					window.sitecues.getLibraryConfig().sitepickermods._site = _enabled;

				   return _enabled;
				};

	});
	callback();
});