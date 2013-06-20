sitecues.def( 'toolbar', function (toolbar, callback, console) {

    sitecues.use( 'jquery', 'conf', 'load', 'util/template', 'toolbar/dropdown', 'toolbar/slider', 'toolbar/resizer', 'toolbar/messenger', function ( $, conf, load, template, dropdown, slider, resizer, messenger) {
        toolbar.STATES = {
            OFF: {
                id:   0,
                name: 'off'
            },
            ON:  {
                id:   1,
                name: 'on'
            }
        };

        toolbar.currentState = toolbar.STATES.OFF;

        toolbar.render = function(callback) {
            if(!toolbar.instance) {
                toolbar.shim = $('<div class="sitecues-toolbar-shim" />').prependTo($('html'));
                toolbar.shim.css({
                    height: (conf.get('toolbarHeight') || 40) + 'px'
                });

                toolbar.instance = $('<div class="sitecues-toolbar hori" />').prependTo($('html'));
                toolbar.instance.css({
                    height: (conf.get('toolbarHeight') || 40) + 'px'
                });

                dropdown.build(toolbar.instance);
                messenger.build(toolbar.instance);
                slider.build(toolbar.instance);
                resizer.build(toolbar.instance, toolbar.shim);

                // create TTS button and set it up
                toolbar.ttsButton = $( '<div rel="sitecues-event" data-sitecues-event="speech/toggle">' ).addClass( 'tts' ).appendTo( toolbar.instance );
                toolbar.ttsButton.data( 'tts-enable', 'enabled' );

                toolbar.wireEvents();

            }

            if(callback) {
                callback();
            }
        }

        toolbar.show = function () {
            if(!conf.get('toolbarEnabled')) {
                return;
            }
            toolbar.render();
            toolbar.instance.show(0);
            toolbar.shim.show(0);

            toolbar.currentState = toolbar.STATES.ON;

            sitecues.emit("toolbar/state/" + toolbar.currentState.name);
        };

        toolbar.slideIn = function () {
            toolbar.currentState = toolbar.STATES.OFF;

            if(toolbar.instance) {
                toolbar.instance.slideUp( 'slow' );
                toolbar.shim.slideUp( 'slow', function() {
                    sitecues.emit("toolbar/state/" + toolbar.currentState.name);
                });
            }
        };

        toolbar.slideOut = function () {
            toolbar.currentState = toolbar.STATES.ON;

            toolbar.render();
            sitecues.emit("toolbar/state/" + toolbar.currentState.name);
            toolbar.shim.slideDown( 'slow' );
            toolbar.instance.slideDown( 'slow' );
        };

        toolbar.toggle = function() {
            console.info('toggle');

            if((toolbar.currentState) === toolbar.STATES.ON) {
                toolbar.slideIn();
            } else {
                toolbar.slideOut();
            }
        };

        toolbar.enableSpeech = function() {
            toolbar.ttsButton.removeClass('tts-disabled');
            toolbar.ttsButton.data( 'tts-enable', 'enabled' );
        };

        toolbar.disableSpeech = function() {
            toolbar.ttsButton.addClass('tts-disabled');
            toolbar.ttsButton.data( 'tts-enable', 'disabled' );
        };

        /**
         * Looks for toolbar elements with a "rel" attribute of value
         * "sitecues-event". It then looks for a "data-sitecues-event" attribute
         * that will say which event(s) to fire.
         *
         * Note: We could possibly skip the "rel" step.
         *
         * @return void
         */
        toolbar.wireEvents = function() {
            toolbar.instance.find('[rel="sitecues-event"]').each(function() {
                $(this).on("click", function() {
                    var event = $(this).data('sitecues-event');
                    if(event) {
                        sitecues.emit(event);
                    } else {
                        console.warn("No event configured");
                    }
                })
            })
        };

        /**
         * Closes the toolbar and sets the preference so it stays closed.
         *
         * @return void
         */
        toolbar.disable = function () {
            conf.set("toolbarEnabled", false);
            toolbar.toggle();
        };

        /**
         * Enable (but do not show), the toolbar. Call show() or toggle() to
         * show it.
         * 
         * @return void
         */
        toolbar.enable = function () {
            conf.set("toolbarEnabled", true);
        };

        sitecues.on( 'toolbar/toggle', toolbar.toggle );
        sitecues.on( 'speech/disable', toolbar.disableSpeech );
        sitecues.on( 'speech/enable', toolbar.enableSpeech );

        // load special toolbar css
        load.style('../css/toolbar.css');
        load.style('../css/bootstrap.css');

        sitecues.on( 'toolbar/enable', function () {
            console.info( 'Toolbar state: [on].' );
            conf.set("toolbarEnabled", true);
        } );

        sitecues.on( 'toolbar/disable', function () {
            toolbar.disable();
            console.info( 'Toolbar state: [off].' );
        } );

        // FIXME We should not have to run `toolbar.show` in `setTimeout()`
        // EQ-622 might be the solution here
        $(document).ready(function () {
            if (conf.get("defaultUI") === 'toolbar') {
                toolbar.enable();
            } else {
                log.info("Disabling toolbar, defaultUI is set to " + conf.get("defaultUI"));
                toolbar.disable();
            }
            if(conf.get('toolbarEnabled')) {
                setTimeout(toolbar.show, 2500);
            }
        });
        callback();
    });

});
