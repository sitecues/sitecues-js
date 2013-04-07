eqnx.def( 'invert', function ( invert, callback ) {
    eqnx.use( 'highlight-box', 'jquery', function ( highlight_box, $ ) {
        invert.STATES = {
            HIGHLIGHT_BOX: {
                MATCH_PAGE: {
                    id:   0,
                    name: 'highlight-box.match-page'
                },
                OFF:        {
                    id:   1,
                    name: 'highlight-box.off'
                },
                ON:         {
                    id:   2,
                    name: 'highlight-box.on'
                }
            },
            PAGE:          {
                OFF: {
                    id:   3,
                    name: 'page.off'
                },
                ON:  {
                    id:   4,
                    name: 'page.on'
                }
            }
        };

        var
            STATES                     = invert.STATES,
            css_invert_on              = {
                '-webkit-filter': 'invert(100%)'
            },
            css_invert_off             = {
                '-webkit-filter': ''
            },
            dom_highlight_box          = null,
            dom_html                   = $( 'html' ),
            highlight_box_status       = null,
            invert_state_highlight_box = STATES.HIGHLIGHT_BOX.MATCH_PAGE,
            invert_state_page          = STATES.PAGE.OFF
        ;

        function invertMatchPageHighlightBox() {
            invert_state_highlight_box = STATES.HIGHLIGHT_BOX.MATCH_PAGE;
        }

        function invertOffHighlightBox() {
            $( dom_highlight_box ).css( css_invert_off );

            invert_state_highlight_box = STATES.HIGHLIGHT_BOX.OFF;
        }

        function invertOffPage() {
            $( dom_html ).css( css_invert_off );

            invert_state_page = STATES.PAGE.OFF;
        }

        function invertOnHighlightBox() {
            $( dom_highlight_box ).css( css_invert_on );

            invert_state_highlight_box = STATES.HIGHLIGHT_BOX.ON;
        }

        function invertOnPage() {
            $( dom_html ).css( css_invert_on );

            invert_state_page = STATES.PAGE.ON;
        }

        eqnx.on( 'inverse/toggle', function ( event ) {
            if ( ! (
                event.altKey ||
                event.ctrlKey ||
                event.metaKey
            ) ) {
                var
                    highlight_box_state  = highlight_box.getState(),
                    highlight_box_states = highlight_box.STATES
                ;

                dom_highlight_box = $( event.dom.highlight_box );

                // TODO: Simplify this.
                if (
                    ( highlight_box_state === highlight_box_states.READY ) ||
                    ( highlight_box_state === highlight_box_states.INFLATING ) ||
                    ( highlight_box_state === highlight_box_states.CREATE )
                ) {
                    switch ( invert_state_highlight_box ) {
                        case STATES.HIGHLIGHT_BOX.MATCH_PAGE:
                            switch ( invert_state_page ) {
                                case STATES.PAGE.OFF:
                                    invertOnHighlightBox();

                                    break;
                                case STATES.PAGE.ON:
                                    invertOffHighlightBox();

                                    break;
                            }

                            break;
                        case STATES.HIGHLIGHT_BOX.OFF:
                            invertOnHighlightBox();

                            break;
                        case STATES.HIGHLIGHT_BOX.ON:
                            invertOffHighlightBox();

                            break;
                    }
                } else if (
                    ( highlight_box_state === highlight_box_states.ON ) ||
                    ( highlight_box_state === highlight_box_states.CLOSED )
                ) {
                    switch ( invert_state_page ) {
                        case STATES.PAGE.OFF:
                            if ( invert_state_highlight_box === STATES.HIGHLIGHT_BOX.MATCH_PAGE ) {
                                invertOffHighlightBox();
                            }

                            invertOnPage();

                            break;
                        case STATES.PAGE.ON:
                            if ( invert_state_highlight_box === STATES.HIGHLIGHT_BOX.MATCH_PAGE ) {
                                invertOnHighlightBox();
                            }

                            invertOffPage();

                            break;
                    }
                }

                eqnx.on( 'hlb/ready', function ( data ) {
                    dom_highlight_box = $( data );

                    switch ( invert_state_highlight_box ) {
                        case STATES.HIGHLIGHT_BOX.MATCH_PAGE:
                            invertMatchPageHighlightBox();

                            break;
                        case STATES.HIGHLIGHT_BOX.OFF:
                            invertOffHighlightBox();

                            break;
                        case STATES.HIGHLIGHT_BOX.ON:
                            invertOnHighlightBox();

                            break;
                    }
                } );

                eqnx.on( 'hlb/deflating', function () {
                    //
                } );
            }
        } );

        callback();
    } );
} );