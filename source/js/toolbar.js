eqnx.def( 'toolbar', function ( toolbar, callback ) {
    eqnx.use( 'jquery', 'ui', function ( $, ui ) {
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

        var
            STATES                                    = toolbar.STATES,
            current_state                             = STATES.OFF,
            dom_toolbar_close_button_element_id       = 'eqnx-toolbar-close-button',
            dom_toolbar_close_button_element_selector = null,
            dom_toolbar_element_id                    = 'eqnx-toolbar',
            dom_toolbar_element_selector              = null,
            dom_toolbar_string                        = ( '' +
                '<div id="' + dom_toolbar_element_id + '">' +
                    '<img id="' + dom_toolbar_close_button_element_id + '" src="' + eqnx.resolveEqnxUrl("../images/close.png") + '" />' +
                '</div>' +
            '' )
        ;

        dom_toolbar_element_selector              = ( '#' + dom_toolbar_element_id );
        dom_toolbar_close_button_element_selector = ( '#' + dom_toolbar_close_button_element_id );

        toolbar.slideIn  = function () {
            $( dom_toolbar_element_selector ).slideUp( 'slow' );

            eqnx.emit( 'toolbar/slide-in', $( dom_toolbar_element_selector ) );

            current_state = STATES.OFF;

            eqnx.emit( ( 'toolbar/' + current_state.name ), $( dom_toolbar_element_selector ) );
        };
        toolbar.slideOut = function () {
            $( dom_toolbar_element_selector ).css( 'left', ( '-' + $( 'body' ).css( 'margin-left' ) ) );
            $( dom_toolbar_element_selector ).css( 'top', ( '-' + $( 'body' ).css( 'margin-top' ) ) );
            $( dom_toolbar_element_selector ).css( 'width', $( window ).width() );
            $( dom_toolbar_element_selector ).slideDown( 'slow' );

            eqnx.emit( 'toolbar/slide-out', $( dom_toolbar_element_selector ) );

            current_state = STATES.ON;

            eqnx.emit( ( 'toolbar/' + current_state.name ), $( dom_toolbar_element_selector ) );
        };

        $( document ).ready( function () {
            $( 'body' ).prepend( dom_toolbar_string );

            eqnx.on( 'badge/hover', toolbar.slideOut );

            $( dom_toolbar_close_button_element_selector ).on( 'click', toolbar.slideIn );
        } );

        eqnx.on( 'toolbar/on', function () {
            console.log( 'Toolbar state: [on].' );
        } );
        eqnx.on( 'toolbar/off', function () {
            console.log( 'Toolbar state: [off].' );
        } );

        callback();
    } );
} );