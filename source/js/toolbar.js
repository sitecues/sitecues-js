sitecues.def( 'toolbar', function ( toolbar, callback ) {

    sitecues.use( 'jquery', 'conf', 'load', 'util/template', 'toolbar/dropdown', 'toolbar/slider', 'toolbar/resizer', function ( $, conf, load, template, dropdown, slider, resizer) {
        
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
                slider.build(toolbar.instance);
                resizer.build(toolbar.instance, toolbar.shim);

                // create TTS button and set it up
                ttsButton = $( '<div>' ).addClass( 'tts' ).appendTo( toolbar.instance );
                ttsButton.data( 'tts-enable', 'enabled' );
                ttsButton.click( function() {
                    panel.ttsToggle();
                });

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
            console.log('toggle');
            if((toolbar.currentState) === toolbar.STATES.ON) {
                toolbar.slideIn();
            } else {
                toolbar.slideOut();
            }
        },

        $( document ).ready( function () {
            if(conf.get('showToolbar')) {
                toolbar.slideIn();
            }
        } );

        sitecues.on( 'badge/hover', toolbar.slideOut );
        sitecues.on( 'toolbar/toggle', toolbar.toggle );

        // load special toolbar css
        load.style('../css/toolbar.css');
        setTimeout(toolbar.slideOut, 500);

        callback();
    } );

} );