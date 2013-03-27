eqnx.def('load', function(load, callback){

    // async script loading
	load.script = eqnx.loadScript;

	// async stylesheet loading
	load.style = function(url, callback){
        // Resolve the URL as relative to the library URL.
        url = eqnx.resolveEqnxUrl(url);

		// private variables
		var pull, style, counter = 0;

		// create link DOM element
		style = document.createElement('link');

		// set attributes
		style.rel = 'stylesheet';
		style.href = url;
		style.charset = 'utf-8';

		// add element to head to start loading
		document.getElementsByTagName('head')[0].appendChild(style);

		// prepare pull function
		pull = function(){
			// iterate over loaded document stylesheets and
			// check is our stylecheet loaded or not
			for(var s=document.styleSheets, i=s.length; --i >= 0;)
				if (s[i].href === style.href) return callback();

			// initiate pulling for this check -- pull for
			// changes max 100 times with 100ms delay, if
			// pulling ended, assume that stylesheet was loaded
			++counter < 100
				? setTimeout(pull, 100)
				: 'function' === typeof callback && callback();
		}

		// if we have stylesheets list for document
		// use pulling to detect when style will be
		// loaded
		if ('styleSheets' in document) pull();

		// try to use onload+onerror handlers
		else style.onload = style.onerror = callback;
	};

	// end
	callback();
});