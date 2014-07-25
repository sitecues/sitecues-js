exports.getTraitStack = function(nodes) {
  var DEFAULT_TRAITS = {
    style: {
      display: 'block',
      float: 'none',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      backgroundRepeat: 'none'
    },
    rect: { left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200},
    unzoomedRect: { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 },
    tag: 'div',
    role: null,
    childCount: 1,
    isVisualMedia: false,
    topPadding: 1,
    leftPadding: 1,
    bottomPadding: 1,
    rightPadding: 1,
    topMargin: 1,
    leftMargin: 1,
    bottomMargin: 1,
    rightMargin: 1,
    topBorder: 0,
    leftBorder: 0,
    bottomBorder: 0,
    rightBorder: 0,
    topSpacing: 2,
    leftSpacing: 2,
    bottomSpacing: 2,
    rightSpacing: 2,
    visualWidth: 198,
    visualHeight: 198,
    percentOfViewportHeight: 50,
    percentOfViewportWidth: 50,
    percentOfBodyWidth: 30
  };
  function getTraits(/*nodeUnused*/) {
    return jquery.extend(true, {}, DEFAULT_TRAITS);
  }
  return nodes.map(getTraits);
};