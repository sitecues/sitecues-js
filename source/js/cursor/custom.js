/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary; 
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor/custom', function (cursor, callback, log) {

    // Constants.

    var kDefaultType = 'default';
    var kDefaultZoomLevel = 1; // fallback if something gets wrong and zoom level cannot be fetched

    var kDefaultCursorImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAhCAYAAAA2/OAtAAADKElEQVRIS9WWPWxSURTH73t8SCmQpqGDCSYdHGiHjg4kHQ0mRZhMHGocsNShxkGbNCE6yGRIazVpN7aSiJCYGAYbcWLAxehgo6LRammNH0BIaSlV3vN/mvsIHw/6iungTf553PN4v3fuOeee+wR2DEM4Bib7j6CyLN9FCE5Bl3goJEEQ5H8Ji1Cr1cKiKN4EJAFdhSrQHsBSr2CCLlSr1RmDwSDq9fpnAM1A36HdXsEEXSwUCoH5+fm+UCgkAZwGcBra7BVM0AfFYvGK3W7vm5ubY8Fg8LfFYnkB4FSv4AMoPJ0aGhoyUQzdbjeLx+N/rFZrBtMAB+8cJRRtUAUci8VqAL9GEi/DloPKANe0JE8V2gi22Ww5wDywbWgFd4S2gDc5+KsWcFdor+BDob2ANUFVwOdho1BsqyVPM1QBr6ysyIODgzlUhQ+2L1CpFXwkqAJeWlqShoeHt3Q6HYHXW8FHhip1ura2Jjmdzi3ucRNYE5R22ezsLEObbKr98fFxhka0DvBZ3NiCKtQ2NUGJBM/YyMgI9doypnvQPl6yVyqV5IGBgSeY34FoO9dUoalUioXDYba6ulr3zO/3s+XlZdloNL6EMcl3WAHXn9A36FdHKHk0OjrKMpmM7HK5ms6wdDpNtiKWSz33DVQkj6Eq1z41nrqnk5OTJpQLQ7lU8FAW3WtsYmJCaPSWYptMJmX03MeA3OKZJ6ASbLke03K5PI34iGgeVMwP8aePmF/LZrMOZFjfmJ1EIiF5vd5dJOgC7K9o2Wp1ugjPruMm9c8Y9AP6BJ2RJOleIBDQRSKRRi6rVCqSyWR6DuMNcgBQOtfqQ4BHC5idhkKQAaLg0xklQk/z+fwYTgWj8kQ0GmUej4f19/dvoPgv8tjSCuv1RlACWSAdf5DeSqJln0Rs3+H8MjkcDubz+ZjZbKZkvMe9+3z5H3ClBt4EpQyTV8o4OPcxyG7B9RHm53Alb9bJe+gz9BaivU+rOih6BdD1swcg8tYO3Ybo+DZDVI9UlwTbhqptiWrwsO0n95YORBt0gq+IdtQOh6l+cBz6gUalphKerl8vh0K7raTTvb9mDMYxORabHQAAAABJRU5ErkJggg==';
    var kCursorStyleRuleId  = 'sitecues-cursor-style-rule';
    // Set custom cursor image for disabled elements
    var kCursorStyleDisabledRuleId  = 'sitecues-cursor-disabled-rule';
    // Low border of zoom level when cursor feature gets switched on/off.
    cursor.kMinCursorZoom = 1.1;
    
    // Get dependencies.
    sitecues.use('jquery', 'conf', 'cursor/style', 'cursor/element', 'cursor/images', 'ui', function ($, conf, style, view, images) {

        // Private variables.

        // Default values.
        cursor.isEnabled = false; // if cursor module is enabled
        cursor.prevTarget = {};
        cursor.offset = ''; // top left corner
        cursor.url = kDefaultCursorImage;

        cursor.styleRuleParent = $('head');
        cursor.type = kDefaultType;
        cursor.kTypes = Object.keys(images.offsets);

        /*
         * Initialize cursor according to zoom level given.
         */
        cursor.init = function(zl) {
            sitecues.emit('cursor/init');
            var zl = zl || kDefaultZoomLevel;
            var cursorWasEnabled = cursor.isEnabled;
            cursor.isEnabled = zl >= cursor.kMinCursorZoom;

            if (!cursor.isEnabled) {
              cursor.hide();
              return;
            }

            cursor.url = view.getImage(cursor.type, zl) || kDefaultCursorImage;
            cursor.offset = getCursorHotspotOffset();
            if (cursorWasEnabled) {
               cursor.update();
            } else {
               cursor.show();
            }
        };

        /*
         *  Show custom cursor in the viewport.
         */
        cursor.show = function() {
            addStyleRules();
            $(window).on('mousemove click', mouseMoveHandler);
            sitecues.emit('cursor/show');
        };

        /*
         *  Update cursor properties, such as dimensions or color.
         */
        cursor.update = function() {
            // Target is not changed, so update the same element's cursor style.
            $(cursor.prevTarget).style('cursor', 'url("' + cursor.url + '") ' + cursor.offset + ', ' + cursor.type, 'important');
            removeStyleRules();
            addStyleRules();
            sitecues.emit('cursor/update');
        };

        /*
         *  Hide cursor in the viewport.
         */
        cursor.hide = function() {
            // Reset the CSS cursor style.
            removeStyleRules();
            restoreCursorDisplay(cursor.prevTarget);
            $(window).off('mousemove click', mouseMoveHandler);
            sitecues.emit('cursor/hide');
        };


        /* Auxiliary functions */

        /**
         * Reverts the target's cursor property value to initial(replaced by our cutsom one).
         * @param target
         */
        function restoreCursorDisplay(target) {
            if (cursor.isEnabled) {
               $(target).style('cursor', '', 'important');
            }
        }

        /**
         * Remove rules for default cursor values.
         */
        function removeStyleRules() {
          $('#' + kCursorStyleRuleId).remove();
          $('#' + kCursorStyleDisabledRuleId).remove();
        }

        /**
         * Add rules for default cursor values.
         */
        function addStyleRules() {
          cursor.styleRuleParent
            .append('<style id="' + kCursorStyleRuleId + '">* { cursor: url("' + cursor.url + '") ' + cursor.offset + ', ' + cursor.type +'}')
            .append('<style id="' + kCursorStyleDisabledRuleId + '">*: disabled { cursor: url("' + cursor.url + '") ' + cursor.offset + ', ' + cursor.type +' !important}');
        }

        // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
        // The maths below based on experience and doesn't use any kind of specific logic.
        // We are liely to change it better one when we have final images.
        // There's no need for specific approach while we constantly change images and code.
        /**
         * Gets custom cursor's hotspot offset.
         * @param zl Number or string, represents zoom level.
         * @return result A string in format 'x y' which is later used a part of cursor property value.
         */
        function getCursorHotspotOffset(zl) {
             var zoom = {};
             zoom.min = kDefaultZoomLevel;
             zoom.current = zl || conf.get('zoom') || kDefaultZoomLevel;
             zoom.diff = zoom.current - zoom.min;
             var type = cursor.type;
             if ($.inArray(cursor.type, cursor.kTypes) < 0) {
               type = kDefaultType;
             }
             var offset = eval('images.offsets.' + type || kDefaultType);
             var result = '';
             if (offset) {
                switch (type) {
                 case 'auto':
                 case 'default':
                   result = offset.x + ' ' + Math.round(offset.y + offset.step * zoom.diff);
                   break
                 case 'pointer':
                   result = Math.round(offset.x + offset.step * zoom.diff)
                            + ' ' + Math.round(offset.y + (offset.step / 2) * zoom.diff);
                   break;
                 default:
                   break;
               }
             }
             return result;
        }

        /**
         * Updates image of the cursor element if the target needs.
         * @param target
         */
        function changeCursorDisplay(target) {
            if (!cursor.isEnabled) {
              return;
            }
            // Target has changed, update its image according to current zoom level and cursor type.
            if (!$(target).is(cursor.prevTarget)) {
              // First, revert last target's cursor property to saved style.
              restoreCursorDisplay(cursor.prevTarget);
              var newCursorType = style.detectCursorType(target) || kDefaultType;

              // Save the new target and its original cursor style to be able to revert to it.
              cursor.prevTarget = target;
              cursor.type = newCursorType;
              cursor.url = view.getImage(cursor.type, conf.get('zoom') || kDefaultZoomLevel) || kDefaultCursorImage; // (newCursorType)
              cursor.offset = getCursorHotspotOffset();

              // Set cursor style on new target.
              $(target).style('cursor', 'url("' + cursor.url + '") ' + cursor.offset + ', ' + cursor.type, 'important');
              $('#' + kCursorStyleRuleId).remove();
              return;
            }
        }

        /*
         * Change cursor display if necessary.
         * @param e Event Object.
         */
        function mouseMoveHandler(e) {
            changeCursorDisplay($(e.target));
        }

        // Handle zoom event.
        sitecues.on('zoom', cursor.init);

        cursor.init(conf.get('zoom') || kDefaultZoomLevel);

        // Done.
        callback();
    });
});