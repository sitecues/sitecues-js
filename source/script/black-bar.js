eqnx.def( 'black-bar', function ( black_bar, callback ) {
    eqnx.use( 'jquery', 'ui', function ( $, ui ) {
        black_bar.STATES = {
            OFF: {
                id:   0,
                name: 'off'
            },
            ON:  {
                id:   1,
                name: 'on'
            }
        };

        var
            STATES                                         = black_bar.STATES,
            current_state                                  = STATES.OFF,
            dom_black_bar_close_button_element_selector    = null,
            dom_black_bar_close_button_element_id          = 'eqnx-black-bar-close-button',
            dom_black_bar_element_selector                 = null,
            dom_black_bar_element_id                       = 'eqnx-black-bar',
            dom_black_bar_string                           = ('' +
                '<div id="' + dom_black_bar_element_id + '">' +
                    '<img id="' + dom_black_bar_close_button_element_id + '" src="//ai2.s3.amazonaws.com/assets/close.png" />' +
                '</div>' +
            '')
        ;

        dom_black_bar_element_selector              = ( '#' + dom_black_bar_element_id );
        dom_black_bar_close_button_element_selector = ( '#' + dom_black_bar_close_button_element_id );

        black_bar.slideIn  = function () {
            $( dom_black_bar_element_selector ).slideUp( 'slow' );

            eqnx.emit( 'black-bar/slide-in', $( dom_black_bar_element_selector ) );

            current_state = STATES.OFF;

            eqnx.emit( ( 'black-bar/' + current_state.name ), $( dom_black_bar_element_selector ) );
        };
        black_bar.slideOut = function () {
            $( dom_black_bar_element_selector ).css( 'left', ( '-' + $( 'body' ).css( 'margin-left' ) ) );
            $( dom_black_bar_element_selector ).css( 'top', ( '-' + $( 'body' ).css( 'margin-top' ) ) );
            $( dom_black_bar_element_selector ).css( 'width', $( window ).width() );
            $( dom_black_bar_element_selector ).slideDown( 'slow' );

            eqnx.emit( 'black-bar/slide-out', $( dom_black_bar_element_selector ) );

            current_state = STATES.ON;

            eqnx.emit( ( 'black-bar/' + current_state.name ), $( dom_black_bar_element_selector ) );
        };

        $( document ).ready( function () {
            $( 'body' ).prepend( dom_black_bar_string );

            eqnx.on( 'badge/hover', black_bar.slideOut );

            $( dom_black_bar_close_button_element_selector ).on( 'click', black_bar.slideIn );
        } );

        eqnx.on( 'black-bar/on', function () {
            console.log( 'Black bar state: [on].' );
        } );
        eqnx.on( 'black-bar/off', function () {
            console.log( 'Black bar state: [off].' );
        } );

        callback();
    } );
} );