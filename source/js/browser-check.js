sitecues.def('browser/check', function (browser, callback, log) {

	/* Currently _os is a boolean that determines whether the OS is a version of Windows or not. */
	var _os = false,
		_browser = null,
		_browserArr = new Array(),
		_reqFallback = false;
	
	sitecues.use('jquery', 'conf', function ($, conf) {

		var IE6 = (navigator.userAgent.indexOf("MSIE 6")>=0) ? true : false;
		var IE7 = (navigator.userAgent.indexOf("MSIE 7")>=0) ? true : false;
		var IE8 = (navigator.userAgent.indexOf("MSIE 8")>=0) ? true : false;
		var IE9 = (navigator.userAgent.indexOf("MSIE 9")>=0) ? true : false;
		var IE10 = (navigator.userAgent.indexOf("MSIE 10")>=0) ? true : false;
		var IE11 = (navigator.userAgent.indexOf("MSIE 11")>=0) ? true : false;
		var MOZ = (navigator.userAgent.indexOf("Gecko/201")>=0) ? true : false;
		var OPERA = (navigator.userAgent.indexOf("Opera")>=0) ? true : false;
		var SAF = (navigator.userAgent.indexOf("AppleWebKit")>=0) ? true : false;
		var CHROME = (navigator.userAgent.indexOf("Chrome/")>=0) ? true : false;

		var _windows = (navigator.appVersion.indexOf("Win")!=-1) ? true : false


			_browserArr = [
						{ "_name" : "IE6", "_val" : IE6 },
						{ "_name" : "IE7", "_val" : IE7 },
						{ "_name" : "IE8", "_val" : IE8 },
						{ "_name" : "IE9", "_val" : IE9 },
						{ "_name" : "IE10", "_val" : IE10 },
						{ "_name" : "IE11", "_val" : IE11 },
						{ "_name" : "Firefox" , "_val" : MOZ },
						{ "_name" : "Opera" , "_val" : OPERA },
						{ "_name" : "Safari" , "_val" : SAF },
						{ "_name" : "Chrome" , "_val" : CHROME }
						];

			$.each(_browserArr, function(ind, val){

				var _currIndex = ind;

				switch( _browserArr[_currIndex]._val ){
					case true:
						_browser = _browserArr[_currIndex]._name;
						break;
					case false:
						// If this returns 'false', the browser failed the compatibility check. 
						break;
					}
			});

			/* 	I know that this particular [if/else] can be handled by a [if(!CHROME)] but I thought
				this method may be easier to manage as we rollout future versions of the product to other browsers. */
			if(CHROME){
				_reqFallback = false;
			}else if( IE6 || IE7 || IE8 || IE9 || IE10 || IE11 || MOZ || OPERA || SAF ){
				_reqFallback = true;
			}

		browser._os = _windows;
		browser._browser = _browser;
		browser._browserArr = _browserArr;
		browser._reqFallback = _reqFallback;

	});
callback();
});	
