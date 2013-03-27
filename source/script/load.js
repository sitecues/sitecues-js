eqnx.def('load', function(load, callback){

    // Parse a URL query into key/value pairs.
    var parseUrlQuery = function(queryStr) {
        var query = {};
        query.raw = queryStr;
        query.parameters = {};

        // Parse the query into key/value pairs.
        var start = 0, end = 0;
        if (queryStr[start] == '?') {
            start++;
        }

        while (start < queryStr.length) {
            end = queryStr.indexOf('=', start);
            if (end < 0) {
                end = queryStr.length;
            }
            var key = decodeURIComponent(queryStr.substring(start, end));
            start = end + 1;

            var value = null;
            if (start <= queryStr.length) {
                end = queryStr.indexOf('&', start);
                if (end < 0) {
                    end = queryStr.length;
                }
                value = decodeURIComponent(queryStr.substring(start, end));
                start = end + 1;
            }
            query.parameters[key] = value;
        }
    };

    // Parse a URL into its components.
    var parseUrl = function(urlStr) {
        // Ran across this in a Google search... loved the simplicity of the solution.
        var url = {};
        var parser = document.createElement('a');
        parser.href = urlStr;

        // No one ever wants the hash on a full URL...
        if (parser.hash) {
            url.raw = parser.href.substring(parser.href.length - parser.hash.length);
        } else {
            url.raw = parser.href;
        }

        url.protocol = parser.protocol.substring(0, parser.protocol.length - 1);
        url.hostname = parser.hostname;
        url.host     = parser.host;

        if (parser.search) {
            url.query = parseUrlQuery(parser.search);
        } else {
            url.query = null;
        }

        // Extract the path and file portion of the pathname.
        var pathname = parser.pathname;
        var index = pathname.lastIndexOf('/') + 1;
        url.path = pathname.substring(0, index);
        url.file = pathname.substring(index);

        return url;
    };

    // Obtain all script tags, and search util we find our script.
    var scriptSrcUrl = null,
        scriptSrcRegExp = new RegExp('^[a-zA-Z]*:/{2,3}.*/(equinox|eqnx)\.js'),
        scriptTags = document.getElementsByTagName('script');

    for (var i = 0; i < scriptTags.length; i++) {
        var match = scriptTags[i].src.match(scriptSrcRegExp);
        if (match) {
            scriptSrcUrl = parseUrl(match[0]);
            break;
        }
    }

    // The regular expression for an absolute URL. There is a capturing group for the protocol-relative
    // portion of the URL.
    var ABSOLUTE_URL_REQEXP = /^[a-z]+:(\/\/.*)$/i;

    // Resolve a URL as relative to a base URL.
    var resolveUrl = function(urlStr, baseUrl) {
        var absRegExpResult =  ABSOLUTE_URL_REQEXP.exec(urlStr);
        if (absRegExpResult) {
            // We have an absolute URL, with protocol. That's a no-no, so, convert to a
            // protocol-relative URL.
            urlStr = absRegExpResult[1];
        } else if (urlStr.indexOf('//') === 0) {
            // Protocol-relative No need to modify the URL, as we will inherit the containing page's protocol.
        } else if (urlStr.indexOf('/') === 0) {
            // Host-relative URL.
            urlStr = '//' + baseUrl.host + urlStr;
        } else {
            // A directory-relative URL.
            urlStr = '//' + baseUrl.host + baseUrl.path + urlStr;
        }

        return urlStr;
    };

    // async script loading
	load.script = function(url, callback){
        // Resolve the URL as relative to the library URL.
        url = resolveUrl(url, scriptSrcUrl);

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
	};

	// async stylesheet loading
	load.style = function(url, callback){
        // Resolve the URL as relative to the library URL.
        url = resolveUrl(url, scriptSrcUrl);

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