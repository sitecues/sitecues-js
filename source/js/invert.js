sitecues.def('invert', function (invert, callback) {
    sitecues.use('conf', 'highlight-box', 'jquery', function (conf, highlight_box, $) {
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

        var STATES                     = invert.STATES;
        var css_invert_empty           = {
            '-webkit-filter': ''
        };
        var css_invert_full            = {
            '-webkit-filter': 'invert(1)'
        };
        var css_invert_none            = {
            '-webkit-filter': 'none'
        };
        var dom_highlight_box          = null;
        var dom_html                   = $('html');
        var invert_state_highlight_box = null;
        var invert_state_page          = null;

        switch (conf.get('invert.highlight-box.state')) {
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

        switch (conf.get('invert.page.state')) {
            case 'invert':
                setStylePageEmpty();
                setStylePageFull();
                setStatePageInvert();

                break;
            case 'normal':
                setStatePageNormal();

                break;
            case undefined:
                setStatePageNormal();

                break;
        }

        sitecues.on('hlb/deflating', function () {
            if (invert_state_highlight_box === invert_state_page) {
                setStateHighlightBoxMatch();
            }
        });

        // TODO: Make the code more DRY.

        sitecues.on('hlb/ready', function (data) {
            dom_highlight_box = $(data);

            switch (invert_state_highlight_box) {
                case STATES.INVERT:
                    if (invert_state_page === STATES.INVERT) {
                        setStyleHighlightBoxEmpty();
                    } else {
                        setStyleHighlightBoxFull();
                    }

                    break;
                case STATES.MATCH:
                    setStyleHighlightBoxEmpty();

                    break;
                case STATES.NORMAL:
                    if (invert_state_page === STATES.NORMAL) {
                        setStyleHighlightBoxEmpty();
                    } else {
                        setStyleHighlightBoxFull();
                    }

                    break;
            }
        } );

        /**
         * Inverts the page colors.  Currently only works in webkit.
         * 
         * @param  keypress event A keypress event, optional.
         * @return void
         */
        sitecues.on('inverse/toggle', function (event) {
            if(!event) {
                // We have no key event.
                if (invert_state_page === STATES.INVERT) {
                    setStylePageNone();
                    invert_state_page = STATES.NORMAL;
                    console.log("invert off");
                } else {
                    setStylePageFull();
                    invert_state_page = STATES.INVERT;
                    console.log("invert on");
                }
                // There should not be a highlight box open so we'll just set
                // it to match
                invert_state_highlight_box = STATES.MATCH;
                setStyleHighlightBoxNone();
                return;
            }

            //TODO We should probably clean up what's below here, or put it on
            //the menu in the North End.
            if (! (event.altKey || event.ctrlKey || event.metaKey)) {
                var highlight_box_state  = highlight_box.getState();
                var highlight_box_states = highlight_box.STATES;

                dom_highlight_box = $(event.dom.highlight_box);

                if (
                    highlight_box_state === highlight_box_states.READY ||
                    highlight_box_state === highlight_box_states.INFLATING ||
                    highlight_box_state === highlight_box_states.CREATE
                ) {
                    switch (invert_state_highlight_box) {
                        case STATES.INVERT:
                            switch (invert_state_page) {
                                case STATES.INVERT:
                                    setStyleHighlightBoxFull();

                                    break;
                                case STATES.NORMAL:
                                    setStyleHighlightBoxNone();

                                    break;
                            }

                            setStateHighlightBoxNormal();

                            break;
                        case STATES.MATCH:
                            switch (invert_state_page) {
                                case STATES.INVERT:
                                    setStyleHighlightBoxNone();
                                    setStateHighlightBoxNormal();

                                    break;
                                case STATES.NORMAL:
                                    setStyleHighlightBoxFull();
                                    setStateHighlightBoxInvert();

                                    break;
                            }

                            break;
                        case STATES.NORMAL:
                            switch (invert_state_page) {
                                case STATES.INVERT:
                                    setStyleHighlightBoxNone();

                                    break;
                                case STATES.NORMAL:
                                    setStyleHighlightBoxFull();

                                    break;
                            }

                            setStateHighlightBoxInvert();

                            break;
                    }
                } else if (
                    highlight_box_state === highlight_box_states.ON ||
                    highlight_box_state === highlight_box_states.CLOSED
                ) {
                    if (invert_state_highlight_box === STATES.MATCH) {
                        switch (invert_state_page) {
                            case STATES.INVERT:
                                setStateHighlightBoxInvert();

                                break;
                            case STATES.NORMAL:
                                setStateHighlightBoxNormal();

                                break;
                        }
                    }

                    switch (invert_state_page) {
                        case STATES.INVERT:
                            setStylePageNone();
                            setStatePageNormal();

                            break;
                        case STATES.NORMAL:
                            setStylePageFull();

                            setStatePageInvert();

                            break;
                    }
                }
            }
        } );

        function setStateHighlightBoxInvert() {
            invert_state_highlight_box = STATES.INVERT;

            conf.set('invert.highlight-box.state', 'invert');
            sitecues.emit('invert/highlight-box/invert');
        }
        function setStateHighlightBoxMatch() {
            invert_state_highlight_box = STATES.MATCH;

            conf.set('invert.highlight-box.state', 'match');
            sitecues.emit('invert/highlight-box/match');
        }
        function setStateHighlightBoxNormal() {
            invert_state_highlight_box = STATES.NORMAL;

            conf.set('invert.highlight-box.state', 'normal');
            sitecues.emit('invert/highlight-box/normal');
        }
        function setStatePageInvert() {
            invert_state_page = STATES.INVERT;

            conf.set('invert.page.state', 'invert');
            sitecues.emit('invert/page/invert');
        }
        function setStatePageNormal() {
            invert_state_page = STATES.NORMAL;

            conf.set('invert.page.state', 'normal');
            sitecues.emit('invert/page/normal');
        }
        function setStyleHighlightBoxEmpty() {
            $(dom_highlight_box).css(css_invert_empty);
        }
        function setStyleHighlightBoxFull() {
            $(dom_highlight_box).css(css_invert_full);
        }
        function setStyleHighlightBoxNone() {
            $(dom_highlight_box).css(css_invert_none);
        }
        function setStylePageEmpty() {
            $(dom_html).css(css_invert_empty);
        }
        function setStylePageFull() {
            $(dom_html).css(css_invert_full);
        }
        function setStylePageNone() {
            $(dom_html).css(css_invert_none);
        }

        callback();
    } );
} );
