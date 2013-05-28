sitecues.def( 'toolbar', function ( toolbar, callback ) {
    sitecues.use( 'jquery', 'conf', 'load', 'util/template', 'util/hammer', 'toolbar/dropdown', function ( $, conf, load, template, hammer, dropdown) {
        
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
                toolbar.shim.css({
                    height: (conf.get('toolbarHeight') || 40) + 'px'
                });
                frame = $('<div class="sitecues-toolbar hori" />').prependTo($('body'));
                frame.css({
                    height: (conf.get('toolbarHeight') || 40) + 'px'
                });

                dropdownLink = $('<a class="sitecues-dropdown" rel="sitecues-main">sitecues</a>').prependTo(frame);
                menu = $('<div id="sitecues-main" class="sitecues-menu"><ul><li>Link 1</li><li>Link 2</li></div>').appendTo(frame);
                dropdown.build();

                toolbar.createResizer(frame);

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
        },

        $( document ).ready( function () {
            if(conf.get('showToolbar')) {
                toolbar.slideIn();
            }
        } );

        toolbar.resize = function(e) {
            if(!e.gesture || e.gesture.touches.length != 1) {
                // Ignore on multitouch
                return;
            }
            var height = e.gesture.touches[0].pageY;
            if(height < 20) {
                height = 20;
            } else if (height > 60) {
                height = 60;
            }
            toolbar.instance.css({
                height: height
            });
            toolbar.shim.css({
                height: height
            });
        }

        toolbar.saveHeight = function() {
            conf.set('toolbarHeight', toolbar.instance.height());
        }

        /**
         * Creates a resizer and wires up the proper events.
         * 
         * @param  element parent The parent element of the resizer.
         * @return void
         */
        toolbar.createResizer = function(parent) {
            resizer = $('<div class="sitecues-resizer"></div>').appendTo(parent);

            var resizerDrag = Hammer(resizer.get(0));

            // I'm not thrilled with the way this text-select-avoidance works,
            // but it seems pretty good.  We don't really want to attach a
            // hammer to the body because that causes an unnecessary
            // performance hit and could interfere with an existing hammer if
            // it's already there.
            resizer.mouseenter(function() {
                $('body').addClass('noselect');
            }).mouseleave(function() {
                if(!resizer.data('dragging')) {
                    $('body').removeClass('noselect');
                }
            });

            resizerDrag.on('dragstart', function(e) {
                resizer.data('dragging', true);
            });
            resizerDrag.on('drag', function(e) {
                resizer.data('dragging', true);
                e.gesture.preventDefault();
                e.stopPropagation();
                toolbar.resize(e);
            });
            // Save the height when we're done dragging
            resizerDrag.on('dragend', function(e) {
                toolbar.saveHeight();
                resizer.data('dragging', false);
                $('body').removeClass('noselect');
            });
        }

        sitecues.on( 'badge/hover', toolbar.slideOut );
        sitecues.on( 'toolbar/toggle', toolbar.toggle );

        // load special toolbar css
        load.style('../css/toolbar.css');

        callback();
    } );

} );