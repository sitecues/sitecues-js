exports.getTraitStack = function(nodes) {
  var DEFAULT_TRAITS = {
    style: {
      display: 'block',
      float: 'none',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      backgroundRepeat: 'none'
    },
    normDisplay: 'block',
    role: null,
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
    percentOfViewportHeight: 50,
    percentOfViewportWidth: 50,
    percentOfBodyWidth: 30
  };
  function getTraits(node, index) {
    var traits = jquery.extend(true, {}, DEFAULT_TRAITS, {
      tag: node.localName,
      childCount: node.childElementCount,
      rect: {
        top: parseInt(node.getAttribute('data-top')),
        bottom: parseInt(node.getAttribute('data-top')) + parseInt(node.getAttribute('data-height')),
        left: parseInt(node.getAttribute('data-left')),
        right: parseInt(node.getAttribute('data-left')) + parseInt(node.getAttribute('data-width')),
        width: parseInt(node.getAttribute('data-width')),
        height: parseInt(node.getAttribute('data-height'))
      },
      unzoomedRect: {
        top: parseInt(node.getAttribute('data-top')) / 1.5,
        bottom: parseInt(node.getAttribute('data-top')) + parseInt(node.getAttribute('data-height')) / 1.5,
        left: parseInt(node.getAttribute('data-left')) / 1.5,
        right: parseInt(node.getAttribute('data-left')) + parseInt(node.getAttribute('data-width')) / 1.5,
        width: parseInt(node.getAttribute('data-width')) / 1.5,
        height: parseInt(node.getAttribute('data-height')) /1.5
      },
      fullWidth: parseInt(node.getAttribute('data-width')),
      visualWidthAt1x: parseInt(node.getAttribute('data-width')) / 1.5,
      visualHeightAt1x: parseInt(node.getAttribute('data-height')) /1.5
    });
    return traits;
  }
  return nodes.map(getTraits);
};