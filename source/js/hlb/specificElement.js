/**
 * This file contains functionality that fixes specific elements' styles when necessary.
 */
sitecues.def('hlb/specificElement', function (hlbSpecificElement, callback, log) {

    // Constants.
    var toClass = {}.toString;

    hlbSpecificElement.kPlaceHolderWrapperClass = 'sitecues-eq360-box-placeholder-wrapper';
    hlbSpecificElement.kBoxZindex = 2147483644;
    
    // Get dependencies
    sitecues.use('jquery', 'conf', 'hlb/style', 'util/common', 'ui', function ($, conf, hlbStyle, common) {

    /*
     * Gets table ancestor element's parents.
     * @param itemNode
     * @return false if this is not a child of table element; otherwise, return an array of parent objects.
     */
     function getTableCellAncestorParents(itemNode) {
        var parents = itemNode.parents().andSelf();
        if (parents && parents.length > 0) {
            return parents;
        }
        return false;
    };

    // Keep ratio for images.
    hlbSpecificElement.preserveImageRatio = function(cssUpdate, clientRect) {
        var initialRatio = clientRect.width / clientRect.height;

        // If dimensions are recalculated, use the new values.
        if (cssUpdate.width || cssUpdate.height) {
            delete hlbStyle.cssBeforeAnimateInflationStyles.width;
            delete hlbStyle.cssBeforeAnimateInflationStyles.height;

            if ((cssUpdate.height && cssUpdate.width) || cssUpdate.width) {
                delete cssUpdate.height;
                hlbStyle.cssBeforeAnimateInflationStyles.width = cssUpdate.width;
                hlbStyle.cssBeforeAnimateInflationStyles.height = cssUpdate.width / initialRatio;
            } else if (cssUpdate.height) {
                delete cssUpdate.width;
                hlbStyle.cssBeforeAnimateInflationStyles.height = cssUpdate.height;
                hlbStyle.cssBeforeAnimateInflationStyles.width = cssUpdate.height * initialRatio;
            }
            return;
        }

        // Otherwise, no specific dimensions set, so, use the original ones(if any available).
        var height = parseFloat(hlbStyle.cssBeforeAnimateInflationStyles.height);
        var width  = parseFloat(hlbStyle.cssBeforeAnimateInflationStyles.width);

        var widthType = width ? toClass.call(width).slice(8, -1) : '';
        var heightType = height ? toClass.call(height).slice(8, -1) : '';

        // If image dimensions are good and don't need recalculations, return.
        if (widthType === 'Number' && heightType === 'Number') {
            return;
        }

        if (widthType === 'Number' || heightType === 'Number') {
            delete hlbStyle.cssBeforeAnimateInflationStyles.width;
            delete hlbStyle.cssBeforeAnimateInflationStyles.height;

            // Rely on width since it is set(whereas height is not set(or, '', 'auto' specified))
            if ((widthType === 'Number' && heightType === 'Number') || widthType === 'Number') {
                delete cssUpdate.height;
                hlbStyle.cssBeforeAnimateInflationStyles.height = width / initialRatio;
            } else if (heightType === 'Number') {
                // Rely on height since it is set(whereas width is not set(or, '', 'auto' specified))
                delete cssUpdate.width;
                hlbStyle.cssBeforeAnimateInflationStyles.width = height * initialRatio;
            }
        }

        return;
    };

    hlbSpecificElement.handleCanvas = function() {
        if (!hlbStyle) {
            return;
        }
        delete hlbStyle.cssBeforeAnimateInflationStyles.width;
        delete hlbStyle.cssBeforeAnimateInflationStyles.height;
        // todo: remove this awful hardcode
        hlbStyle.cssBeforeAnimateInflationStyles['background-color'] = 'rgb(173, 172, 167)';
    };

    hlbSpecificElement.handleZindexOverflow = function(hlb) {
        var ancestorCSS = [];
        var parents = hlb.$item.parentsUntil(document.body);
        $.each(parents, function () {
          ancestorCSS.push({
            zIndex   : this.style.zIndex,
            overflowX: this.style.overflowX,
            overflowY: this.style.overflowY,
            overflow : this.style.overflow});
        });


        $.each(parents, function() {
          $(hlb).style({
              'z-index': hlbSpecificElement.kBoxZindex.toString(),
              'overflow': 'visible'
              }, '', 'important');
        });
        return ancestorCSS;
    };

    /*
    * Table elements require extra work for some cases - especially when table has flexible layout.
    * @param itemNode HTML node Object
    * @param currentStyle Object
    */
    hlbSpecificElement.handleTableElement = function(itemNode, currentStyle) {
        // To reposition 'table'-like(for example,'td') elements, we need to set the td, tr, tbody, and table to display: block;
        var savedDisplay = currentStyle.display;
        // If the target is <td>, <tr>, <table> or any other table cell element then exit.
        if (savedDisplay.indexOf('table') === 0) {
            itemNode.style('display', 'block', 'important');
            return false;
        }

        // If the target is some inner element, like <div> or <p> inside of table cell then
        // handle flexible table width effect dependent of the inner elements.
        var tableCellAncestorParents = getTableCellAncestorParents(itemNode);
        tableCellAncestorParents.each(function () {
            if (this.tagName.toLowerCase() === 'table') {
                // todo: try to set table-layout:fixed to table
                var closest = itemNode.closest('td');
                var closestStyle = closest[0].getComputedStyle();
                var updateInnerElStyle = {};
                if (closestStyle) {
                    updateInnerElStyle.width = parseFloat(closestStyle['width'])
                    - parseFloat(closestStyle['padding-left'])
                    - parseFloat(closestStyle['padding-right'])
                    - parseFloat(closestStyle['margin-left'])
                    - parseFloat(closestStyle['margin-right'])
                    - parseFloat(closestStyle['border-left-width'])
                    - parseFloat(closestStyle['border-right-width'])
                    + 'px';
                }
                $(closest).children().wrapAll("<div class='" + hlbSpecificElement.kPlaceHolderWrapperClass + "'></div>");
                itemNode.style('display', 'block', 'important');
                $('.' + hlbSpecificElement.kPlaceHolderWrapperClass).style('width', updateInnerElStyle.width, 'important');

                return false; // Break the each loop
            }
        });
        return false;
    };

    // Done.
    callback();
    });
});