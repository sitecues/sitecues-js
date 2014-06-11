/* global judge: true */
judge = {
  getJudgementStack: function(traitStack, nodes) {
    function getJudgement(node) {
      var isGoodNode = (node.className === 'pickme'); // The item we want to pick
      return {
        isGreatTag: isGoodNode,
        isGoodTag: false,
        isGoodRole: false,
        isGroupedWithImage: isGoodNode,
        isDivided: false,
        hasOwnBackground: isGoodNode,
        vertSeparationImpact: 1,
        horizSeparationImpact: 1,
        percentOfViewportHeightUnderIdealMin: 0,
        percentOfViewportHeightOverIdealMax: 0,
        percentOfViewportWidthUnderIdealMin: 0,
        percentOfViewportWidthOverIdealMax: 0,
        tinyHeightFactor: 0,
        tinyWidthFactor: 0,
        isFloatForCellLayout: isGoodNode,
        badGrowthTop: 0,
        badGrowthBottom: 0,
        badGrowthLeft: 0,
        badGrowthRight: 0,
        isLarge2dGrowth: 0,
        isModeratelySmallerThanParentInOneDimension: false,
        isModeratelyLargerThanChildInOneDimension: false,
        isCellInRow: false,
        isCellInCol: false,
        isSectionStartContainer: isGoodNode,
        isAncestorOfCell: false,
        isWideAncestorOfCell: false,
        isLargeWidthExpansion: false,
        isWideMediaContainer: false
      };
    }
    return nodes.map(getJudgement);
  }
};