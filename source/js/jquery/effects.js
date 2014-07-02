sitecues.def('jquery/effects', function(effects, callback) {
    'use strict';

    sitecues.use('jquery', function($) {
        
        var toClass = {}.toString;

        $.fn.effects = function(cssStyle, duration, easing, complete) {

            // DOM node
            var node = this.get(0),
                    doAnimate = true,
                    type;

            // Ensure we have a DOM node 
            if (node === undefined) {
                return;
            }

            type = toClass.call(cssStyle).slice(8, -1) || '';

            if (type === 'Object') {
                // Default values.
                var duration = duration || 400,
                    easing   = easing   || 'swing',
                    complete = complete || undefined;

                // Animations...
                if (doAnimate) {
                    $(this).animate(cssStyle, duration, easing, complete);
                } else {
                    // Simply apply the style.
                    $(this).css(cssStyle);
                    if (complete) {
                        complete();
                    }
                }
            }

            return this;
        };


        callback();

    });

});