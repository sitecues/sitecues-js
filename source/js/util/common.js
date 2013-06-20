/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.def('util/common', function (common, callback) {

   // Define dependency modules.
    sitecues.use('jquery', 'jquery/cookie', function ($) {
        var kRegExpRGBString = /\d+(\.\d+)?%?/g;
        var kRegExpHEXValidString = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
        var kUrlValidString = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

		// Make sure 'trim()' has cross-browser support.
		if (typeof String.prototype.trim !== 'function') {
		  String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		  }
		}
            /**
             * Get the element's styles to be used further.
             * @param element The DOM element which styles we want to get.
             * @return elementComputedStyles An object of all element computed styles.
             */
            common.getElementComputedStyles = function(element, prop, doTransform) {
                if(!element) {
                    return;
                }
				// By default, return entire CSS object.
                var currentProperty, propertyName, propertyParts = [], elementComputedStyles = {};
                var computedStyles = element.currentStyle || window.getComputedStyle(element, null);

				// If a specific property value is requested then skip the entire CSS object iteration.
				if (prop) {
					propertyParts = prop.split('-');
					// camelCase name: 'marginTop'
					if (propertyParts.length < 2) {
						return computedStyles[prop];
					}
					// dash-like name: 'margin-top'
					for (var i = 1; i < propertyParts.length; i++) {
                        propertyName += common.capitaliseFirstLetter(propertyParts[i]); // in format 'marginTop'
                    }
					return computedStyles[propertyName];
				}

                $.each(computedStyles, function (index) {
                    currentProperty = computedStyles[index]; // in format 'margin-top'
                    propertyParts = currentProperty.split('-');
                    propertyName = propertyParts[0];
                    for (var i = 1; i < propertyParts.length; i++) {
                        propertyName += common.capitaliseFirstLetter(propertyParts[i]); // in format 'marginTop'
                    }
                    if (doTransform) {
                        // in format 'marginTop'
                        elementComputedStyles[propertyName] = computedStyles[propertyName];
                    } else {
                        // in format 'margin-top'
                        elementComputedStyles[currentProperty] = computedStyles[propertyName];
                    } 
                    
                });
                return elementComputedStyles;
            }

            /**
             * Remove all the attributes from the DOM element given.
             */
            common.removeAttributes = function(element) {
                element.each(function () {
                    // Copy the attributes to remove:
                    // if we don't do this it causes problems iterating over the array we're removing elements from.
                    var attributes = $.map(this.attributes, function (item) {
                        return item.name;
                    });
                    // Now use jQuery to remove the attributes.
                    $.each(attributes, function (i, item) {
                        // Check is the attribute is a valid DOM attribute.
                        if (element.attr(item)) {
                            element.removeAttr(item);
                        }
                    });
                });
            }

            /**
             * Capitalizes the first letter of the string given as an argument.
             */
            common.capitaliseFirstLetter = function(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
			
			/**
             * Checks if the value given is empty or not.
             */
            common.isEmpty = function(val) {
                return !val || val.trim() === '';
            }

            /*
             * Converts both colors to the same [RGB] format and then find out if they are contrast.
             * @param colorOne String/CSSPrimitiveValue represents one of the colors to compare
             * @param colorTwo String/CSSPrimitiveValue represents the other color to compare
             * @return Boolean true if colors are contrast; false otherwise
             */
            common.getIsContrastColors = function(colorOne, colorTwo){
                var tones = [];
                for (var index in arguments) {
                    var colorValue = arguments[index];
                    var RGBColor = common.getRGBColor(colorValue);
                    // http://en.wikipedia.org/wiki/YIQ
                    var yiq = ((RGBColor.r*299)+(RGBColor.g*587)+(RGBColor.b*114))/1000;
                    tones[colorValue] = (yiq >= 128) ? 'dark' : 'light';

                }
                // Now that we have both colors tones, define if they are contrast or not.
                return (tones[colorOne] === tones[colorTwo]) ? false : true;
            }

            /*
             * Converts color given RGB format.
             * @param colorValue String/CSSPrimitiveValue
             * @return Object of RGB format {r: numericValue, g: numericValue, b: numericValue}
             */
            common.getRGBColor = function(colorValue) {
                // Sring
                if ( {}.toString.call( colorValue ) === '[object String]' ) {
                    return Rgb(colorValue);
                }
                // CSSPrimitiveValue
                var resultRGBColor = { r: 255, g: 255, b:255 };
                try {
                    var valueType = colorValue.primitiveType;
                    if (valueType == CSSPrimitiveValue.CSS_RGBCOLOR) {
                        var rgb = colorValue.getRGBColorValue();
                        resultRGBColor.r = rgb.red.getFloatValue (CSSPrimitiveValue.CSS_NUMBER);
                        resultRGBColor.g = rgb.green.getFloatValue (CSSPrimitiveValue.CSS_NUMBER);
                        resultRGBColor.b = rgb.blue.getFloatValue (CSSPrimitiveValue.CSS_NUMBER);

                    }
                } catch (e) {
                    // Just temporary logging, to make sure code always works as expected.
                    sitecues.log.warn('Attempt to get RGB color failed.');
                }
                return resultRGBColor;
            }
          
            /*
             * Calculates opposite color to the one given as parameter.
             * @param colorValue String/CSSPrimitiveValue
             * @return String that represents RGB value. Format : 'rgb(numericValueR, numericValueG, numericValueB)'
             */
            common.getRevertColor = function(colorValue) {
                var RGBColor = common.getRGBColor(colorValue);
                return 'rgb(' + (255 - RGBColor.r) + ', ' + (255 - RGBColor.g) + ', ' + (255 - RGBColor.b) + ')';
            }

			/*
			 * Using image object element it gets its average color by means of the canvas.
			 * @param imgEl An object.
			 * @return rgb A string which represents the average image color in RGB format.
			 */
			common.getAverageRGB = function(imgEl) {
				var blockSize = 5, // only visit every 5 pixels
				defaultRGB = {r:0, g:0, b:0}, // for non-supporting envs
				canvas = document.createElement('canvas'),
				context = canvas.getContext && canvas.getContext('2d'),
				data, width, height,
				i = -4,
				length,
				rgb = {r:0, g:0, b:0},
				count = 0;

				if (!context) {
					return defaultRGB;
				}

				height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
				width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

				context.drawImage(imgEl, 0, 0);

				try {
					data = context.getImageData(0, 0, width, height);
				} catch(e) {
					/* security error, img on diff domain */
                    // alert('x');
					return defaultRGB;
				}

				length = data.data.length;

				while ( (i += blockSize * 4) < length ) {
					++count;
					rgb.r += data.data[i];
					rgb.g += data.data[i+1];
					rgb.b += data.data[i+2];
				}

				// ~~ used to floor values
				rgb.r = ~~(rgb.r/count);
				rgb.g = ~~(rgb.g/count);
				rgb.b = ~~(rgb.b/count);

				return rgb;
			}

            /*
             * Returns an object of RGB components converted from a string containing either RGB or HEX string.
             */
            function Rgb(rgb){
                if(!(this instanceof Rgb)) return new Rgb(rgb);
                var defaultColor = [255, 255, 255];
                var c = rgb.match(kRegExpRGBString);
                // RGB
                if (c) {
                    c = c.map(function(itm){
                        // Take care of plain numbers as well as percentage values
                        if(itm.indexOf('%')!= -1) itm = parseFloat(itm)*2.55;
                        return parseInt(itm);
                    });
                } else if ((kRegExpHEXValidString).test(rgb)) {
                    // Valid HEX
                    c = [];
                    c[0] = hexToR(rgb);
                    c[1] = hexToG(rgb);
                    c[2] = hexToB(rgb);
                } else {
                    c = defaultColor;
                }
                this.r = c[0];
                this.g = c[1];
                this.b = c[2];
            }

            function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
            function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
            function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
            function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
			
			/*
             * Sets a cookie.  Basically just wraps the jQuery cookie plugin.
             * 
             * Note: This will always set a site-wide cookie ("path=/").
             * 
             * @param name  The name of the cookie (be brief!), required
             * @param value The value of the cookie (be brief!), required
             * @param days  The expiration of the cookie in days, optional
             *               if not set this will be a session cookie.
             */
            common.setCookie = function(name, value, days) {
                if(days) {
                    $.cookie(name, value, { expires: days, path: '/' });
                } else {
                    $.cookie(name, value, { path: '/' });
                }
            }

            /*
             * Retrieves the value of cookie. Basically just wraps the jQuery 
             * cookie plugin.
             */
            common.getCookie = function(name) {
                return $.cookie(name);
            }

            // Event handlers.

            /**
             * Prevents default event behavior.
             * @param e Event Object
             */
            common.preventDefault = function(e) {
                e = e || window.event; // cross-browser event
                if (e.preventDefault)
                    e.preventDefault();
                e.cancelBubble = true; // IE variant
                e.returnValue = false;
            }
            
            /**
             * Prevents default and stops propogation.
             * @param e Event Object
             */
            common.stopDefaultEventBehavior = function(e) {
                common.preventDefault(e);
                e.stopPropagation();
            }

            /**
             * Defines wheel scroll direction: if wheel is up.
             * @param e Event Object
             */
            common.wheelUp = function(e) {
                var evt = e || window.event;
                var delta = evt.originalEvent.detail < 0 || evt.originalEvent.wheelDelta > 0 ? 1 : -1;
                return delta > 0;
            }

             /** 
             * Defines wheel scroll direction: if wheel is down.
             * @param e Event Object
             */
            common.wheelDown = function(e) {
                return !this.wheelUp(e);
            }

            /**
             * Defines if the element given contains vertical scroll.
             * @param el HTMLObject
             */
           common.hasVertScroll = function(el) {
                return el.clientHeight < el.scrollHeight;
            }
            
            /**
             * @param e EventObject
             * @param el HTMLObject
             * @param step Number the number of pixels set as scroll interval
             * @param isUp Boolean True if scroll direction is up
             */
            common.smoothlyScroll = function(e, el, step, isUp) {
                common.stopDefaultEventBehavior(e);
                var step = step || 1;
                step = isUp? -step : step;
                el.scrollTop += step;
                return false;
            }

            /* Validates whether the given value is a valid URL
             * @urlString A string
             */
            common.validateUrl = function(urlString) {
                return kUrlValidString.test(urlString);
            }

        // Done.
        callback();

    });

});