/**
* Get the entire computed style for a given object. The computed style is the actual applied style
* the browser uses on the object, taking into account precedence of various style rules, including !important.
*/
sitecues.def('style', function(style, callback){

	style.getComputed = function getStyleObject(dom){
		var style;
		var returns = {}

		if (window.getComputedStyle){
			var camelize = function(a, b){
				return b.toUpperCase();
			}

			style = window.getComputedStyle(dom, null);
			for(var i = 0, l = style.length; i < l; i++){
				var prop = style[i];
				var camel = prop.replace(/\-([a-z])/g, camelize);
				var val = style.getPropertyValue(prop);
				returns[camel] = val;
			}

			return returns;
		}

		// Needed only for IE8
		if(style = dom.currentStyle){
			for(var prop in style){
				returns[prop] = style[prop];
			}

			return returns;
		}

		return {}
	}

	// done
	callback();

});