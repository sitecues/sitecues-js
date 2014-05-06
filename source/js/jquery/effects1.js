sitecues.def('jquery/effects1', function(effects, callback, log) {
    'use strict';

    sitecues.use('jquery', function($) {

        var toClass = {}.toString;

        $.fn.effects = function(cssStyle, complete) {

            // DOM node
            var node = this.get(0),
                doAnimate = false,
                type;

            // Ensure we have a DOM node 
            if (node === undefined) {
                return;
            }

            type = toClass.call(cssStyle).slice(8, -1) || '';

            if (type === 'Object') {
                // Default values.
                var complete = complete || undefined;

                // Animations...
                if (doAnimate) {
                    $(this).addClass('animate');
                }
                // Simply apply the style.
                $(this).css(cssStyle);
                if (complete) {
                    complete();
                }
            }

            return this;
        };


        callback();

    });

});