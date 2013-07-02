/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - creates, inserts in DOM and shows in the window the custom cursor;
 * - hides the existing cursor when custom cursor is visible so that there are not two cursors;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor/custom', function (cursor, callback, log) {

    // Static properties
    cursor.isEnabled = false; // if cursor module is enabled
    cursor.zoomLevel = 1;
    cursor.type = 'default';
    cursor.prevTarget = {};
    cursor.prevType = 'default';
    // Default data url string
    cursor.url = cursor.kDefaultCursorImage;

    // Constants
    cursor.kDefaultCursorImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAbCAYAAAB836/YAAACL0lEQVRIS9WVT4gSYRjG53MkZ1sMFrEQRQIvsU14SQLR8CCCdPPivQ4egsKbROglIg9FUHTZs3varQ5ePCqB2BaI4h+CpA6WfzPRWXVTt+eFOQwSzCh7aD94GOebd36+7zzvvMO4M17sjHnc+QDq/lH2KfZIay82mUweM8auCoLwQL6bQHNZa0PZdDrNGgyG2+Px+K3RaLwvQyc4Hm8CZZIkfWi32zftdjvfarXe2Wy2JwCNoF+bQNlwOMyXy+Ub6XR6O5FInBQKhX2fz7cH2M9NoGwwGBQqlYro8XguxmIxLh6P/8lms4fBYPAVgD9WoKomsV6vd1Sr1a57vd4tik4mk1w0Gl3mcrl9v9//Alst6Dc0g5ZqRNbtdj/V6/VdJTAQCHCiKC6KxeKey+V6CsgAIqMWqsB+v/+xWq2KPM9vlUolLhKJcHD8eDabLfF8jxwOxz1AupqBZAp68BaAC7i9RF+yTqfzxe12vwbkO/RVNojaSD1DmPJer9fvogcfAZbK5/O80+mUTCbTQwDa0DfZnLEmIIIuQ5egK41G4+V8Pr9mtVqFTCbzJhQKHcjZEVjSZAqCtiEDtJNKpe6Ew+HngOpHo9Fns9l8F/t9WeSy6qtI44uHaEAQeKfZbD7T6XSnFoslIZdIbw25fKLmMF1XzsMLODdCguJGyogyI+jaQMqSYARWLpo8U4iOqkuZIf0m6Op8pCypXVSf32rJqv+uJeB8fFO0VKI55v8v+S/S1uIc5k3vOgAAAABJRU5ErkJggg==";
    cursor.kCursorStyleRuleId = 'sitecues-cursor-style-rule';
    // Set custom cursor image for disabled elements
    cursor.kCursorStyleDisabledRuleId  = 'sitecues-cursor-disabled-rule';
    cursor.kMinCursorZoom = 1.1;

    // get dependencies
    sitecues.use('jquery', 'conf', 'cursor/style', 'cursor/images', 'ui', function ($, conf, style, view) {

        // private variables
        cursor.styleRuleParent = $('head');
        cursor.isEnabled = false;

        /*
         * Initialize cursor according to zoom level given.
         */
        cursor.init = function(value) {
            cursor.zoomLevel = Math.pow(value, 2);
            var cursorWasEnabled = cursor.isEnabled;
            cursor.isEnabled = cursor.zoomLevel >= cursor.kMinCursorZoom;

            if (cursor.isEnabled) {
                //view.zoomImage(cursor.zoomLevel);
                cursor.url = view.getImage(cursor.type, value) || cursor.kDefaultCursorImage;
                if (cursorWasEnabled)
                    cursor.update();
                else
                    cursor.show();
            } else {
                cursor.hide();
            }
        };

        /*
         *  Show custom cursor in the viewport.
         */
        cursor.show = function() {
            // Add rules for default cursor values.
            cursor.styleRuleParent
                .append('<style id="' + cursor.kCursorStyleRuleId + '">* { cursor: url("' + cursor.url + '"), ' + cursor.type +' !important}')
                //.append('<style id="' + cursor.kCursorStyleDisabledRuleId + '">*:disabled { cursor: url("' + view.getImage('default', conf.get('zoom')) + '"), default !important}');
            $(window).on('mousemove click', mouseMoveHandler);
            sitecues.emit('cursor/show');
        };

        /*
         *  Update cursor properties, such as dimensions or color.
         */
        cursor.update = function() {
            // Target is not changed, so update the same element's cursor style.
            $(cursor.prevTarget).style('cursor', 'url("' + cursor.url + '"), ' + cursor.type, 'important');
            // Update cursor image for disabled elements.
            $('#' + cursor.kCursorStyleDisabledRuleId).remove();
            //cursor.styleRuleParent.append('<style id="' + cursor.kCursorStyleDisabledRuleId + '">*:disabled { cursor: url("' +  view.getImage('default', conf.get('zoom')) + '"), !important}');
            sitecues.emit('cursor/update');
        };

        /*
         *  Hide cursor in the viewport.
         */
        cursor.hide = function() {
            // Reset the CSS cursor style.
            $('#' + cursor.kCursorStyleDisabledRuleId).remove();
            $(cursor.prevTarget).style('cursor', cursor.prevType, 'important');
            $(window).off('mousemove click', mouseMoveHandler);
            sitecues.emit('cursor/hide');
        };

        /* Auxiliary functions */

        /**
         * Updates image of the cursor element if the target needs.
         * @param target
         */
        function changeCursorDisplay(target) {
            $('#' + cursor.kCursorStyleRuleId).remove();

            // If target is changed then update CSS cursor property for it.
            if (cursor.isEnabled && !$(target).is(cursor.prevTarget)) {
                // First, revert last target's cursor property to saved style.
                $(cursor.prevTarget).style('cursor', cursor.prevType, 'important');
                var newCursorType = style.detectCursorType(target) || 'default';

                // Save the new target and its original cursor style to be able to revert to it.
                cursor.prevTarget = target;
                cursor.prevType = newCursorType;
                cursor.type = newCursorType;
                //cursor.url = view.getImage('default', conf.get('zoom')) || cursor.kDefaultCursorImage; // (newCursorType)
                // Set cursor style on new target.
                $(target).style('cursor', 'url("' + cursor.url + '"), ' + cursor.type, 'important');
            }
        }

        function mouseMoveHandler(e) {
            changeCursorDisplay($(e.target));
        }

        // Handle zoom event.
        sitecues.on('zoom', cursor.init);
        cursor.init(conf.get('zoom') || cursor.zoomLevel);

        // Done.
        callback();
    });
});