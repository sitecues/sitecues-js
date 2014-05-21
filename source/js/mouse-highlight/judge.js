/**
 * Retrieve judgements about the node. These are hand-crafted rules tweaked over time.
 * Inputs: 1) candidate nodes and 2) their traits
 *
 * Example of judgements for a node:
 * - Does it use a good tag or role?
 * - Does it define its own interesting background?
 * - What is the visual impact of the spacing/border around its edges?
 * - Does it look like a cell in row or column?
 * - Did it grow a lot larger compared with the previous item?
 */

sitecues.def('mouse-highlight/judge', function(judge, callback) {
  'use strict';
  sitecues.use('jquery', 'util/common', function($, common) {

    // ----------- PUBLIC  ----------------
    judge.getJudgementStack = function (traitStack, nodeStack) {
      var baseIndex = getBaseIndex(traitStack),
        judgementStack = [],
        belowJudgements = null;

      traitStack.forEach(function (traits, index) {
        var judgements;
        if (!isUsable(traits, nodeStack[index])) {
          judgements = null;
        }
        else {
          judgements = getJudgements(traitStack, index, baseIndex, nodeStack[index], belowJudgements);
          belowJudgements = judgements;
        }
        judgementStack.push(judgements);
      });

      return judgementStack;
    };

    // This is a hook for customization scripts, which can add their own judgements by overriding this method.
    // See https://equinox.atlassian.net/wiki/display/EN/Picker+hints+and+customizations
    judge.getCustomJudgements = function() { //judgements, traits, belowTraits, belowJudgements, aboveTraits, baseTraits, node, index) {
      return {};
    };

    // ------------ PRIVATE -------------

    function getJudgements(allTraits, index, baseIndex, node, belowJudgements) {
      var traits = allTraits[index],
        belowTraits = index > 0 ? allTraits[index - 1] : traits,  // For computing simplicity, always set (non-null)
        aboveTraits = index < allTraits.length - 1 ? allTraits[index + 1] : traits,  // "
        baseTraits = allTraits[baseIndex],
        judgements;

      judgements = getVisualSeparationJudgements(traits, belowTraits, aboveTraits);
      $.extend(judgements, getSizeJudgements(traits));
      $.extend(judgements, getGrowthJudgements(judgements, traits, belowTraits, aboveTraits, baseTraits, belowJudgements));
      $.extend(judgements, getCellLayoutJudgements(judgements, traits, belowTraits, belowJudgements));
      $.extend(judgements, getDOMStructureJudgements(judgements, traits, belowTraits, belowJudgements, node, index));
      $.extend(judgements, judge.getCustomJudgements(judgements, traits, belowTraits, belowJudgements, aboveTraits, baseTraits, node, index));

      return judgements;
    }

    // ** Semantic constants ***
    // For ARIA roles other tags could be used, but this is most likely and more performant than checking all possibilities
    var SECTION_START_SELECTOR = 'h1, h2, h3, h4, h5 h6, header, hr, dt, div[role="separator"],div[role="heading"]';
    var GREAT_TAGS = { blockquote:1, td:1, tr: 1, ul:1, ol: 1, menu:1, section: 1 };
    var GOOD_TAGS = { a:1, address:1, button:1, code:1, dl:1, fieldset:1, form:1, img:1, p:1, pre:1, li:1 };
    var SEMANTIC_TEXT_CONTAINING_TAGS =   // These are less likely to be used to layout a cell/box
      { a: 1, li: 1, ol: 1, ul: 1, p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1 };
    var UNUSABLE_TAGS = { area:1, base:1, basefont:1, bdo:1, br:1, col:1, colgroup:1, font:1, frame:1, iframe:1,
        legend:1, link:1, map:1, optgroup:1, option:1, tbody:1, tfoot:1, thead:1, object:1, embed:1 };
    var GOOD_ROLES = {list:1, region:1, complementary:1, dialog:1, alert:1, alertdialog:1, gridcell:1,
      tabpanel:1, tree:1, treegrid:1, listbox:1, img:1, heading:1, rowgroup:1, row:1, toolbar:1,
      menu:1, menubar:1, group:1, form:1, navigation:1, main:1 };
    var UNUSABLE_ROLES = { presentation:1, separator:1 };

    // ** Layout and geometrical constants ***
    var MAX_PERCENT_OF_VIEWPORT_HEIGHT = 250; // If larger than this, stop processing (saves time)
    var MIN_COLUMN_CELL_HEIGHT = 50;
    var IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT = 25;
    var IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT = 60;
    var IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH = 20;
    var IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH = 85;
    var MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH = 60;
    var MAX_PIXELS_CONSIDERED_TINY = 25;  // Anything smaller than this is considered a tiny element (or at least very thin)
    var SEPARATION_DIVISOR = 1.5;
    var SEPARATION_IMPACT_POWER = 1.4;  // Exponent for visual impact of whitespace
    var BORDER_WIDTH_BONUS = 10;
    var MAX_SEPARATION_IMPACT = 25;
    var SIGNIFICANT_AMOUNT_OF_PIXELS= 50;
    var SIGNIFICANT_SEPARATION = 7;
    var MIN_CELL_VERT_SEPARATION = 10;
    var EXTREME_GROWTH_FACTOR = 2.5; // If parent's height ratio of child is larger than this, we consider it significantly larger than child
    var MODERATE_GROWTH_FACTOR = 1.6; // An amount of growth that is significant but not huge
    var MIN_CELL_IN_COLUMN_VERT_GROWTH = 1.3;  // Sometimes there is a very small cell in a column of only 2 cells, we only require 30% larger
    var MIN_CELL_IN_ROW_HORIZ_GROWTH = 1.8; // Because text is horizontal, it is unlikely to have a narrow cell in a row. Generally rows will nearly double the size of the cell.
    var VERY_SMALL_GROWTH_FACTOR = 1.1;
    var SMALL_GROWTH_FACTOR = 1.2;
    var MAX_SIBLINGS_IMAGE_GROUP = 4;
    var MAX_ANCESTOR_INDEX_IMAGE_GROUP = 3;
    var MAX_ANCESTORS_IMAGE_GROUP = 4;
    var MAX_TOTAL_GROWTH_DOUBLE_MULTI_START_CONTAINER = 120;

    function getVisualSeparationJudgements(traits, aboveTraits) {
      var visualSeparationJudgements = {
        // Get a number that represents the visual impact of margin, padding, border
        topSeparationImpact: getSeparationImpact(traits.topSpacing, traits.topBorder),
        bottomSeparationImpact: getSeparationImpact(traits.bottomSpacing, traits.bottomBorder),
        leftSeparationImpact: getSeparationImpact(traits.leftSpacing, traits.leftBorder),
        rightSeparationImpact: getSeparationImpact(traits.rightSpacing, traits.rightBorder),

        // Check whether a CSS background creates a visual separation from the parent,
        // (for example, it has a different background-color or uses a background-image).
        // Don't include non-repeating sprites (positioned background images) -- these are used for bullets, etc.
        isNewBgContainer:
          (traits.style.backgroundColor !== aboveTraits.style.backgroundColor &&
            traits.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && traits.style.backgroundColor !== 'transparent') ||
          (traits.style.backgroundImage !== 'none' && traits.style.backgroundRepeat !== 'no-repeat')
      };

      // Total separation impact vertically (top/bottom) and horizontally (left/right)
      $.extend(visualSeparationJudgements, {
        vertSeparationImpact:
          Math.max(visualSeparationJudgements.topSeparationImpact, visualSeparationJudgements.bottomSeparationImpact),
        horizSeparationImpact:
          Math.max(visualSeparationJudgements.leftSeparationImpact, visualSeparationJudgements.rightSeparationImpact)
      });

      return visualSeparationJudgements;
    }

    function getSizeJudgements(traits) {
      return {
        tinyHeightFactor: // No tiny icons or images of vertical lines
          Math.max(0, MAX_PIXELS_CONSIDERED_TINY - traits.visualHeight),
        tinyWidthFactor: // No tiny icons or images of horizontal lines
          Math.max(0, MAX_PIXELS_CONSIDERED_TINY - traits.visualWidth),
        percentHeightUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT - traits.percentOfViewportHeight),
        percentHeightOverIdealMax: Math.max(0, traits.percentOfViewportHeight - IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT),
        percentWidthUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH - traits.percentOfViewportWidth),
        percentWidthOverIdealMax: Math.max(0, traits.percentOfViewportWidth - IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH)
      };
    }

    // Judge different types of growth:
    // - From a child candidate to the current candidate
    // - From the current candidate to its parent
    // - From the first candidate (baseTraits) to the current candidate
    function getGrowthJudgements(judgements, traits, belowTraits, aboveTraits, baseTraits, belowJudgements) {
      var growthJudgements = {
        // Ratio of sizes between objects
        baseHorizGrowthFactor: traits.visualWidth / baseTraits.visualWidth,
        baseVertGrowthFactor: traits.visualHeight / baseTraits.visualHeight,
        parentHorizGrowthFactor: aboveTraits.visualWidth / traits.visualWidth,
        parentVertGrowthFactor: aboveTraits.visualHeight / traits.visualHeight,
        childVertGrowthFactor: traits.visualHeight / belowTraits.visualHeight,
        childHorizGrowthFactor: traits.visualWidth / belowTraits.visualWidth,

        // Growth in particular direction
        topGrowth: belowTraits.unzoomedRect.top - traits.unzoomedRect.top,
        bottomGrowth: traits.unzoomedRect.bottom - belowTraits.unzoomedRect.bottom,
        leftGrowth: belowTraits.unzoomedRect.left - traits.unzoomedRect.left,
        rightGrowth: traits.unzoomedRect.right - belowTraits.unzoomedRect.right
      };

      // Growth in a direction after there was already visual separation in that direction.
      // For example, a child element has right padding, and the parent element grows to the right over that.
      // It is more likely that choosing the child element is correct, because it was already a distinct visual unit
      $.extend(growthJudgements, {
        badGrowthTop: // If our top is far above child's, and child already had good top separator, then child is probably it's own group
          belowJudgements ?
            (growthJudgements.topGrowth > SIGNIFICANT_AMOUNT_OF_PIXELS &&
            belowJudgements.topSeparationImpact > SIGNIFICANT_SEPARATION) * belowJudgements.topSeparationImpact : 0,
        badGrowthBottom: // Similar to badGrowthTop
          belowJudgements ?
            (growthJudgements.bottomGrowth > SIGNIFICANT_AMOUNT_OF_PIXELS &&
            belowJudgements.bottomSeparationImpact > SIGNIFICANT_SEPARATION) * belowJudgements.bottomSeparationImpact : 0,
        badGrowthLeft: // Similar to badGrowthTop
          belowJudgements ?
          (growthJudgements.leftGrowth > SIGNIFICANT_AMOUNT_OF_PIXELS &&
            belowJudgements.leftSeparationImpact > SIGNIFICANT_SEPARATION) * belowJudgements.leftSeparationImpact : 0,
        badGrowthRight: // Similar to badGrowthTop
          belowJudgements ?
          (growthJudgements.rightGrowth > SIGNIFICANT_AMOUNT_OF_PIXELS &&
            belowJudgements.rightSeparationImpact > SIGNIFICANT_SEPARATION) * belowJudgements.rightSeparationImpact : 0
      });

      // Type of growth
      $.extend(growthJudgements, {
        // Our child was already very tall, and we're even larger --
        // generally better to go with the child, it's already big, and the parent might be a group of groups
        isLargeGrowthOverTallChild: traits.percentOfViewportHeight > 100 &&
          belowTraits.percentOfViewportHeight > IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT &&
          growthJudgements.childVertGrowthFactor > EXTREME_GROWTH_FACTOR,

        // Significantly larger both horizontally and vertically when compared with the first block candidate.
        // This is rarely good. It generally means we're in a group of visual groups.
        // If we don't have this rule, we tend to pick containers that are used for 2d layout.
        isLarge2dGrowthFromBase: // Grew a lot in 2 directions from non-inline descendant
          (growthJudgements.baseHorizGrowthFactor > MODERATE_GROWTH_FACTOR &&
            growthJudgements.baseVertGrowthFactor > EXTREME_GROWTH_FACTOR),

        // Moderate one dimensional growth often means the parent is just stretching to cover a little more
        // information. For example, adding a thumbnail or a caption. This is good for the parent and bad for the child.
        // Rule used to give the child a penalty.
        // If we don't have this rule we tend to miss attaching supplemental information such as captions.
        isModerate1dGrowthIntoParent: // Probably not this as parent is just a little larger, this looks like a piece of the parent
          // Horizontal growth is very small to moderate, and vertical growth is very small
          (growthJudgements.parentHorizGrowthFactor < MODERATE_GROWTH_FACTOR &&
            growthJudgements.parentHorizGrowthFactor > VERY_SMALL_GROWTH_FACTOR &&
            growthJudgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR) ||
          // Or, vertical growth is very small to moderate, and horizontal growth is very small
          (growthJudgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR  &&
            growthJudgements.parentVertGrowthFactor > VERY_SMALL_GROWTH_FACTOR &&
            growthJudgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR),

        // Similar rule, used to give the parent a bonus:
        // This is a good thing, we are just encompassing a little more information such as an image or caption
        // If we don't have this rule we tend to miss attaching supplemental information such as captions.
        isModerate1dGrowthOverChild:
          belowJudgements && belowJudgements.isModerate1dGrowthIntoParent,

        // Growing much larger horizontally is generally a bad thing unless the original item was an image
        // This is often a horizontal row of cells -- better to pick the smaller cells.
        isLargeWidthExpansion: growthJudgements.baseHorizGrowthFactor > EXTREME_GROWTH_FACTOR &&
                               !baseTraits.isVisualMedia
      });

      return growthJudgements;
    }

    // Heuristics to see if something looks like a box based on box coordinate information
    function getCellLayoutJudgements(judgements, traits, belowTraits, belowJudgements) {
      var cellLayoutJudgements = {};
      // If it is a float, does it look like it's a float to create an appearance of cells?
      // We judge this as true if:
      // - The parent height growth is relatively small, and
      // - The parent width growth is large
      // Note: often the sibling cells are a lot taller, so we have to be a little forgiving on parent height growth
      cellLayoutJudgements.isFloatForCellLayout =
          traits.style.float !== 'none' && traits.style.display !== 'inline-block' &&
          (judgements.parentVertGrowthFactor < SMALL_GROWTH_FACTOR &&
            judgements.parentHorizGrowthFactor > MIN_CELL_IN_ROW_HORIZ_GROWTH) ||
          (judgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR &&
           judgements.parentHorizGrowthFactor > EXTREME_GROWTH_FACTOR);

      // Is anything below us already a cell?
      // If yes, we're unlikely to be the right choice.
      cellLayoutJudgements.isAncestorOfCell =
        belowJudgements !== null &&
        (belowJudgements.isAncestorOfCell ||
          belowJudgements.isFloatForColumnLayout ||
          belowJudgements.isCellInCol ||
          belowJudgements.isCellInRow ||
          belowTraits.tag === 'td' ||
          belowTraits.tag === 'tr');

      // Is something below us already a cell and we're much wider?
      // If yes, we're a terrible choice. We're probably a row of cells.
      cellLayoutJudgements.isWideAncestorOfCell =
        cellLayoutJudgements.isAncestorOfCell &&
        traits.percentOfViewportWidth > IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH &&
        judgements.baseHorizGrowthFactor > EXTREME_GROWTH_FACTOR;

      // Do we look like a cell in a column of cells?
      cellLayoutJudgements.isCellInCol =
          !cellLayoutJudgements.isAncestorOfCell && belowTraits.style.display !== 'inline' &&
          judgements.parentHorizGrowthFactor < VERY_SMALL_GROWTH_FACTOR &&      // Approx. same width
          judgements.parentVertGrowthFactor > MIN_CELL_IN_COLUMN_VERT_GROWTH &&       // Large vertical growth
          !SEMANTIC_TEXT_CONTAINING_TAGS.hasOwnProperty(traits.tag) &&  // Text, not a cell
          (traits.visHeight > MIN_COLUMN_CELL_HEIGHT) &&
          (traits.percentOfViewportHeight < IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT) &&
          (judgements.topSeparationImpact > MIN_CELL_VERT_SEPARATION ||
            judgements.bottomSeparationImpact > MIN_CELL_VERT_SEPARATION);

      // Do we look like a cell in a row of cells?
      cellLayoutJudgements.isCellInRow =
          !cellLayoutJudgements.isAncestorOfCell && belowTraits.style.display !== 'inline' &&
          traits.style.display !== 'inline-block' &&
          judgements.parentVertGrowthFactor < EXTREME_GROWTH_FACTOR &&
          judgements.parentHorizGrowthFactor > MIN_CELL_IN_ROW_HORIZ_GROWTH  &&      // Large horizontal growth
          (judgements.leftSeparationImpact = SIGNIFICANT_SEPARATION ||
            judgements.rightSeparationImpact > SIGNIFICANT_SEPARATION ||
            traits.style.float !== 'none');

      return cellLayoutJudgements;
    }

    // Simple DOM judgements
    // The tags and role may lie to us, so we don't necessarily score high for tags/roles
    // Being grouped with an image, or a heading at the beginning, are very good clues.
    // Being divided by a heading or separator in the middle indicates we are probably an ancestor smaller useful groups.
    function getDOMStructureJudgements(judgements, traits, belowTraits, belowJudgements, node, index) {
      return {
        isGreatTag: GREAT_TAGS.hasOwnProperty(traits.tag),
        isGoodTag: GOOD_TAGS.hasOwnProperty(traits.tag),
        isGoodRole: GOOD_ROLES.hasOwnProperty(traits.role),
        isGroupedWithImage: traits.visHeight > SIGNIFICANT_AMOUNT_OF_PIXELS &&
          isGroupedWithImage(traits, node, index),
        isSectionStartContainer: // Don't consider it a section start if we already were one and grew from that
          (!belowTraits.isSectionStartContainer || judgements.topGrowth +
            judgements.bottomGrowth + judgements.leftGrowth + judgements.rightGrowth < MAX_TOTAL_GROWTH_DOUBLE_MULTI_START_CONTAINER) &&
          isSectionStartContainer(node),
        isDivided: isDivided(node),
        isWideMediaContainer:
          (belowJudgements !== null && belowJudgements.isWideMediaContainer) ||   // We don't generally want to pick the hero image or any ancestor of it
          (traits.isVisualMedia && traits.percentOfViewportWidth > MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH)
      };
    }

    // Should we even consider this node or not?
    function isUsable(traits) {
      // role="presentation" means never pick the item -- it is purely decorative
      // Don't use inlines (if we can eventually highlight them well, we may use them if they are formatted on their own line like a block)i
      return (traits.style.display !== 'inline' || traits.isVisualMedia) &&
        !UNUSABLE_ROLES.hasOwnProperty(traits.role) && !UNUSABLE_TAGS.hasOwnProperty(traits.tag) &&
        traits.percentOfViewportHeight < MAX_PERCENT_OF_VIEWPORT_HEIGHT;
    }

    // Groups of related content often pair an image with text -- this is a noticeable pattern, e.g. on news sites
    function isGroupedWithImage(traits, node, ancestorIndex) {
      var images;
      if (traits.childCount === 0 || traits.childCount > MAX_SIBLINGS_IMAGE_GROUP) {
        return false;  // If too many siblings this doesn't fit the pattern
      }
      if (ancestorIndex > MAX_ANCESTOR_INDEX_IMAGE_GROUP) {
        return false;  // Higher up in element tree -- benefit of doing this check is not worth cost
      }
      images = node.getElementsByTagName('img'); // Fastest
      if (images.length !== 1) {
        return false; // No images or multiple images: doesn't fit the pattern
      }

      return $(images[0]).parentsUntil(node).length < MAX_ANCESTORS_IMAGE_GROUP;
    }

    // Check first rendered descendant element to see if it's a heading, or any element
    // typically used to start a new section
    function isSectionStartContainer(node) {
      var child = node.firstElementChild;

      if (!child) {
        return false;
      }
      if ($(child).is(SECTION_START_SELECTOR) || common.isVisualMedia(child)) {
        return true; // It's the start of a section (heading, etc.)
      }
      return isSectionStartContainer(child); // Recurse ... keep checking first child nodes
    }

    // Is the content divided into 2 or more sections?
    // IOW, is there a heading/hr in the middle of it rather than just at the start?
    function isDivided(container) {
      var dividingElements = $(container).find(SECTION_START_SELECTOR), // Find descendants which start a section
        lastSectionStart = dividingElements.get(dividingElements.length - 1), // Last section starting descendant
        parentSectionStart = $(lastSectionStart).parentsUntil(container).has(SECTION_START_SELECTOR),  // Go up from last section start, to find the topmost section grouping element
        currentAncestor = parentSectionStart.length ? parentSectionStart[0] : lastSectionStart, // Starting point
        sibling;

      // Go up section start to see if something exists before it in the container
      // that is not a section start
      while (currentAncestor && currentAncestor !== container) {
        sibling = currentAncestor.parentNode.firstElementChild;
        while (sibling && sibling !== currentAncestor) {
          if (!$(sibling).is(SECTION_START_SELECTOR) && !isSectionStartContainer(sibling)) {
            return true;  // Some other type of item than the selector comes before, which means we are divided!
          }
          sibling = sibling.nextElementSibling;
        }
        currentAncestor = currentAncestor.parentNode;
      }
      return false;
    }

    // Magic formula that provides a number for how impactful the margin, padding and border are for a given edge
    function getSeparationImpact(separation, borderWidth) {
      return Math.min(Math.pow(separation / SEPARATION_DIVISOR, SEPARATION_IMPACT_POWER),
        MAX_SEPARATION_IMPACT) + borderWidth * BORDER_WIDTH_BONUS;
    }

    // Get the index of the first non-inline containing rectangle as we go up ancestor chain
    // At index 0 = original event target, index 1 is the parent of that, 2 is the grandparent, etc.
    function getBaseIndex(traitStack) {
      var index, displayStyle;
      for (index = 0; index < traitStack.length; index++) {
        displayStyle = traitStack[index].style.display;
        if (displayStyle !== 'inline' && displayStyle !== 'inline-block') {
          return index;
        }
      }
      return 0;
    }
  });

  callback();
});