sitecues.def('jquery', function (module, callback, log) {
	sitecues.use('load', function (load) {
		load.script('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js', function () {
      sitecues.$ = jQuery.noConflict(true);
			callback(sitecues.$);
		});
	});
});
