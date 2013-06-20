/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - creates, inserts in DOM and shows in the window the custom cursor;
 * - hides the existing cursor when custom cursor is visible so that there are not two cursors;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor/custom', function (cursor, callback, console) {

    // Static properties
    cursor.isEnabled = false; // if cursor module is enabled
    cursor.zoomLevel = 1;
    cursor.type = 'default';
    cursor.prevTarget = {};
    cursor.prevType = 'default';
    // Default data url string
    cursor.url = cursor.kDefaultCursorImage;

    // Constants
    cursor.kDefaultCursorImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAeCAYAAADD0FVVAAADQUlEQVRIS9WVz08TQRTHZ9sqbYOQkpoQ5Tc3Lj2QQOAfKBwIqdxI5MjFePBCUjyQEDVtUjxoJPXigYSDSEzkxkE4kKAJaCB6qImU1rakRahtpVr60/ddZzZbShcwXNzkZd7s7nz2ve+8eSuVSiW7JEnL7BIviaAx4o1dJhjQEkGTxWLRrdfr3Txg3MMlxgvlIaBYdJzJZB6YTCYPJxRozP8LWA2VwbFYzNPY2PiE/CzZL7LcRcEKdHt7m9lsNkZqZH0+32xXV9dTgiXIji4KVqC0UWxra0sGk765zc3NF729vY8JeMjBiPxcGpdBkb8Aww8Gg2/b2trucPBPLsmZ4AroSXAgEFhpb28H+EAVcVGrHE6FYsH6+jrr6+uT13LwXQ5O8YirgqtCAZufn2ejo6My2O/3r3Z2dgL8nUwTrAk9CQ6Hw++am5vHVeBj8isiPhN6EpxIJPwWi8VB9/d5xADjoCjXuaBVwLdU4IwarAn1er1sYGBAiYBOGqupqZHnqVTqK22ma3Bw8A1NcUBQx7IUmlC73c4WFhZYXV2dOjvFLxQKh6FQ6CGV3HO6qchwKhSw5eW/LVZdAYuLi2E6bQek6aHVao03NDSkjEZjlDJ4VBUKwMjICItGo4xOkhIRnSzW0tLCNjY24j09PS/pgY/sC1mITByKykiTySSrr69XQEtLS2x4eFieu91uNjExwXK5XNHj8axOTk6+VkHj5KObVUKxOJvNZkijOBX5DcydTidzuVwyWPSESCSy39TU5OTQbzSik2GT0Hvl0pI1JZ2OqLDft7a2QvDrOzs79zs6Om4iekCHhoZYd3e3svPT09MzU1NTr+jdINkPMtFz5WYj5fP5FYPBMEa+hQz5XwM4nU4/M5vNtYoe5Ozt7aWoJX4mWWZVkQqo8qpE3lUOMtOIIpTna2tr4/39/bd1Ot0VpDw3N/eJtPwANlmARxnh6SPSMqiewzDiIzoOriUd7+3u7hYcDsdHuodiRXGjaUe5obmgz1ZAARImvgawkQxyQBYATfyDaRqRMgwn6TcZNqksUvVc7Rs4CLJAEpEJogJI/BSx42V/A0RY7RJSCJh4DwCAIMWpvxYtqMb3tB/9P9A/S+mqLvqod+YAAAAASUVORK5CYII=";
    cursor.kCursorStyleRuleId = 'sitecues-cursor-style-rule';
    // Set custom cursor image for disabled elements
    cursor.kCursorStyleDisabledRuleId  = 'sitecues-cursor-disabled-rule';
    cursor.kMinCursorZoom = 1.1;

    // get dependencies
    sitecues.use('jquery', 'conf', 'cursor/style', 'cursor/canvas', 'ui', function ($, conf, style, view) {

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
                view.zoomImage(cursor.zoomLevel);
                cursor.url = view.getImageOfType(cursor.type) || cursor.kDefaultCursorImage;
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
                .append('<style id="' + cursor.kCursorStyleDisabledRuleId + '">*:disabled { cursor: url("' + view.getImageOfType('default') + '"), default !important}');
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
            cursor.styleRuleParent.append('<style id="' + cursor.kCursorStyleDisabledRuleId + '">*:disabled { cursor: url("' + view.getImageOfType('default') + '"), !important}');
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
                cursor.url = view.getImageOfType(newCursorType) || cursor.kDefaultCursorImage;
                // Set cursor style on new target.
                $(target).style('cursor', 'url("' + cursor.url + '"), ' + cursor.type, 'important');
            }
        }

        /**
         * Reverts the target's cursor property value to initial(replaced by our cutsom one).
         * @param target
         */
        function restoreCursorDisplay(target) {
            $('#' + cursor.kCursorStyleRuleId).remove();

            if (cursor.isEnabled) {
                $(target).style('cursor', cursor.prevType, 'important');
            }
        }

        function mouseMoveHandler(e) {
            changeCursorDisplay($(e.target));
        }

        // Handle zoom event.
        sitecues.on('zoom', cursor.init);
        // Rollback cursor style change before we store element styles on HLB inflating.
        sitecues.on('hlb/create', function(hlb) {
            restoreCursorDisplay(hlb);
        });
        cursor.init(conf.get('zoom') || cursor.zoomLevel);

        // Done.
        callback();
    });
});