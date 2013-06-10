sitecues.def('jquery/style', function(style, callback) {
    sitecues.use('jquery', function(jQuery) {

        // For those who need them (< IE 9), add support for CSS functions
        var isStyleFuncSupported = CSSStyleDeclaration.prototype.getPropertyValue != null;
        if (!isStyleFuncSupported) {
            CSSStyleDeclaration.prototype.getPropertyValue = function(a) {
                return this.getAttribute(a);
            };
            CSSStyleDeclaration.prototype.setProperty = function(styleName, value, priority) {
                this.setAttribute(styleName, value);
                var priority = typeof priority != 'undefined' ? priority : '';
                if (priority != '') {
                    // Add priority manually
                    var rule = new RegExp(RegExp.escape(styleName) + '\\s*:\\s*' + RegExp.escape(value) + '(\\s*;)?', 'gmi');
                    this.cssText = this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
                } 
            }
            CSSStyleDeclaration.prototype.removeProperty = function(a) {
                return this.removeAttribute(a);
            }
            CSSStyleDeclaration.prototype.getPropertyPriority = function(styleName) {
                var rule = new RegExp(RegExp.escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?', 'gmi');
                return rule.test(this.cssText) ? 'important' : '';
            }
        }

        // Escape regex chars with \
        RegExp.escape = function(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        }

        // The style function
        jQuery.fn.style = function(styleName, value, priority) {
            // DOM node
            var node = this.get(0);
            // Ensure we have a DOM node 
            if (typeof node == 'undefined') {
                return;
            }
            // CSSStyleDeclaration
            var style = this.get(0).style;
            // Getter/Setter
            if (typeof styleName != 'undefined') {
                if (typeof value != 'undefined') {
                    // Set style property
                    var priority = typeof priority != 'undefined' ? priority : '';
                    style.setProperty(styleName, value, priority);
                    return this;
                } else {
                    // Get style property
                    return style.getPropertyValue(styleName);
                }
            } else {
                // Get CSSStyleDeclaration
                return style;
            }
        }

        callback();
    });
});



