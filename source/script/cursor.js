eqnx.def('cursor', function (cursor, callback) {

    cursor.isVisible = false;
    cursor.zoomLevel = 0;
    /* constants */
    cursor.imageUrl = '//ai2.s3.amazonaws.com/assets/cursors/pointer-001.png';
    cursor.imagePointerUrl = "//ai2.s3.amazonaws.com/assets/cursors/pointer-hand.png";
    // TK: Using this value to improve the visibility of the cursor when zooming.  This might
    // need to be a user specified value in the future.
    cursor.kCursorHideRuleId = "eq360-cursor-hide-rule";
    cursor.kDefaultHeight = 10;
    cursor.kZindex = 2147483647;
    cursor.kCursorId = "eq360-cursor";
    cursor.kMinCursorZoom = 1.5;
    cursor.kCursorZoomMultiplier = 1; // TODO: Find the best zoom multiplier through usability testing
    // TK: These new constants are for getting the point of the cursor pointer
    // to the exact location of where the underlying OS mouse pointer's point is
    cursor.kCursorImageGap = 10;   // gap from the edge of the full size image to painted cursor pixels
    cursor.kCursorImageSize = 120; // size of the actual image when full size

    // get dependencies
    eqnx.use('jquery', 'conf', 'ui', function ($, conf) {
        // private variables
        cursor.zoomLevel = conf.get('zoom');
        var cursorImage,
            imageGapAdjustment,
            aspectRatio,
            isEnabled = cursor.zoomLevel > cursor.kMinCursorZoom;

        // cursor element controls the appearance of the mouse cursor
        cursor.create = function () {
            // create element and add element id for proper styling
            var cursorElement = $('<img>')
                                .attr('id', cursor.kCursorId)
                                .attr('src', cursor.imageUrl)
                                .css({zIndex: cursor.kZindex.toString()})
                                .appendTo('body');

            return cursorElement;
        };

        /*
            Always checking when the mouse moves to compensate for
            a Chrome problem where mousing out from the browser doc
            window would leave an artifact of the mouse on the page.
        */
        cursor.update = function () {
            isEnabled ? cursor.show() : cursor.hide();
        };

        // todo: show cursor in the exact place native cursor locates.
        cursor.show = function () {
            if (!cursor.element) {
                cursor.element = cursor.create();
            }

            // cursor image loaded, calculate dimensions
            cursor.height = (cursor.zoomLevel * cursor.kCursorZoomMultiplier) * cursor.kDefaultHeight ;
            cursor.width  = (this.height * aspectRatio).toString();
            cursor.left = ((cursor.left / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            cursor.top = ((cursor.top / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            imageGapAdjustment = Math.round(( this.height / cursor.kCursorImageSize ) * cursor.kCursorImageGap);
            aspectRatio = $(cursor.element).width() / $(cursor.element).height();

            // update cursor styles
            $(cursor.element).css({
                height: this.height + 'px',
                width:  this.width + 'px',
                visibility: 'visible',
                left:   this.left,
                top:    this.top
            });

            if (!cursor.isVisible) {
                handleRealCursor(false);
            }
            cursor.isVisible = true;
            eqnx.emit('cursor/show', cursor.element);

        };

        cursor.hide = function () {
            if (cursor.isVisible) {
                // setIsRealCursorVisible(true);
                // ShimBuilder.removeShims(CursorView.kShimParentId);
                cursor.element.css('visibility', 'hidden');
                handleRealCursor(true);
                cursor.isVisible = false;
                eqnx.emit('cursor/hide', cursor.element);
            }
        };

        cursor.turnOnOrOff = function () {
            var wasEnabled = isEnabled;
            isEnabled = cursor.zoomLevel > cursor.kMinCursorZoom;

            if (wasEnabled === isEnabled) {
                cursor.update();
            } else if (isEnabled) {
                cursor.show();
                window.addEventListener("mousemove", mouseMoveHandler, false);
            } else {
                cursor.hide();
            }
        }

        // hide or show the real mouse cursor dependently on the parameter given.
        // if we are showing our own mouse cursor don't want the real cursor because that would be a double cursor.
        function handleRealCursor(isRealCursorVisible) {
            if (isRealCursorVisible) {
                $('#' + cursor.kCursorHideRuleId).remove();
            } else {
                $("head").append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: none !important;}</style>');
            }
        }

        function mouseMoveHandler(e) {
            cursor.left = ((e.clientX / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            cursor.top  = ((e.clientY / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";

            $('#' + cursor.kCursorId).css({ left: cursor.left, top: cursor.top});
            cursor.update();
            return true;
        }

        // initialize the cursor on the page if needed
        if (isEnabled) {
            // attach events
            cursor.show();
            window.addEventListener("mousemove", mouseMoveHandler, false);
        }

        // handle zoom event fired by any module
        eqnx.on('zoom', function (zoomvalue) {
            cursor.zoomLevel = zoomvalue;
            cursor.turnOnOrOff();
        });

        // done
        callback();

    });
});