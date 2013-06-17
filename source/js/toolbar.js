sitecues.def( 'toolbar', function ( toolbar, callback ) {

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

        toolbar.slideIn  = function () {
            toolbar.currentState = toolbar.STATES.OFF;
            if(toolbar.instance) {
                toolbar.instance.slideUp( 'slow' );
                toolbar.shim.slideUp( 'slow', function() {
                    sitecues.emit("toolbar/state/" + toolbar.currentState.name);
                });
            }
            conf.set('showToolbar', false);
        };

        toolbar.slideOut = function () {
            toolbar.currentState = toolbar.STATES.ON;
            if(!toolbar.instance) {
                toolbar.render();
            }
            sitecues.emit("toolbar/state/" + toolbar.currentState.name);
            toolbar.shim.slideDown( 'slow' );
            toolbar.instance.slideDown( 'slow' );
            conf.set('showToolbar', true);
        };

        toolbar.toggle = function() {
            sitecues.log.info('toggle');
            if((toolbar.currentState) === toolbar.STATES.ON) {
                toolbar.slideIn();
            } else {
                toolbar.slideOut();
            }
        },

        toolbar.enableSpeech = function() {
            toolbar.ttsButton.removeClass('tts-disabled');
            toolbar.ttsButton.data( 'tts-enable', 'enabled' );
        },

        toolbar.disableSpeech = function() {
            toolbar.ttsButton.addClass('tts-disabled');
            toolbar.ttsButton.data( 'tts-enable', 'disabled' );
        },

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
                sitecues.log.info($(this));
                $(this).click(function() {
                    var event = $(this).data('sitecues-event');
                    if(event) {
                        sitecues.emit(event);
                    } else {
                        sitecues.log.warn("No event configured");
                    }
                })
            })
        }

        $( document ).ready( function () {
            if(conf.get('showToolbar')) {
                toolbar.slideIn();
            }
        } );

        /**
         * Closes the toolbar and sets the preference so it stays closed.
         * 
         * @return void
         */
        toolbar.disable = function() {
            conf.set("toolbarEnabled", false);
            toolbar.toggle();
        }

        sitecues.on( 'badge/hover', toolbar.slideOut );
        sitecues.on( 'toolbar/toggle', toolbar.toggle );
        sitecues.on( 'toolbar/disable', toolbar.disable );

        sitecues.on( 'speech/disable', toolbar.disableSpeech );
        sitecues.on( 'speech/enable', toolbar.enableSpeech );

        // load special toolbar css
        load.style('../css/toolbar.css');
        load.style('../css/bootstrap.css');

        // FIXME We'll wait a half-second to show the toolbar, because
        // otherwise we don't know if everything is loaded or not.  I'd rather
        // have this listen to some event or possible check on a setTimeout
        // loop.
        setTimeout(toolbar.slideOut, 500)

        sitecues.on( 'toolbar/enable', function () {
            sitecues.log.info( 'Toolbar state: [on].' );
        } );
        sitecues.on( 'toolbar/disable', function () {
            sitecues.log.info( 'Toolbar state: [off].' );
        } );

        callback();
    } );

} );