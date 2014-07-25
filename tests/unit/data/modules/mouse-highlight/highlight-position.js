exports.getAllBoundingBoxes = function() { return [{ top: 10, left: 10, width: 100, height: 100, right: 110, bottom: 110 }]; }
exports.combineIntersectingRects = function(rects) { return rects[0]; }
exports.convertFixedRectsToAbsolute = function(rects) { return rects; }