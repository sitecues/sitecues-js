sitecues.def( 'toolbar', function ( toolbar, callback ) {
    sitecues.use( 'jquery', 'conf', 'load', 'util/template', function ( $, conf, load, template) {
        
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
                toolbar.shim = $('<div class="sitecues-toolbar-shim" />').prependTo($('body'));
                frame = $('<div class="sitecues-toolbar" />').prependTo($('body'));
            
                // create small A label
                $( '<div>' ).addClass( 'small' ).text( 'A' ).appendTo(frame);

                // create clider wrap element
                wrap = $( '<div>' ).addClass( 'slider-wrap' ).appendTo(frame);

                // create slider
                slider = $( '<input>' ).addClass( 'slider' ).attr({
                    type:       'range',
                    min:        '1',
                    max:        '5',
                    step:       '0.1',
                    ariaLabel:  'See it better'
                }).appendTo( wrap );

                $( '<img>' ).addClass( 'ramp' ).attr({
                    src:    sitecues.resolvesitecuesUrl('../images/panel/slider_ramp.png')
                }).appendTo( wrap );


                // create big A label
                $( '<div>' ).addClass( 'big' ).text( 'A' ).appendTo( frame );

                // create TTS button and set it up
                ttsButton = $( '<div>' ).addClass( 'tts' ).appendTo( frame );
                ttsButton.data( 'tts-enable', 'enabled' );
                ttsButton.click( function() {
                    panel.ttsToggle();
                });

                // handle slider value change
                slider.change( function() {
                    conf.set( 'zoom', this.value );
                });

                // handle zoom change and update slider
                conf.get( 'zoom', function( value ) {
                    slider.val( value );
                });
                toolbar.instance = frame;
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
        }

        $( document ).ready( function () {
            if(conf.get('showToolbar')) {
                toolbar.slideIn();
            }
        } );

        sitecues.on( 'badge/hover', toolbar.slideOut );
        sitecues.on( 'toolbar/toggle', toolbar.toggle );

        // load special toolbar css
        load.style('../css/toolbar.css');

        callback();
    } );
} );