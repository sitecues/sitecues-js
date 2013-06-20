/**
* Get the entire computed style for a given object. The computed style is the actual applied style
* the browser uses on the object, taking into account precedence of various style rules, including !important.
*/
sitecues.def('style', function (style, callback, log){

	sitecues.use('jquery', function(_jQuery){

	style.getComputed = function getStyleObject(dom){
		var myDom = dom instanceof _jQuery ? dom.get(0) : dom;
		var returns = {}

		if (getComputedStyle){
			var camelize = function(a, b){
				return b.toUpperCase();
			}
		
			var computedStyle = getComputedStyle(myDom, "");

			if(computedStyle) {
				for(var i = 0, l = computedStyle.length; i < l; i++){
					var prop = computedStyle[i];
					var camel = prop.replace(/\-([a-z])/g, camelize);
					var val = computedStyle.getPropertyValue(prop);
					returns[camel] = val;
				}
			}
			return returns;
		}

		// Needed only for IE8
		if(myDom.currentStyle){
			for(var prop in style){
				returns[prop] = style[prop];
			}

			return returns;
		}

		return {}
	}

	// done
	callback();

});});
