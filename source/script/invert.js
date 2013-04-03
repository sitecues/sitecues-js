eqnx.def( 'invert', function ( invert, callback ) {
    eqnx.use( 'highlight-box', 'jquery', function ( highlight_box, $ ) {
        invert.STATES = {
            OFF: {
                id:   0,
                name: 'off'
            },
            ON: {
                HIGHLIGHT_BOX: {
                    id:   1,
                    name: 'on_highlight_box'
                },
                PAGE:          {
                    id:   2,
                    name: 'on_page'
                }
            }
        };

        var
            STATES            = invert.STATES,
            css_invert_on     = {
                '-webkit-filter': 'invert(100%)'
            },
            css_invert_off    = {
                '-webkit-filter': ''
            },
            current_state     = STATES.OFF,
            dom_highlight_box = null,
            dom_html          = $( 'html' )
        ;

        eqnx.on( 'inverse/toggle', function ( event ) {
            if ( ! (
                event.altKey ||
                event.ctrlKey ||
                event.metaKey
            ) ) {
                var
                    highlight_box_state   = highlight_box.getState(),
                    highlight_box_states  = highlight_box.STATES
                ;

                dom_highlight_box = $( event.highlight_box );

                switch ( highlight_box_state ) {
                    case (
                        highlight_box_states.READY ||
                        highlight_box_states.INFLATING ||
                        highlight_box_states.CREATE
                    ):
                        switch ( current_state ) {
                            case STATES.OFF:
                                $( dom_highlight_box ).css( css_invert_on );

                                current_state = STATES.ON.HIGHLIGHT_BOX;

                                break;
                            case STATES.ON.HIGHLIGHT_BOX:
                                $( dom_highlight_box ).css( css_invert_off );

                                current_state = STATES.OFF;

                                break;
                            case STATES.ON.PAGE:
                                $( dom_html ).css( css_invert_off );
                                $( dom_highlight_box ).css( css_invert_on );

                                current_state = STATES.ON.HIGHLIGHT_BOX;

                                break;
                        }

                        break;
                    case (
                        highlight_box_states.ON ||
                        highlight_box_states.CLOSED
                    ):
                        switch ( current_state ) {
                            case STATES.OFF:
                                $( dom_html ).css( css_invert_on );

                                current_state = STATES.ON.PAGE;

                                break;
                            case STATES.ON.PAGE:
                                $( dom_html ).css( css_invert_off );

                                current_state = STATES.OFF;

                                break;
                        }

                        break;
                    case highlight_box_states.OFF:
                        break;
                    case highlight_box_states.DEFLATING:
                        current_state = STATES.OFF;

                        break;
                    // default:
                }
            }
        } );

        callback();
    } );
} );