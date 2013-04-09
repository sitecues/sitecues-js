eqnx.def( 'invert', function ( invert, callback ) {
    eqnx.use( 'conf', 'highlight-box', 'jquery', function ( conf, highlight_box, $ ) {
        invert.STATES = {
            INVERT: {
                id:   0,
                name: 'invert'
            },
            MATCH:  {
                id:   1,
                name: 'match'
            },
            NORMAL: {
                id:   2,
                name: 'normal'
            }
        };

        var
            STATES                     = invert.STATES,
            css_invert_empty           = {
                '-webkit-filter': ''
            },
            css_invert_full            = {
                '-webkit-filter': 'invert(1)'
            },
            css_invert_none            = {
                '-webkit-filter': 'none'
            },
            dom_highlight_box          = null,
            dom_html                   = $( 'html' ),
            invert_state_highlight_box = null,
            invert_state_page          = null
        ;

        switch ( conf.get( 'invert.highlight-box.state' ) ) {
            case 'invert':
                setStateHighlightBoxInvert();

                break;
            case 'match':
                setStateHighlightBoxMatch();

                break;
            case 'normal':
                setStateHighlightBoxNormal();

                break;
            case undefined:
                setStateHighlightBoxMatch();

                break;
        }

        switch ( conf.get( 'invert.page.state' ) ) {
            case 'invert':
                setStatePageInvert();

                break;
            case 'normal':
                setStatePageNormal();

                break;
            case undefined:
                setStatePageNormal();

                break;
        }

        // To be removed. For debugging purposes.
        // setInterval( function () {
        //     console.log( '-webkit-filter: ' + $( dom_highlight_box ).css( '-webkit-filter' ) );
        //     logInvertState();
        // }, 3000 );

        eqnx.on( 'hlb/deflating', function () {
            if ( invert_state_highlight_box === invert_state_page ) {
                setStateHighlightBoxMatch();
            }
        } );

        // TODO: Make the code more DRY.

        eqnx.on( 'hlb/ready', function ( data ) {
            dom_highlight_box = $( data );

            switch ( invert_state_highlight_box ) {
                case STATES.INVERT:
                    if ( invert_state_page === STATES.INVERT ) {
                        $( dom_highlight_box ).css( css_invert_empty );
                    } else {
                        $( dom_highlight_box ).css( css_invert_full );
                    }

                    break;
                case STATES.MATCH:
                    $( dom_highlight_box ).css( css_invert_empty );

                    break;
                case STATES.NORMAL:
                    if ( invert_state_page === STATES.NORMAL ) {
                        $( dom_highlight_box ).css( css_invert_empty );
                    } else {
                        $( dom_highlight_box ).css( css_invert_full );
                    }

                    break;
            }
        } );

        eqnx.on( 'inverse/toggle', function ( event ) {
            if ( ! ( event.altKey || event.ctrlKey || event.metaKey ) ) {
                // logInvertState();

                var
                    highlight_box_state  = highlight_box.getState(),
                    highlight_box_states = highlight_box.STATES
                ;

                dom_highlight_box = $( event.dom.highlight_box );

                if ( highlight_box_state === highlight_box_states.READY || highlight_box_state === highlight_box_states.INFLATING || highlight_box_state === highlight_box_states.CREATE ) {
                    switch ( invert_state_highlight_box ) {
                        case STATES.INVERT:
                            switch ( invert_state_page ) {
                                case STATES.INVERT:
                                    $( dom_highlight_box ).css( css_invert_full );

                                    break;
                                case STATES.NORMAL:
                                    $( dom_highlight_box ).css( css_invert_none );

                                    break;
                            }

                            setStateHighlightBoxNormal();

                            break;
                        case STATES.MATCH:
                            switch ( invert_state_page ) {
                                case STATES.INVERT:
                                    $( dom_highlight_box ).css( css_invert_none );

                                    setStateHighlightBoxNormal();

                                    break;
                                case STATES.NORMAL:
                                    $( dom_highlight_box ).css( css_invert_full );

                                    setStateHighlightBoxInvert();

                                    break;
                            }

                            break;
                        case STATES.NORMAL:
                            switch ( invert_state_page ) {
                                case STATES.INVERT:
                                    $( dom_highlight_box ).css( css_invert_none );

                                    break;
                                case STATES.NORMAL:
                                    $( dom_highlight_box ).css( css_invert_full );

                                    break;
                            }

                            setStateHighlightBoxInvert();

                            break;
                    }
                } else if ( highlight_box_state === highlight_box_states.ON || highlight_box_state === highlight_box_states.CLOSED ) {
                    if ( invert_state_highlight_box === STATES.MATCH ) {
                        switch ( invert_state_page ) {
                            case STATES.INVERT:
                                setStateHighlightBoxInvert();

                                break;
                            case STATES.NORMAL:
                                setStateHighlightBoxNormal();

                                break;
                        }
                    }

                    switch ( invert_state_page ) {
                        case STATES.INVERT:
                            $( dom_html ).css( css_invert_none );

                            setStatePageNormal();

                            break;
                        case STATES.NORMAL:
                            $( dom_html ).css( css_invert_full );

                            setStatePageInvert();

                            break;
                    }
                }

                // logInvertState();
            }
        } );

        // function logInvertState() {
        //     console.log( '' );
        //     console.log( 'Invert [highlight-box]: {' + invert_state_highlight_box.name + '}' );
        //     console.log( 'Invert          [page]: {' + invert_state_page.name + '}' );
        //     console.log( '' );
        // }

        function setStateHighlightBoxInvert() {
            invert_state_highlight_box = STATES.INVERT;

            conf.set( 'invert.highlight-box.state', 'invert' );
            eqnx.emit( 'invert/highlight-box/invert' );
        }

        function setStateHighlightBoxMatch() {
            invert_state_highlight_box = STATES.MATCH;

            conf.set( 'invert.highlight-box.state', 'match' );
            eqnx.emit( 'invert/highlight-box/match' );
        }

        function setStateHighlightBoxNormal() {
            invert_state_highlight_box = STATES.NORMAL;

            conf.set( 'invert.highlight-box.state', 'normal' );
            eqnx.emit( 'invert/highlight-box/normal' );
        }

        function setStatePageInvert() {
            invert_state_page = STATES.INVERT;

            conf.set( 'invert.page.state', 'invert' );
            eqnx.emit( 'invert/page/invert' );
        }

        function setStatePageNormal() {
            invert_state_page = STATES.NORMAL;

            conf.set( 'invert.page.state', 'normal' );
            eqnx.emit( 'invert/page/normal' );
        }

        callback();
    } );
} );