exports.getJudgementStack = function(traitStack, nodes) {
  function getJudgement(node) {
    var isGoodNode = (node.className === 'pickme'); // The item we want to pick
    return {
      isUsable: true,
      isGreatTag: isGoodNode,
      isGoodTag: false,
      isGoodRole: false,
      isHeading: false,
      badParents: 0,
      listAndMenuFactor: 0,
      horizontalListDescendantWidth: 0,
      isGroupedWithImage: isGoodNode,
      isFormControl: false,
      hasOwnBackground: isGoodNode,
      hasSiblingBackground: false,
      hasRaisedZIndex: 0,
      hasDescendantWithRaisedZIndex: 0,
      isOutOfFlow: 0,
      hasDescendantOutOfFlow: 0,
      vertSeparationImpact: 1,
      horizSeparationImpact: 1,
      percentOfViewportHeightUnderIdealMin: 0,
      percentOfViewportHeightOverIdealMax: 0,
      percentOfViewportWidthUnderIdealMin: 0,
      percentOfViewportWidthOverIdealMax: 0,
      nearBodyWidthFactor: false,
      tinyHeightFactor: 0,
      tinyWidthFactor: 0,
      isExtremelyTall: false,
      badGrowthTop: 0,
      badGrowthBottom: 0,
      large2dGrowth: 0,
      isModeratelySmallerThanParentInOneDimension: false,
      isModeratelyLargerThanChildInOneDimension: false,
      isCellInRow: false,
      isCellInCol: false,
      hasUniformlySizedSiblingCells: 0,
      hasSimilarSiblingCells: 0,
      isSectionStartContainer: isGoodNode,
      isHeadingContentPair: isGoodNode,
      isParentOfOnlyChild: false,
      numElementsDividingContent: false,
      isAncestorOfCell: false,
      isWideAncestorOfCell: false,
      isLargeWidthExpansion: false,
      isWideMediaContainer: false
    };
  }
  return nodes.map(getJudgement);
};