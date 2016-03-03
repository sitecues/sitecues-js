/**
 * Retrieve judgements about the node. These are hand-crafted rules tweaked over time.
 * Inputs: 1) candidate nodes and 2) their traits
 *
 * Example of judgements for a node:
 * - Does it use a good tag or role?
 * - Does it define its own interesting background?
 * - What is the visual impact of the spacing/border around its edges?
 * - Does it look like a cell in a row or column?
 * - Did it grow a lot larger compared with the child candidate?
 *
 * Note: "Growth" is a synonym for "Expansion" -- very intuitive for Aaron but no one else!
 */

define(['$', 'page/util/common', 'page/util/element-classifier', 'page/highlight/traitcache'],
  function($, common, elemClassifier, traitcache) {

    'use strict';

  // ** Semantic constants ***
  // For ARIA roles other tags could be used, but this is most likely and more performant than checking all possibilities
  var
    DIVIDER_SELECTOR = 'hr,div[role="separator"],img',
    SECTION_START_SELECTOR = 'h1,h2,h3,h4,h5,h6,hgroup,header,dt,div[role="heading"],hr,div[role="separator"]',
    GREAT_TAGS = { blockquote:1, td:1, ol:1, menu:1 },
    GOOD_TAGS = { a:1, address:1, button:1, code:1, dl:1, fieldset:1, form:1, p:1, pre:1, li:1, section:1, tr:1 },
    BAD_PARENTS_SELECTOR = 'li,p,h1,h2,h3,h4,h5,h6,hgroup,button',
    HEADING_TAGS = { h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,hgroup:1 },  // Because we prefer to select content with the heading
    // These are less likely to be used to layout a cell/box
    UNLIKELY_CELL_TAGS = { a: 1, ol: 1, ul: 1, p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, hgroup: 1, header:1 },
    GOOD_ROLES = {list:1, region:1, complementary:1, dialog:1, alert:1, alertdialog:1, gridcell:1,
    tabpanel:1, tree:1, treegrid:1, listbox:1, img:1, heading:1, rowgroup:1, row:1, toolbar:1,
    menu:1, menubar:1, group:1, form:1, navigation:1, main:1 },
    MIN_BR_TAGS_IN_TALL_ARTICLE = 5,
    UNUSABLE_TAGS = { area:1,base:1,basefont:1,bdo:1,br:1,col:1,colgroup:1,font:1,legend:1,link:1,map:1,optgroup:1,option:1,tbody:1,tfoot:1,thead:1,hr:1 },
    UNUSABLE_ROLES= { presentation:1, separator:1 },

    // ** Layout and geometrical constants ***
    MIN_COLUMN_CELL_HEIGHT = 25,                 // If fewer pixels than this, don't consider it to be a cell in a column
    MIN_AVERAGE_COLUMN_CELL_HEIGHT = 65,         // If fewer pixels than this per item, don't consider it to be a cell in a column
    IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT = 20,   // Smaller than this is bad
    IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT = 63,   // Larger than this is bad
    IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH = 20,    // Smaller than this is bad
    IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH = 63,    // Larger than this is bad
    MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH = 60,    // Media larger than this is bad
    IDEAL_MAX_PERCENT_OF_BODY_WIDTH = 85,        // If this percent or more of body width, it's bad. We don't like picking items almost as wide as body.
    NEAR_BODY_WIDTH_IMPACT_POWER = 2,            // Exponent for impact of being close to body's width
    TALL_ELEMENT_PIXEL_THRESHOLD = 999,          // Anything taller than this is considered very tall
    TINY_HEIGHT_PIXEL_THRESHOLD = 14,            // Anything shorter than this is considered a tiny element (or at least very thin)
    TINY_WIDTH_PIXEL_THRESHOLD = 33,             // Anything narrower than this is considered a tiny element (or at least very thin)
    TINY_ELEMENT_IMPACT_POWER = 1.2,             // Exponential for the affect of smallness
    SIGNIFICANT_IMAGE_PIXELS = 20,               // Number of pixels on a side before an image is significant
    SEPARATOR_IMAGE_PIXEL_THRESHOLD = 6,         // Maximum thickness for a separator line
    SEPARATION_DIVISOR = 1.6,                    // The number of spacing pixels will be divided by this in separation impact algorithm
    SEPARATION_IMPACT_POWER = 1.3,               // Exponent for visual impact of whitespace
    MAX_SPACE_SEPARATION_IMPACT = 14,            // The maximum impact of whitespace, for a given edge
    MAX_BORDER_SEPARATION_IMPACT = 22,           // The maximum impact of a border, for a given edge
    TABLE_CELL_SPACING_BONUS = 7,                // Treat table cells as having 5 extra spaces around them
    BORDER_WIDTH_BONUS = 15,                     // Bonus points for each pixel of border width
    SIGNIFICANT_EDGE_PIXEL_GROWTH = 50,          // Number of pixels of growth on a side that likely means additional content is encompassed on that side
    SIGNIFICANT_SEPARATION_IMPACT = 14,          // Amount of separation impact on a side that clearly shows a visual separation
    EXTREME_GROWTH_FACTOR = 2.5,                 // If parent's height ratio of child is larger than this, we consider it significantly larger than child
    MODERATE_GROWTH_FACTOR = 1.3,                // An amount of growth that is significant but not huge
    COLUMN_VERT_GROWTH_THRESHOLD = 1.3,          // Sometimes there is a very small cell in a column of only 2 cells. We only require that the column be 30% taller than the cell
    ROW_HORIZ_GROWTH_THRESHOLD = 1.8,            // Because text is horizontal, it is unlikely to have a narrow cell in a row. Generally the row width will be nearly 2x the cell width.
    MAX_CELL_GROUP_GROWTH_PER_SIBLING = 2,       // For each sibling, allow the cell group's area to be this much larger than the cell
    VERY_SMALL_GROWTH_FACTOR = 1.04,
    SMALL_GROWTH_FACTOR = 1.2,
    MIN_IMAGE_GROUP_HEIGHT = 50,                 // Image groups must be taller than this
    MAX_CHILDREN_IMAGE_GROUP = 4,                // If more children than this, it does not typically fit the pattern of an image group, so don't do the expensive check
    MAX_ANCESTOR_INDEX_IMAGE_GROUP = 5,          // If ancestor index is larger than this, it does not typically fit the pattern of an image group, so don't do the expensive check
    ROUGHLY_SAME_SIZE_THRESHOLD = 120,           // If parent grows by fewer pixels than this, it is considered roughly the same size as the child
    LINK_LIST_FACTOR = 1.5,                        // How much to multiply list score by if it's a list of links
    OUT_OF_FLOW_LIST_FACTOR = 6,                 // How much to multiply list score by if it's a positioned list (a menu)
    customJudgements = {};

    // ----------- PUBLIC  ----------------

    // Get a judgement for each node
    // The judgements, traits and nodes all correlate, such that index 0 of each array
    // stores information for the first candidate node, index 1 is the parent, etc.
    // When the node is unusable, judgements is set to null, rather than wasting cycles calculating the judgements.
    function getJudgementStack(traitStack, nodeStack) {
      var firstNonInlineTraits = getTraitsOfFirstNonInlineCandidate(traitStack),
        childJudgements = null,
        childTraits = traitStack[0],  // For simplicity of calculations, not allowed to be null
      // Get cascaded spacing traits and add them to traitStack
        spacingInfoStack = getCascadedSpacingInfo(traitStack, nodeStack);  // topSpacing, leftSpacing, topDivider, etc.

      // Return the judgements for the candidate at the given index
      // Return null if the candidate is unusable
      function mapJudgements(traits, index) {
        var node = nodeStack[index],
          judgements = getJudgements(traitStack, childTraits, firstNonInlineTraits, node,
            spacingInfoStack, childJudgements, index);
        childJudgements = judgements;
        childTraits = traits;
        return judgements;
      }

      return traitStack.map(mapJudgements);
    }

    // This is a hook for customization scripts, which can add their own judgements by overriding this method.
    // Pass in as { judgementName: fn(), judgementName2: fn2(), etc. }
    // Parameters to judgement functions are:
    //   judgements, traits, belowTraits, belowJudgements, parentTraits, firstNonInlineTraits, node, index
    // For each judgement, a weight of the same name must exist.
    function provideCustomJudgements(judgements) {
      customJudgements = judgements;
    }

    // ------------ PRIVATE -------------

    function getJudgements(traitStack, childTraits, firstNonInlineTraits, node, spacingStack, childJudgements, index) {
      var judgementGetter,
        traits = traitStack[index],
        numCandidates = traitStack.length,
        parentTraits = index < numCandidates - 1 ? traitStack[index + 1] : traits,
        firstTraits = traitStack[0],
        judgements = spacingStack[index];  // Begin with cascaded spacing info

      // Computed judgements
      $.extend(judgements, getVisualSeparationJudgements(node, traits, parentTraits, childTraits, judgements, childJudgements));
      $.extend(judgements, getSizeJudgements(node, judgements, traits, firstNonInlineTraits, childJudgements));
      $.extend(judgements, getGrowthJudgements(traits, childTraits, parentTraits, firstNonInlineTraits, firstTraits, childJudgements));
      $.extend(judgements, getCellLayoutJudgements(node, judgements, traits, parentTraits, childJudgements, firstNonInlineTraits));
      $.extend(judgements, getDOMStructureJudgements(judgements, traits, childJudgements, childTraits, node, index));

      for (judgementGetter in customJudgements) {
        if (customJudgements.hasOwnProperty(judgementGetter)) {
          $.extend(judgements, judgementGetter(judgements, traits, childTraits, childJudgements, parentTraits, firstNonInlineTraits, node, index));
        }
      }

      judgements.isUsable = isUsable(traits, judgements);

      return judgements;
    }

    // Which edges of node are adjacent to parent's edge? E.g. top, left, bottom, right
    // Returns an array of edges, e.g. ["top", "left"]
    function getAdjacentEdges(traitStack, index) {
      var traits = traitStack[index],
        parentTraits = traitStack[index + 1],
        rect = traits.unzoomedRect,
        parentRect = parentTraits.unzoomedRect,
        adjacentEdges = [],
        FUZZ_FACTOR = 1;  // If we're close by this many pixels, consider them adjacent

      if (parentRect.top + parentTraits.topPadding + FUZZ_FACTOR >= rect.top - traits.topMargin) {
        adjacentEdges.push('top');
      }

      if (parentRect.left + parentTraits.leftPadding + FUZZ_FACTOR >= rect.left - traits.leftMargin) {
        adjacentEdges.push('left');
      }

      if (parentRect.bottom - parentTraits.bottomPadding - FUZZ_FACTOR <= rect.bottom + traits.bottomMargin) {
        adjacentEdges.push('bottom');
      }

      if (parentRect.right - parentTraits.rightPadding - FUZZ_FACTOR <= rect.right + traits.rightMargin) {
        adjacentEdges.push('right');
      }

      return adjacentEdges;
    }

    // Get the true amount of spacing around each object.
    // For the top, left, bottom and rightmost objects in each container,
    // the parent container's margin/padding for that edge should be added to it
    // because we want the complete amount of visual spacing on that edge.
    function getCascadedSpacingInfo(traitStack, nodeStack) {

      // Create the spacing properties
      function getSpacingTraits(item, index) {
        var node = nodeStack[index],
          parent = node.parentNode,
          itemRect = traitcache.getRect(node),
          cellBonus = (traitStack[index].tag === 'td') * TABLE_CELL_SPACING_BONUS;
        return {
          topSpacing: item.topMargin + item.topPadding + cellBonus,
          leftSpacing: item.leftMargin + item.leftPadding + cellBonus,
          bottomSpacing: item.bottomMargin + item.bottomPadding + cellBonus,
          rightSpacing: item.rightMargin + item.rightPadding + cellBonus,
          topDivider: getDividerThickness(parent.firstElementChild, 'top', itemRect.top - SIGNIFICANT_EDGE_PIXEL_GROWTH, itemRect.top),
          leftDivider: getDividerThickness(parent.firstElementChild, 'left', itemRect.left - SIGNIFICANT_EDGE_PIXEL_GROWTH, itemRect.left),
          bottomDivider: getDividerThickness(parent.lastElementChild, 'bottom', itemRect.bottom, itemRect.bottom + SIGNIFICANT_EDGE_PIXEL_GROWTH),
          rightDivider: getDividerThickness(parent.lastElementChild, 'right', itemRect.right, itemRect.right + SIGNIFICANT_EDGE_PIXEL_GROWTH)
        };
      }

      var spacingTraitStack = traitStack.map(getSpacingTraits),
        index;

      function combineProperty(index, edge, type) {
        // Edges are adjacent, so use combined separation value for both, on that edge
        var propName = edge + type, // E.g. topSpacing
          sum = spacingTraitStack[index][propName] + spacingTraitStack[index + 1][propName];
        spacingTraitStack[index][propName] = sum;
        spacingTraitStack[index + 1][propName] = sum;
      }
      function combineAdjacentEdges(edge) {
        // Edges are adjacent, so use combined separation value for both, on that edge
        combineProperty(index, edge, 'Spacing');
        combineProperty(index, edge, 'Divider');
      }

      // Cascade the spacing of each edge on the parent to its child, as appropriate.
      // For example, if the element is at the top of the parent, treat both object's top as
      // having the same aggregated values.
      // Because we compare each element to its parent, we start with child of the top ancestor.
      for (index = spacingTraitStack.length - 2; index >= 0; index --) {
        var adjacentEdges = getAdjacentEdges(traitStack, index);
        adjacentEdges.forEach(combineAdjacentEdges);
      }

      return spacingTraitStack;
    }

  function getVisualSeparationJudgements(node, traits, parentTraits, childTraits, judgements, childJudgements) {
    var visualSeparationJudgements = {
      // Get a number that represents the visual impact of margin, padding, border
      topSeparationImpact: getSeparationImpact(judgements.topSpacing, judgements.topDivider + traits.topBorder),
      bottomSeparationImpact: getSeparationImpact(judgements.bottomSpacing, judgements.bottomDivider + traits.bottomBorder),
      leftSeparationImpact: getSeparationImpact(judgements.leftSpacing, judgements.leftDivider + traits.leftBorder),
      rightSeparationImpact: getSeparationImpact(judgements.rightSpacing, judgements.rightDivider + traits.rightBorder),

      // Check whether a CSS background creates a visual separation from the parent,
      // (for example, it has a different background-color or uses a background-image).
      // Don't include non-repeating sprites (positioned background images) -- these are used for bullets, etc.
      hasOwnBackground: !!common.hasOwnBackground(node, traits.style, parentTraits.style),
      hasSiblingBackground: hasSiblingBackground(node, parentTraits.style, traits.tag),
      hasDescendantWithRaisedZIndex: childJudgements && (childJudgements.hasRaisedZIndex || childJudgements.hasDescendantWithRaisedZIndex),
      hasDescendantOutOfFlow: childJudgements && (childJudgements.isOutOfFlow || childJudgements.hasDescendantOutOfFlow)
    };

    visualSeparationJudgements.hasRaisedZIndex = !visualSeparationJudgements.hasDescendantWithRaisedZIndex &&
      common.hasRaisedZIndex(childTraits.style, traits.style);
    visualSeparationJudgements.isOutOfFlow = !visualSeparationJudgements.hasDescendantOutOfFlow &&
      isOutOfFlow(node, traits, parentTraits);

    // Get effective separation impact vertically and horizontally
    // This is helpful because often a group of items will define spacing on one side of each
    // item, rather than both. For example, if each item in a list has a bottom margin,
    // then effectively each item looks like it also has a top margin.
    // If it's almost as wide as the body, don't let horizontal separation be considered a good thing --
    // it's probably just abutting the edge of the document.
    var isAlmostAsWideAsBody = traits.percentOfBodyWidth > IDEAL_MAX_PERCENT_OF_BODY_WIDTH;
    $.extend(visualSeparationJudgements, {
      vertSeparationImpact:
        Math.max(visualSeparationJudgements.topSeparationImpact, visualSeparationJudgements.bottomSeparationImpact),
      horizSeparationImpact:
        isAlmostAsWideAsBody ? 0 :
        Math.max(visualSeparationJudgements.leftSeparationImpact, visualSeparationJudgements.rightSeparationImpact)
    });

    return visualSeparationJudgements;
  }

  function getSizeJudgements(node, judgements, traits, firstNonInlineTraits, childJudgements) {
    var isSignificantlyWiderThanFirstOption = traits.rect.width < firstNonInlineTraits.rect.width + SIGNIFICANT_EDGE_PIXEL_GROWTH;
    return {
      // Avoid picking tiny icons or images of vertical lines
      tinyHeightFactor: (traits.isVisualMedia || judgements.hasOwnBackground) &&  // Make sure it's an image or bg image, otherwise we punish lines of text too much
        Math.pow(Math.max(0, TINY_HEIGHT_PIXEL_THRESHOLD - traits.visualHeightAt1x), TINY_ELEMENT_IMPACT_POWER),

      // Avoid picking tiny icons or images of horizontal lines
      tinyWidthFactor: Math.pow(Math.max(0, TINY_WIDTH_PIXEL_THRESHOLD - traits.visualWidthAt1x), TINY_ELEMENT_IMPACT_POWER),

      // Avoid picking extremely tall items
      isExtremelyTall: (childJudgements && childJudgements.isExtremelyTall) ||
        (traits.visualHeightAt1x > TALL_ELEMENT_PIXEL_THRESHOLD &&
         childJudgements && traits !== firstNonInlineTraits &&
         // Give super tall paragraphs in an article a chance
         node.getElementsByTagName('br').length > MIN_BR_TAGS_IN_TALL_ARTICLE),

      // We have a concept of percentage of viewport width and height, where under or over the ideal is not good.
      // Avoid picking things that are very small or large, which are awkward in the HLB according to users.
      percentOfViewportHeightUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT - traits.percentOfViewportHeight),
      percentOfViewportHeightOverIdealMax: Math.min(60, Math.max(0, traits.percentOfViewportHeight - IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT)),
      percentOfViewportWidthUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH - traits.percentOfViewportWidth),
      // If no good child candidate, don't punish it for being almost as wide as the viewport
      percentOfViewportWidthOverIdealMax: isSignificantlyWiderThanFirstOption ? Math.max(0, traits.percentOfViewportWidth - IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH) : 0,
      nearBodyWidthFactor: isSignificantlyWiderThanFirstOption ?
        0 : // If we're not significantly wider than the first non-inline candidate, don't punish for being wide
        Math.pow(Math.max(0, traits.percentOfBodyWidth - IDEAL_MAX_PERCENT_OF_BODY_WIDTH), NEAR_BODY_WIDTH_IMPACT_POWER)
    };
  }

  // Judge different types of growth:
  // "Growth" is size comparison between an element and a descendant.
  // It can be measured as:
  // - A difference in pixels, as a ratio or as a percentage.
  // The comparisons can be between:
  // - A parent candidate to the child candidate
  // - From the current candidate to its child candidate
  // - From the current candidate to first non-inline candidate
  function getGrowthJudgements(traits, childTraits, parentTraits, firstNonInlineTraits, firstTraits, childJudgements) {
    var growthJudgements = {
      // Ratio of sizes between objects

      // Comparison with first non-inline candidate.
      // This is the first element can provide useful size to compare with.
      totalHorizGrowthFactor: traits.fullWidth / firstNonInlineTraits.fullWidth,
      totalVertGrowthFactor: traits.rect.height / firstNonInlineTraits.rect.height,

      // Comparison with the parent
      parentHorizGrowthFactor: parentTraits.fullWidth / traits.fullWidth,
      parentVertGrowthFactor: parentTraits.rect.height / traits.rect.height,

      // Comparison with the child
      childHorizGrowthFactor: traits.fullWidth/ childTraits.fullWidth,
      childVertGrowthFactor: traits.rect.height / childTraits.rect.height,

      // Amount of growth in particular direction, in pixels.
      // We use unzoomedRect so that the numbers are not impacted by the amount of zoom.
      topGrowth: childTraits.unzoomedRect.top - traits.unzoomedRect.top,
      bottomGrowth: traits.unzoomedRect.bottom - childTraits.unzoomedRect.bottom,
      leftGrowth: childTraits.unzoomedRect.left - traits.unzoomedRect.left,
      rightGrowth: traits.unzoomedRect.right - childTraits.unzoomedRect.right
    };

    function getBadGrowth(edge) {
      if (!childJudgements) {
        return 0;
      }
      var separationImpact = childJudgements[edge + 'SeparationImpact'];
      if (growthJudgements[edge + 'Growth'] < SIGNIFICANT_EDGE_PIXEL_GROWTH ||
          separationImpact < SIGNIFICANT_SEPARATION_IMPACT) {
        return 0;
      }
      return separationImpact;
    }

    // "Bad growth" is growth in a direction after there was already visual separation in that direction.
    // For example, a child element has right padding, and the parent element grows to the right over that.
    // It is more likely that choosing the child element is correct, because it was already a distinct visual unit.
    $.extend(growthJudgements, {
      badGrowthTop: getBadGrowth('top'),
      badGrowthBottom: getBadGrowth('bottom')
    });

    // Judge categories of growth
    growthJudgements.large2dGrowth =
      // Significantly larger both horizontally and vertically when compared with the first non-inline candidate.
      // This is rarely good. It generally means we're in a group of visual groups.
      // If we don't have this rule, we tend to pick very large containers that are used for 2d layout.
      // Do not do this punishment if the child was very small for picking, because this rule
      // is all about preferring reasonable child containers over those that are too big.
      // Only need moderate horizontal growth -- things tend to be wider than they are tall.
      // Also, by requiring extreme vertical growth we don't fire as much when the first non-inline was a single line of text.
      childJudgements &&
      !childJudgements.percentOfViewportHeightUnderIdealMin &&
      !childJudgements.percentOfViewportWidthUnderIdealMin &&
      growthJudgements.totalHorizGrowthFactor > MODERATE_GROWTH_FACTOR &&
        growthJudgements.totalVertGrowthFactor > EXTREME_GROWTH_FACTOR &&
        growthJudgements.totalHorizGrowthFactor * growthJudgements.totalVertGrowthFactor;

    $.extend(growthJudgements, {
      // Moderate one dimensional growth often means the parent is just stretching to cover a little more
      // information. For example, adding a thumbnail or a caption. This is good for the parent and bad for the child.
      // This rule is used to give the child a penalty.
      // If we don't have this rule we tend to miss attaching supplemental information such as captions.
      isModeratelySmallerThanParentInOneDimension:
        !growthJudgements.large2dGrowth && (
          (
            (firstTraits.isVisualMedia || traits.normDisplay.indexOf('inline') < 0) &&
            // A little horizontal growth but none vertically
            growthJudgements.parentHorizGrowthFactor < MODERATE_GROWTH_FACTOR &&
            growthJudgements.parentHorizGrowthFactor > VERY_SMALL_GROWTH_FACTOR &&
            growthJudgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR) ||
          // Or:
          // A little vertical growth but none horizontally
          (//traits.normDisplay !== 'block' && // Why? Broke captions
            growthJudgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR &&
            growthJudgements.parentVertGrowthFactor > VERY_SMALL_GROWTH_FACTOR &&
            growthJudgements.parentHorizGrowthFactor < VERY_SMALL_GROWTH_FACTOR)
         ),

      // Similar rule, used to give the parent a bonus:
      // This is a good thing, we are just encompassing a little more information such as an image or caption.
      // If we don't have this rule we tend to miss attaching supplemental information such as captions.
      isModeratelyLargerThanChildInOneDimension:
        childJudgements && childJudgements.isModeratelySmallerThanParentInOneDimension,

      // Growing much larger horizontally is generally a bad thing unless the original item was an image.
      // This is often a horizontal row of cells -- better to pick the smaller cells.
      isLargeWidthExpansion: growthJudgements.totalHorizGrowthFactor > EXTREME_GROWTH_FACTOR &&
                             !firstTraits.isVisualMedia
    });

    // Roughly the same size if the total growth is less than a threshold
    growthJudgements.isRoughlySameSizeAsChild = growthJudgements.topGrowth +
      growthJudgements.bottomGrowth + growthJudgements.leftGrowth + growthJudgements.rightGrowth < ROUGHLY_SAME_SIZE_THRESHOLD;

    return growthJudgements;
  }

  // Heuristics to see if something looks like a cell/box based on box coordinate information.
  // By cell, we mean a box-shaped container of related information.
  // We call it a cell because it's generally grouped in rows and/or columns.
  // It is not necessarily a table cell.
  function getCellLayoutJudgements(node, judgements, traits, parentTraits, childJudgements, firstNonInlineTraits) {
    var cellLayoutJudgements = {};
    // Is any descendant of the candidate already a cell?
    // If yes, avoid picking this candidate because it's likely a super container.
    cellLayoutJudgements.isAncestorOfCell =
      !! (childJudgements &&
         (childJudgements.isAncestorOfCell ||
          childJudgements.isCellInCol ||
          childJudgements.isCellInRow));

    // Is any descendant of the candidate already a cell and the candidate is much wider than the cell?
    // If yes, avoid picking this candidate because it's probably a row of cells.
    cellLayoutJudgements.isWideAncestorOfCell = cellLayoutJudgements.isAncestorOfCell &&
      traits.percentOfViewportWidth > IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH;

    cellLayoutJudgements.isCellInCol = false;
    cellLayoutJudgements.isCellInRow = false;
    cellLayoutJudgements.hasSimilarSiblingCells = false;
    cellLayoutJudgements.hasUniformlySizedSiblingCells = false;

    function isPossibleCell() {

      var numSiblings = parentTraits.childCount;
      // Need multiple children
      if (numSiblings === 1) {
        return false;
      }

      // Avoid parents of existing cells
      if (cellLayoutJudgements.isAncestorOfCell) {
        return false;
      }
      // Avoid certain tags
      if (UNLIKELY_CELL_TAGS.hasOwnProperty(traits.tag)) {
        return false;
      }

      // Avoid inline blocks
      // Are we sure about this rule?
      if (traits.normDisplay === 'inline-block') {
        return false;
      }

      // If area grows too much for the number of children
      if (numSiblings === 2) {
        var parentAreaGrowthSibling1 = traits.parentHorizGrowthFactor * traits.parentVertGrowthFactor,
          parentAreaGrowthSibling2 = 1 / (1 - 1/parentAreaGrowthSibling1),
          maxParentAreaGrowth = 2 * MAX_CELL_GROUP_GROWTH_PER_SIBLING;
        if (parentAreaGrowthSibling1 > maxParentAreaGrowth ||
          parentAreaGrowthSibling2 > maxParentAreaGrowth) {
          return false;
        }
        if (node.parentNode.getElementsByTagName('img').length === 1) {
          return false; // Only one image -- this usually means it's an image with a caption
        }
      }

      // Do almost all of the siblings have the same tag name?
      var $parent = $(node).parent(),
        numSiblingsSameTag = $parent.children(traits.tag).length,
        numSiblingsOtherTagAllowed = Math.min(2, Math.floor(numSiblingsSameTag * 0.33));
      if (numSiblingsSameTag < numSiblings - numSiblingsOtherTagAllowed) {
        return false;
      }

      return true;
    }

    if (isPossibleCell()) {
      var isComplex = traits !== firstNonInlineTraits,
        hasExactWidthSiblingCells = true,
        hasExactHeightSiblingCells = true,
        siblingsToTry = $(node).children(),
        numSiblingsToTest = siblingsToTry.length;

      // Look for similar widths because heights can vary when the amount of text varies
      if (numSiblingsToTest < 2) {
        hasExactWidthSiblingCells = hasExactHeightSiblingCells = false;
      }
      else {
        var MAX_SIBLINGS_TO_TEST = 5;
        // At least two siblings to test
        $(siblingsToTry).each(function (index, sibling) {
          var rect = traitcache.getRect(sibling);
          if (rect.width !== traits.fullWidth) {
            hasExactWidthSiblingCells = false;
            return false;
          }
          if (rect.height !== traits.rect.height) {
            hasExactHeightSiblingCells = false;
            return false;
          }
          if (index > MAX_SIBLINGS_TO_TEST) {
            return false;
          }
        });
      }

      // If it is a float, is it a float to create an appearance of cells in a row?
      // We judge this as true if:
      // - The parent height growth is relatively small, and
      // - The parent width growth is large
      // Note: often the parent row is a lot taller than the current candidate,
      // so we have to be a little forgiving on parent height growth.
      // Do we look like a cell in a column of cells?
      cellLayoutJudgements.isCellInCol = judgements.parentHorizGrowthFactor < VERY_SMALL_GROWTH_FACTOR &&      // Approx. same width
        judgements.parentVertGrowthFactor > COLUMN_VERT_GROWTH_THRESHOLD &&       // Large vertical growth
        traits.percentOfViewportHeight < IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT &&
        // Either the parent has other large cells or this cell is large
        (parentTraits.visualHeightAt1x > MIN_AVERAGE_COLUMN_CELL_HEIGHT * Math.min(12, parentTraits.childCount)) &&
        traits.visualHeightAt1x > MIN_COLUMN_CELL_HEIGHT &&
        ((hasExactHeightSiblingCells && hasExactWidthSiblingCells) || isComplex ||
          judgements.vertSeparationImpact > SIGNIFICANT_SEPARATION_IMPACT);

      // Do we look like a cell in a row of cells?
      cellLayoutJudgements.isCellInRow =
        (
          // Standard cell rules
          judgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR &&
          judgements.parentHorizGrowthFactor > ROW_HORIZ_GROWTH_THRESHOLD &&      // Large horizontal growth
          traits.percentOfViewportWidth < IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH &&
          judgements.horizSeparationImpact > SIGNIFICANT_SEPARATION_IMPACT
        ) ||
        (
        // Also try floating cell-in-row rule
          parentTraits && traits.style.float !== 'none' && traits.style.float !== parentTraits.style.float &&
          // Narrow row -- make sure height of candidate cell is nearly the height of the row
          ((judgements.parentVertGrowthFactor < SMALL_GROWTH_FACTOR &&
            judgements.parentHorizGrowthFactor > ROW_HORIZ_GROWTH_THRESHOLD) ||
            // Wide row -- more forgiving about height of cell compared with row
            (judgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR &&
              judgements.parentHorizGrowthFactor > EXTREME_GROWTH_FACTOR))
         );

      cellLayoutJudgements.hasUniformlySizedSiblingCells =
        (cellLayoutJudgements.isCellInRow && hasExactHeightSiblingCells) ||
        (cellLayoutJudgements.isCellInCol && hasExactHeightSiblingCells);
    }

    return cellLayoutJudgements;
  }

  // DOM judgements
  // Judgements based on the DOM, including tags, roles and hierarchical relationships.
  // Note: authors do not always use semantics in a reasonable way. Because of this, we do not
  // weigh the use of grouping tags and roles very highly.
  function getDOMStructureJudgements(judgements, traits, childJudgements, childTraits, node, index) {
    var domJudgements = {
      isGreatTag: GREAT_TAGS.hasOwnProperty(traits.tag),
      isGoodTag: GOOD_TAGS.hasOwnProperty(traits.tag),
      isGoodRole: GOOD_ROLES.hasOwnProperty(traits.role),
      isHeading: HEADING_TAGS.hasOwnProperty(traits.tag),
      badParents: $(node).parents(BAD_PARENTS_SELECTOR).length,
      horizontalListDescendantWidth: childJudgements ?
        (childJudgements.listAndMenuFactor < 0 ? childTraits.percentOfBodyWidth : childJudgements.horizontalListDescendantWidth) :
        0,
      listAndMenuFactor: !judgements.isAncestorOfCell && getListAndMenuFactor(node, traits, judgements),
      isFormControl: elemClassifier.isFormControl(node),
      // Being grouped with a single image indicates something is likely good to pick
      isGroupedWithImage: traits.visualHeightAt1x > MIN_IMAGE_GROUP_HEIGHT &&
        (index < MAX_ANCESTOR_INDEX_IMAGE_GROUP || childJudgements.isGroupedWithImage) &&
        isGroupedWithImage(traits, node, index),
      // A child candidate was considered a section start container
      isAncestorOfSectionStartContainer:
        childJudgements && (childJudgements.isSectionStartContainer || childJudgements.isAncestorOfSectionStartContainer),
      // Avoid picking things like hero images or ancestors of them
      isWideMediaContainer:
        (childJudgements !== null && childJudgements.isWideMediaContainer) ||
        (traits.isVisualMedia && traits.percentOfViewportWidth > MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH),
      // A divided group should be avoided. Rather, the subgroups should be picked.
      // Avoid picking the current candidate if it is divided by a heading or separator in the middle, because
      // it is probably an ancestor of smaller useful groups.
      numElementsDividingContent: (childJudgements && childJudgements.numElementsDividingContent) || numElementsDividingContent(node)
    };

    // A container that begins with a heading or dividing element is likely a good item to pick
    // Don't check if it's a section-start-container when it's an ancestor of another section start container,
    // unless the parent is about the same size as the child
    domJudgements.isSectionStartContainer = (!domJudgements.isAncestorOfSectionStartContainer ||
      judgements.isRoughlySameSizeAsChild) &&
      isSectionStartContainer(node) && getLeafElements(node).length > 1;

    domJudgements.isHeadingContentPair =
      domJudgements.isSectionStartContainer &&
      !domJudgements.isAncestorOfSectionStartContainer &&
      traits.childCount === 2; // A heading grouped with a single item

    domJudgements.isParentOfOnlyChild = traits.childCount === 1;

    return domJudgements;
  }

  // Is the content divided into 2 or more sections?
  // IOW, is there a heading/hr in the middle of it rather than just at the start?
  // This will return true even if there is something before the heading that is not grouped with <header>.
  function numElementsDividingContent(container) {
    // Find descendants which start a section
    var $dividingElements = $(container).find(SECTION_START_SELECTOR),

      // Get the last dividing element
      $lastDividingElement = $dividingElements.last();

    if (!$lastDividingElement.length) {
      return 0;  // No dividing element
    }

    var
      // Get the dividing element we want to test
      // We use the last one that's not at the very end
      testDividingElement = $lastDividingElement[0] === container || $.contains(container, $lastDividingElement[0]) ?
        $dividingElements.get($dividingElements.length - 1) : $lastDividingElement,

      // Go up from last dividing element, to find the topmost dividing element.
      // This protects against nested dividing elements confusing us.
      parentSectionStart = $(testDividingElement).parentsUntil(container,SECTION_START_SELECTOR),

      // Starting point
      currentAncestor = (parentSectionStart.length ? parentSectionStart : $lastDividingElement)[0],

      // Used in while loop
      sibling,
      $sibling;

    if ($(currentAncestor).parents(BAD_PARENTS_SELECTOR).length) {
      return 0; // Bad parent of dividing element
    }

    // Go up from starting point to see if a non-section-start exists before it in the container.
    while (currentAncestor && currentAncestor !== container) {
      sibling = currentAncestor.parentNode.firstElementChild;

      // Look at all the siblings before the currentAncestor
      while (sibling && sibling !== currentAncestor) {
        $sibling = $(sibling);
        if (!$sibling.is(SECTION_START_SELECTOR) &&
          !$sibling.is(':empty') &&
          !traitcache.isHidden(sibling, true) &&
          !isSectionStartContainer(sibling) &&
          !isVisualMediaSubtree(sibling)) {
          // A visible non-section-start element exists before the section-start-element, which means we are divided!
          // Return the number of section start elements
          return $dividingElements.length;
        }
        sibling = sibling.nextElementSibling;
      }
      currentAncestor = currentAncestor.parentElement;
    }
    return 0;
  }

  // Return true if visual media or the only contents are visual media
  function isVisualMediaSubtree(container) {
    if (elemClassifier.isVisualMedia(container)) {
      return true;
    }
    var leaves = getLeafElements(container);
    return leaves.length === 1 && elemClassifier.isVisualMedia(leaves[0]);
  }

  function getLeafElements(node) {
    return $(node).find('*').filter(function() {
      return this.childElementCount === 0;
    });
  }

    // Should we even consider this node or not?
  function isUsable(traits) {
    // Don't use inlines unless they are images or other visual media
    return (traits.normDisplay !== 'inline' || traits.isVisualMedia) &&
      !UNUSABLE_TAGS.hasOwnProperty(traits.tag) &&
      !UNUSABLE_ROLES.hasOwnProperty(traits.role);
  }

  // Menubars are bad
  // Vertical lists and menus are good
  // This attempts to provide a scoring factor for all of these similar objects
  // 0 if not a list
  // -1 if a horizontal list
  // +1 if a vertical list
  // Score is multiplied by LINK_LIST_FACTOR if a list of 3 or more links
  // Score is multiplied by OUT_OF_FLOW_LIST_FACTOR if an absolutely positioned list
  function getListAndMenuFactor(node, traits, judgements) {
    var listItems = $(node).children('li,[role|="menuitem"]'), // Also matches menuitemradio, menuitemcheckbox
      links =  getLinks(node),
      numListItems = listItems.length,
      numLinks = links.length,
      isListOfLinks;

    function getLinks(node) {
      // First check for simple <a> direct children
      var links = $(node).children('a');
      if (links.length) {
        return links;
      }
      // If none, return <li> with a single <a> element child
      return $(node).children('li').filter(function (index, elem) {
        return elem.childElementCount === 1 && elem.firstElementChild.localName === 'a';
      });
    }

    function isMultiLine() {
      return (parseFloat(traits.style.lineHeight * 1.5) || parseFloat(traits.style.fontSize * 2)) < traits.visualHeightAt1x;
    }

    if (traits.tag !== 'ul' && traits.role !== 'menu') {
      // Still check for horizontal link arrangement
      if (numLinks < 3 || judgements.totalVertGrowthFactor > 1.5 || isMultiLine() || !isArrangedHorizontally(links)) {
        return 0; // Only 1-2 links or is not horizontal -- fine either way
      }
      // At least 3 horizontal links -- really bad
      return -numLinks;
    }

    if (numListItems < 2) {
      return 0;  // Need multiple items
    }

    isListOfLinks = numListItems > 2 &&
      numLinks === numListItems; // Same number of links as <li>

    return (isListOfLinks ? LINK_LIST_FACTOR : 1) * (judgements.isOutOfFlow ? OUT_OF_FLOW_LIST_FACTOR: 1) *
      (isArrangedHorizontally(listItems) ? -numListItems : 1);
  }

  function isArrangedHorizontally(items) {
    var rect1 = traitcache.getRect(items[0]),
      rect2 = traitcache.getRect(items[items.length - 1]);
    // If left sides line up we are vertical
    return rect1.top === rect2.top && rect1.left < rect2.left;
  }

  // Groups of related content often pair an image with text -- this is a noticeable pattern, e.g. on news sites
  function isGroupedWithImage(traits, node) {
    if (traits.childCount === 0 || traits.childCount > MAX_CHILDREN_IMAGE_GROUP) {
      return false;  // If too many siblings this doesn't fit the pattern
    }
    var images = $(node).find('img'),
      numGoodImages = 0,
      minSide = SIGNIFICANT_IMAGE_PIXELS * traitcache.getCachedViewSize().zoom;

    $(images).each(function() {
      var imageRect = traitcache.getRect(this);
      // Hidden or separator images don't count
      if (imageRect.width > minSide && imageRect.height > minSide) {
        ++numGoodImages;
      }
    });

    return numGoodImages === 1 && getLeafElements(node).length > 1; // Must be paired with something else
  }

  // If the element a divider (such as <hr>), return it's thickness, otherwise return 0
  function getDividerThickness(node, side, validSideMin, validSideMax) {
    if ($(node).is(DIVIDER_SELECTOR)) {
      // Some images can be dividers as well, we will check the height and width
      // Is divider element: return the height
      var rect = traitcache.getRect(node),
        zoom = traitcache.getCachedViewSize().zoom,
        height = rect.height / zoom,
        width = rect.width / zoom;
      if (rect[side] >= validSideMin && rect[side] <= validSideMax &&  // Must be within these ranges
        (height < SEPARATOR_IMAGE_PIXEL_THRESHOLD) !== (width < SEPARATOR_IMAGE_PIXEL_THRESHOLD)) { // Must be thin (vert or horiz)
        return Math.min(height, width);
      }
    }
    return 0;
  }

  // Check first rendered descendant element to see if it's a heading, or any element
  // typically used to start a new section
  function isSectionStartContainer(node) {
    var child = node.firstElementChild;

    if (child && elemClassifier.isVisualMedia(child)) {
      child = child.nextElementSibling;  // Images are neutral, check the next thing
    }

    if (!child) {
      return false;
    }
    if ($(child).is(SECTION_START_SELECTOR)) {
      return true; // It's the start of a section (heading, etc.), separator, image of separator (long and thin)
    }
    return isSectionStartContainer(child); // Recurse ... keep checking first child nodes
  }

  // Magic formula that provides a number for how impactful the margin, padding and border are for a given edge
  function getSeparationImpact(separation, borderWidth) {
    var separationImpact = Math.min(Math.pow(separation / SEPARATION_DIVISOR, SEPARATION_IMPACT_POWER), MAX_SPACE_SEPARATION_IMPACT),
      borderImpact = Math.min(borderWidth * BORDER_WIDTH_BONUS, MAX_BORDER_SEPARATION_IMPACT);

    return separationImpact + borderImpact;
  }


  // Position: absolute/fixed and rect sticks out from parent (not wholly encompassed by it)
  function isOutOfFlow(node, traits, parentTraits) {
    if (traits.style.position !== 'absolute' && traits.style.position !== 'fixed') {
      return false;
    }

    if (traits.childCount === 0 && $(node).is(':empty')) {
      return false;  // These empty absolutely positioned elements are strange. Seem to be there to capture clicks only
    }

    // Return true if we stick out from parent
    var parentRect = parentTraits.rect,
      thisRect = traits.rect;

    return thisRect.left < parentRect.left ||
      thisRect.top < parentRect.top ||
      thisRect.right > parentRect.right ||
      thisRect.bottom > parentRect.bottom;
  }

  // Also considered to have it's own background if the item before or after does,
  // because many times colors are alternated by even/odd row
  function hasSiblingBackground(element, parentStyle, tag) {
    var sibling = element.previousElementSibling || element.nextElementSibling,
      hasSiblingBg = sibling && $(sibling).is(tag + ':not(:empty)') &&
      common.hasOwnBackground(sibling, traitcache.getStyle(sibling), parentStyle);
    return !!hasSiblingBg;
  }

  // Get the traits of the first non-inline element as we go up ancestor chain, because
  // inlines don't provide valuable bounding boxes for the judgement calculations.
  // At index 0 = original event target, index 1 is the parent of that, 2 is the grandparent, etc.
  // Non-inline includes block, table-cell, etc.
  function getTraitsOfFirstNonInlineCandidate(traitStack) {
    var index = 0, displayStyle, length = traitStack.length;
    for (; index < length; index++) {
      displayStyle = traitStack[index].normDisplay;
      if (displayStyle !== 'inline' && displayStyle !== 'inline-block') {
        return traitStack[index];
      }
    }
    return traitStack[0];
  }

  return {
    getJudgementStack: getJudgementStack,
    provideCustomJudgements: provideCustomJudgements
  };
});
