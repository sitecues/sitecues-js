eqnx.def('load', function(load, callback){

	// async script loading
	load.script = function(url, callback){
		// create script DOM element
		var script = document.createElement('script');

		// set proper script type
		script.type = 'text/javascript';

		// set url
		script.src = url;

		// add callback to track when it will be loaded
		script.onload = script.onreadystatechange = callback;

		// add element to head to start loading
		document.getElementsByTagName('head')[0].appendChild(script);
	}

	// end
	callback()

})