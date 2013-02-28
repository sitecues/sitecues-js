// todo: handle native cursor, move cursor as native cursor moves, add window events for eqnx zoom.
eqnx.def('cursor', function (cursor, callback) {

    cursor.isVisible = false;
    cursor.zoomLevel = 0;
    cursor.kDefaultHeight = 10;
    cursor.kZindex = 2147483647;
    cursor.kCursorId = "eq360-cursor";
    cursor.kMinCursorZoom = 1.5;
    cursor.imageUrl = '//ai2.s3.amazonaws.com/assets/cursors/pointer-001.png';
    // TK: Using this value to improve the visibility of the cursor when zooming.  This might
    // need to be a user specified value in the future.
    cursor.kCursorZoomMultiplier = 1; // TODO: Find the best zoom multiplier through usability testing

    // get dependencies
    eqnx.use('jquery', 'conf', 'ui', function ($, conf) {
        // private variables
        cursor.zoomLevel = conf.get('zoom');
        var cursorImage;
        var isEnabled = cursor.zoomLevel > cursor.kMinCursorZoom;

        // cursor element controls the appearance of the mouse cursor
        cursor.create = function () {
            // create element and add element id for proper styling
            var cursorElement = $('<img>')
                                .attr('id', cursor.kCursorId)
                                .attr('src', cursor.imageUrl)
                                .css({
                                    zIndex: cursor.kZindex.toString(),
                                    position: 'fixed !important',
                                    visibility: 'hidden',
                                    pointerEvents: 'none'
                                })
                                .appendTo('body');

            return cursorElement;
        };

        /*
            Always checking when the mouse moves to compensate for
            a Chrome problem where mousing out from the browser doc
            window would leave an artifact of the mouse on the page.
        */
        cursor.update = function () {
            (isEnabled) ? cursor.show() : cursor.hide();
        };

        // todo: show cursor in the exact place native cursor locates.
        cursor.show = function () {
            // already shown
            if (cursor.element) {
                if (!cursor.isVisible) {
                    cursor.element.css('visibility', 'visible');
                }
                return;
            }

            // create new object
            cursor.element = cursor.create();

            // cursor image Loaded, calculate size
            var aspectRatio = $(cursor.element).width() / $(cursor.element).height();
            var newHeight = (cursor.zoomLevel * cursor.kCursorZoomMultiplier) * cursor.kDefaultHeight + 'px';
            var newWidth = (newHeight * aspectRatio).toString() + 'px';

            $(cursor.element).css({
                visibility: 'visible',
                height: newHeight,
                width: newWidth
            });
            cursor.isVisible = true;
            eqnx.emit('cursor/show', cursor.element);

        };

        cursor.hide = function () {
            if (cursor.isVisible) {
                // setIsRealCursorVisible(true);
                // ShimBuilder.removeShims(CursorView.kShimParentId);
                $(cursor.element).css('visibility', 'hidden');
                cursor.isVisible = false;
                eqnx.emit('cursor/hide', cursor.element);
            }
        };

        cursor.turnOnOrOff = function () {
            var wasEnabled = isEnabled;
            isEnabled = conf.get('zoom') > cursor.kMinCursorZoom;

            if (wasEnabled === isEnabled) {
                cursor.update();
            } else if (isEnabled) {
                cursor.show();
                // todo: also, call external 'util'-like method 'bindWindowListeners'
            } else {
                cursor.hide();
                // todo: also, call external 'util'-like method 'unbindWindowListeners'
            }
        }

        // initialize the cursor on the page if needed
        if (isEnabled) {
            cursor.show();
        }

        // handle zoom event fired by any module
        eqnx.on('zoom', function () {
            cursor.zoomLevel = conf.get('zoom');
            cursor.turnOnOrOff();
        });

        // done
        callback();

    });
});