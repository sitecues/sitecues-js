sitecues.def( 'toolbar', function ( toolbar, callback ) {
    sitecues.use( 'jquery', 'ui', function ( $ ) {
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

        var STATES                                    = toolbar.STATES,
            current_state                             = STATES.OFF,
            dom_toolbar_close_button_element_id       = 'sitecues-toolbar-close-button',
            dom_toolbar_close_button_element_selector = null,
            dom_toolbar_element_id                    = 'sitecues-toolbar',
            dom_toolbar_element_selector              = null,
            dom_toolbar_string                        = ( '' +
                '<div id="' + dom_toolbar_element_id + '">' +
                    '<img id="' + dom_toolbar_close_button_element_id + '" src="' + sitecues.resolvesitecuesUrl("../images/close.png") + '" />' +
                '</div>' +
            '' )
        ;

        dom_toolbar_element_selector              = ( '#' + dom_toolbar_element_id );
        dom_toolbar_close_button_element_selector = ( '#' + dom_toolbar_close_button_element_id );

        toolbar.slideIn  = function () {
            $( dom_toolbar_element_selector ).slideUp( 'slow' );

            sitecues.emit( 'toolbar/slide-in', $( dom_toolbar_element_selector ) );

            current_state = STATES.OFF;

            sitecues.emit( ( 'toolbar/' + current_state.name ), $( dom_toolbar_element_selector ) );
        };
        toolbar.slideOut = function () {
            $( dom_toolbar_element_selector ).css( 'left', ( '-' + $( 'body' ).css( 'margin-left' ) ) );
            $( dom_toolbar_element_selector ).css( 'top', ( '-' + $( 'body' ).css( 'margin-top' ) ) );
            $( dom_toolbar_element_selector ).css( 'width', $( window ).width() );
            $( dom_toolbar_element_selector ).slideDown( 'slow' );

            sitecues.emit( 'toolbar/slide-out', $( dom_toolbar_element_selector ) );

            current_state = STATES.ON;

            sitecues.emit( ( 'toolbar/' + current_state.name ), $( dom_toolbar_element_selector ) );
        };

        $( document ).ready( function () {
            $( 'body' ).prepend( dom_toolbar_string );

            sitecues.on( 'badge/hover', toolbar.slideOut );

            $( dom_toolbar_close_button_element_selector ).on( 'click', toolbar.slideIn );
        } );

        sitecues.on( 'toolbar/on', function () {
            log.info( 'Toolbar state: [on].' );
        } );
        sitecues.on( 'toolbar/off', function () {
            log.info( 'Toolbar state: [off].' );
        } );

        callback();
    } );
} );