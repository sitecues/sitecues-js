/**
 * This is the module for the cursor enhancement.
 * It hides the existing cursor so that there are not two cursors.
 */
eqnx.def('cursor', function (cursor, callback) {

    /* Static properties */
    cursor.isEnabled = false;
    cursor.isVisible = false; // if custom cursor is visible
    cursor.zoomLevel = 0;

    /* Constants */
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

    // Get dependencies
    eqnx.use('jquery', 'conf', 'ui', function ($, conf) {
        // private variables
        cursor.zoomLevel = conf.get('zoom');
        var cursorImage,
            imageGapAdjustment,
            aspectRatio;

        // Cursor element takes over the appearance of the mouse cursor.
        cursor.create = function () {
            // create element and add element id for proper styling
            var cursorElement = $('<img>')
                                .attr('id', cursor.kCursorId)
                                .attr('src', cursor.imageUrl)
                                .css({zIndex: cursor.kZindex.toString()})
                                .appendTo('body');

            return cursorElement;
        };

        // Show cursor in the viewport.
        cursor.show = function () {
            if (!cursor.element) {
                cursor.element = cursor.create();
            }

            // Cursor image loaded, calculate dimensions.
            cursor.height = (cursor.zoomLevel * cursor.kCursorZoomMultiplier) * cursor.kDefaultHeight ;
            cursor.width  = (this.height * aspectRatio).toString();
            cursor.left = ((cursor.left / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            cursor.top  = ((cursor.top / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            imageGapAdjustment = Math.round(( this.height / cursor.kCursorImageSize ) * cursor.kCursorImageGap);
            aspectRatio = $(cursor.element).width() / $(cursor.element).height();

            // Update cursor styles.
            cursor.element.css({
                height: this.height + 'px',
                width:  this.width + 'px',
                left:   this.left,
                top:    this.top
            });

            cursor.isVisible = true;
            eqnx.emit('cursor/show', cursor.element);

        };

        // Hide cursor in the viewport.
        cursor.hide = function () {
            if (cursor.isVisible) {
                toogleRealCursor(true);
                // ShimBuilder.removeShims(CursorView.kShimParentId);
                cursor.element.hide();
                cursor.isVisible = false;
                eqnx.emit('cursor/hide', cursor.element);
            }
        };

        // Enables the cursor module if needed.
        cursor.turnOnOrOff = function () {
            cursor.isEnabled = cursor.zoomLevel > cursor.kMinCursorZoom;
            cursor.isEnabled ? cursor.show() : cursor.hide();
        };

        // Hide or show the real mouse cursor dependently on the parameter given.
        // If we are showing our own mouse cursor don't want the real cursor because that would be a double cursor.
        function toogleRealCursor(setRealCursorVisible) {
            if (setRealCursorVisible) {
                $('#' + cursor.kCursorHideRuleId).remove();
            } else {
                if ($('#' + cursor.kCursorHideRuleId).length === 0) {
                    $("head").append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: none !important;}</style>');
                }
                
            }
        }

        // Bind or unbind window events we care about.
        function handleMouseEvents() {
            if (cursor.isEnabled) {
                cursor.show()
                window.addEventListener("mousemove", mouseMoveHandler, false);
            } else {
                cursor.hide();
                window.removeEventListener("mousemove", mouseMoveHandler, false);
            }
        }

        // Takes care of 'mousemove' event.
        function mouseMoveHandler(e) {
            if (cursor.isVisible) {
                toogleRealCursor(false);
            }

            cursor.left = ((e.clientX / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            cursor.top  = ((e.clientY / cursor.zoomLevel) - imageGapAdjustment).toString() + "px";
            $('#' + cursor.kCursorId).css({ left: cursor.left, top: cursor.top}).show();
        }


        /* Handle zoom event fired by any module */
        eqnx.on('zoom', function (zoomvalue) {
            cursor.zoomLevel = zoomvalue;
            cursor.turnOnOrOff(cursor.isEnabled);
            handleMouseEvents();
        });

        // Done
        callback();

    });
});