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

sitecues.def('mouse-highlight/judge', function(judge, callback) {
  'use strict';
  sitecues.use('jquery', 'util/common', 'mouse-highlight/traitcache', function($, common, traitcache) {

    // ----------- PUBLIC  ----------------

    // Get a judgement for each node
    // The judgements, traits and nodes all correlate, such that index 0 of each array
    // stores information for the first candidate node, index 1 is the parent, etc.
    // When the node is unusable, judgements is set to null, rather than wasting cycles calculating the judgements.
    judge.getJudgementStack = function (traitStack, nodeStack) {
      var firstNonInlineTraits = getTraitsOfFirstNonInlineCandidate(traitStack),
        childJudgements = null,
        childTraits = traitStack[0],  // For simplicity of calculations, not allowed to be null
        numCandidates = traitStack.length;

      // Return the judgements for the candidate at the given index
      // Return null if the candidate is unusable
      function mapJudgements(traits, index) {
        var judgements = null, node = nodeStack[index], parentTraits;
        if (isUsable(traits, node)) {
          parentTraits = index < numCandidates - 1 ? traitStack[index + 1] : traits;
          judgements = getJudgements(parentTraits, traits, childTraits, firstNonInlineTraits, node, childJudgements, index);
          childJudgements = judgements;
          childTraits = traits;
        }
        return judgements;
      }

      return traitStack.map(mapJudgements);
    };

    // This is a hook for customization scripts, which can add their own judgements by overriding this method.
    // Pass in as { judgementName: fn(), judgementName2: fn2(), etc. }
    // Parameters to judgement functions are:
    //   judgements, traits, belowTraits, belowJudgements, parentTraits, firstNonInlineTraits, node, index
    // For each judgement, a weight of the same name must exist.
    judge.provideCustomJudgements = function(judgements) {
      customJudgements = judgements;
    };

    // ------------ PRIVATE -------------

    function getJudgements(parentTraits, traits, childTraits, firstNonInlineTraits, node, childJudgements, index) {
      var judgementGetter,
        judgements = getVisualSeparationJudgements(traits, parentTraits);

      $.extend(judgements, getSizeJudgements(traits));
      $.extend(judgements, getGrowthJudgements(traits, childTraits, parentTraits, firstNonInlineTraits, childJudgements));
      $.extend(judgements, getCellLayoutJudgements(judgements, traits, childTraits, childJudgements));
      $.extend(judgements, getDOMStructureJudgements(judgements, traits, childJudgements, node, index));

      for (judgementGetter in customJudgements) {
        if (customJudgements.hasOwnProperty(judgementGetter)) {
          $.extend(judgements, judgementGetter(judgements, traits, childTraits, childJudgements, parentTraits, firstNonInlineTraits, node, index));
        }
      }

      return judgements;
    }

    // ** Semantic constants ***
    // For ARIA roles other tags could be used, but this is most likely and more performant than checking all possibilities
    var SECTION_START_SELECTOR = 'h1,h2,h3,h4,h5,h6,header,hr,dt,div[role="separator"],div[role="heading"]',
      GREAT_TAGS = { blockquote:1, td:1, tr: 1, ul:1, ol: 1, menu:1, section: 1 },
      GOOD_TAGS = { a:1, address:1, button:1, code:1, dl:1, fieldset:1, form:1, img:1, p:1, pre:1, li:1 },
      // These are less likely to be used to layout a cell/box
      UNLIKELY_CELL_TAGS = { a: 1, ol: 1, ul: 1, p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1 },
      UNUSABLE_TAGS = { area:1, base:1, basefont:1, bdo:1, br:1, col:1, colgroup:1, font:1, frame:1, iframe:1,
        legend:1, link:1, map:1, optgroup:1, option:1, tbody:1, tfoot:1, thead:1, object:1, embed:1 },
      GOOD_ROLES = {list:1, region:1, complementary:1, dialog:1, alert:1, alertdialog:1, gridcell:1,
      tabpanel:1, tree:1, treegrid:1, listbox:1, img:1, heading:1, rowgroup:1, row:1, toolbar:1,
      menu:1, menubar:1, group:1, form:1, navigation:1, main:1 },
      UNUSABLE_ROLES = { presentation:1, separator:1 },

      // ** Layout and geometrical constants ***
      MAX_PERCENT_OF_VIEWPORT_HEIGHT = 250,        // If larger than this, stop processing (saves time)
      MIN_COLUMN_CELL_HEIGHT = 50,                 // If fewer pixels than this, don't consider it to be a cell in a column
      IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT = 25,   // Smaller than this is bad
      IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT = 60,   // Larger than this is bad
      IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH = 20,    // Smaller than this is bad
      IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH = 85,    // Larger than this is bad
      MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH = 60,    // Media larger than this is bad
      IDEAL_MAX_PERCENT_OF_BODY_WIDTH = 85,        // If this percent or more of body width, it's bad. We don't like picking items almost as wide as body.
      NEAR_BODY_WIDTH_IMPACT_POWER = 2,            // Exponent for impact of being close to body's width
      TINY_ELEMENT_PIXEL_THRESHOLD = 25,           // Anything smaller than this is considered a tiny element (or at least very thin)
      SEPARATION_DIVISOR = 1.5,                    // The number of spacing pixels will be divided by this in separation impact algorithm
      SEPARATION_IMPACT_POWER = 1.4,               // Exponent for visual impact of whitespace
      MAX_SEPARATION_IMPACT = 25,                  // The maximum impact of whitespace, for a given edge
      BORDER_WIDTH_BONUS = 10,                     // Bonus points for each pixel of border width
      SIGNIFICANT_EDGE_PIXEL_GROWTH = 50,          // Number of pixels of growth on a side that likely means additional content is encompassed on that side
      SIGNIFICANT_SEPARATION_IMPACT = 7,           // Amount of separation impact on a side that clearly shows a visual separation
      MIN_CELL_VERT_SEPARATION = 10,               // Amount of separation impact required above or below an object before we consider a possible cell in a column.
      EXTREME_GROWTH_FACTOR = 2.5,                 // If parent's height ratio of child is larger than this, we consider it significantly larger than child
      MODERATE_GROWTH_FACTOR = 1.6,                // An amount of growth that is significant but not huge
      COLUMN_VERT_GROWTH_THRESHOLD = 1.3,          // Sometimes there is a very small cell in a column of only 2 cells. We only require that the column be 30% taller than the cell
      ROW_HORIZ_GROWTH_THRESHOLD = 1.8,            // Because text is horizontal, it is unlikely to have a narrow cell in a row. Generally the row width will be nearly 2x the cell width.
      VERY_SMALL_GROWTH_FACTOR = 1.1,
      SMALL_GROWTH_FACTOR = 1.2,
      MIN_IMAGE_GROUP_HEIGHT = 100,                // Image groups must be taller than this
      MAX_CHILDREN_IMAGE_GROUP = 4,                // If more children than this, it does not typically fit the pattern of an image group, so don't do the expensive check
      MAX_ANCESTOR_INDEX_IMAGE_GROUP = 3,          // If ancestor index is larger than this, it does not typically fit the pattern of an image group, so don't do the expensive check
      ROUGHLY_SAME_SIZE_THRESHOLD = 120,           // If parent grows by fewer pixels than this, it is considered roughly the same size as the child
      customJudgements = {};

    function getVisualSeparationJudgements(traits, parentTraits) {
      var visualSeparationJudgements = {
        // Get a number that represents the visual impact of margin, padding, border
        topSeparationImpact: getSeparationImpact(traits.topSpacing, traits.topBorder),
        bottomSeparationImpact: getSeparationImpact(traits.bottomSpacing, traits.bottomBorder),
        leftSeparationImpact: getSeparationImpact(traits.leftSpacing, traits.leftBorder),
        rightSeparationImpact: getSeparationImpact(traits.rightSpacing, traits.rightBorder),

        // Check whether a CSS background creates a visual separation from the parent,
        // (for example, it has a different background-color or uses a background-image).
        // Don't include non-repeating sprites (positioned background images) -- these are used for bullets, etc.
        hasOwnBackground: hasOwnBackground(traits, parentTraits)
      };

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

    function getSizeJudgements(traits) {
      return {
        // Avoid picking tiny icons or images of vertical lines
        tinyHeightFactor: Math.max(0, TINY_ELEMENT_PIXEL_THRESHOLD - traits.visualHeight),

        // Avoid picking tiny icons or images of horizontal lines
        tinyWidthFactor: Math.max(0, TINY_ELEMENT_PIXEL_THRESHOLD - traits.visualWidth),

        // We have a concept of percentage of viewport width and height, where under or over the ideal is not good.
        // Avoid picking things that are very small or large, which are awkward in the HLB according to users.
        percentOfViewportHeightUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_HEIGHT - traits.percentOfViewportHeight),
        percentOfViewportHeightOverIdealMax: Math.max(0, traits.percentOfViewportHeight - IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT),
        percentOfViewportWidthUnderIdealMin: Math.max(0, IDEAL_MIN_PERCENT_OF_VIEWPORT_WIDTH - traits.percentOfViewportWidth),
        percentOfViewportWidthOverIdealMax: Math.max(0, traits.percentOfViewportWidth - IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH),
        nearBodyWidthFactor: Math.pow(Math.max(0, traits.percentOfBodyWidth - IDEAL_MAX_PERCENT_OF_BODY_WIDTH), NEAR_BODY_WIDTH_IMPACT_POWER)
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
    function getGrowthJudgements(traits, childTraits, parentTraits, firstNonInlineTraits, childJudgements) {
      var growthJudgements = {
        // Ratio of sizes between objects

        // Comparison with first non-inline candidate.
        // This is the first element can provide useful size to compare with.
        totalHorizGrowthFactor: traits.visualWidth / firstNonInlineTraits.visualWidth,
        totalVertGrowthFactor: traits.visualHeight / firstNonInlineTraits.visualHeight,

        // Comparison with the parent
        parentHorizGrowthFactor: parentTraits.visualWidth / traits.visualWidth,
        parentVertGrowthFactor: parentTraits.visualHeight / traits.visualHeight,

        // Comparison with the child
        childVertGrowthFactor: traits.visualHeight / childTraits.visualHeight,
        childHorizGrowthFactor: traits.visualWidth / childTraits.visualWidth,

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
        badGrowthBottom: getBadGrowth('bottom'),
        badGrowthLeft: getBadGrowth('left'),
        badGrowthRight: getBadGrowth('right')
      });

      // Judge categories of growth
      $.extend(growthJudgements, {
        // Significantly larger both horizontally and vertically when compared with the first non-inline candidate.
        // This is rarely good. It generally means we're in a group of visual groups.
        // If we don't have this rule, we tend to pick containers that are used for 2d layout.
        // Only need moderate horizontal growth -- things tend to be wider than they are tall.
        // Also, by requiring extreme vertical growth we don't fire as much when the first non-inline was a single line of text.
        isLarge2dGrowth:
          (growthJudgements.totalHorizGrowthFactor > MODERATE_GROWTH_FACTOR &&
            growthJudgements.totalVertGrowthFactor > EXTREME_GROWTH_FACTOR),

        // Moderate one dimensional growth often means the parent is just stretching to cover a little more
        // information. For example, adding a thumbnail or a caption. This is good for the parent and bad for the child.
        // This rule is used to give the child a penalty.
        // If we don't have this rule we tend to miss attaching supplemental information such as captions.
        isModeratelySmallerThanParentInOneDimension:
          // Horizontal growth: very small to moderate
          // Vertical growth: very small
          (growthJudgements.parentHorizGrowthFactor < MODERATE_GROWTH_FACTOR &&
            growthJudgements.parentHorizGrowthFactor > VERY_SMALL_GROWTH_FACTOR &&
            growthJudgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR) ||
          // Or:
          // Vertical growth: very small to moderate
          // Horizontal growth: very small
          (growthJudgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR  &&
            growthJudgements.parentVertGrowthFactor > VERY_SMALL_GROWTH_FACTOR &&
            growthJudgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR),

        // Similar rule, used to give the parent a bonus:
        // This is a good thing, we are just encompassing a little more information such as an image or caption.
        // If we don't have this rule we tend to miss attaching supplemental information such as captions.
        isModeratelyLargerThanChildInOneDimension:
          childJudgements && childJudgements.isModeratelySmallerThanParentInOneDimension,

        // Growing much larger horizontally is generally a bad thing unless the original item was an image.
        // This is often a horizontal row of cells -- better to pick the smaller cells.
        isLargeWidthExpansion: growthJudgements.totalHorizGrowthFactor > EXTREME_GROWTH_FACTOR &&
                               !firstNonInlineTraits.isVisualMedia
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
    function getCellLayoutJudgements(judgements, traits, childTraits, childJudgements) {
      var cellLayoutJudgements = {};
      // Is any descendant of the candidate already a cell?
      // If yes, avoid picking this candidate because it's likely a super container.
      // TODO We may want to be more forgiving of parents of real table cells when they are used in
      //      data tables, where the cell is a small object. In this case the user may wish to read an
      //      entire table or table row all at once in the HLB. We need to do more UX testing and research
      //      with regards to data tables.
      cellLayoutJudgements.isAncestorOfCell = childJudgements &&
        (childJudgements.isAncestorOfCell ||
          childJudgements.isFloatForColumnLayout ||
          childJudgements.isCellInCol ||
          childJudgements.isCellInRow ||
          childTraits.tag === 'td' ||
          childTraits.tag === 'tr');

      // Is any descendant of the candidate already a cell and the candidate is much wider than the cell?
      // If yes, avoid picking this candidate because it's probably a row of cells.
      cellLayoutJudgements.isWideAncestorOfCell = cellLayoutJudgements.isAncestorOfCell &&
        traits.percentOfViewportWidth > IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH;

      cellLayoutJudgements.isFloatForCellLayout = false;
      cellLayoutJudgements.isCellInCol = false;
      cellLayoutJudgements.isCellInRow = false;

      function isPossibleCell() {
        // Avoid parents of existing cells
        if (cellLayoutJudgements.isAncestorOfCell) {
          return false;
        }
        // Avoid certain tags
        if (UNLIKELY_CELL_TAGS.hasOwnProperty(traits.tag)) {
          return false;
        }

        // Avoid inline blocks
        if (traits.normDisplay === 'inline-block') {
          return false;
        }

        return true;
      }

      if (isPossibleCell()) {
        // If it is a float, is it a float to create an appearance of cells in a row?
        // We judge this as true if:
        // - The parent height growth is relatively small, and
        // - The parent width growth is large
        // Note: often the parent row is a lot taller than the current candidate,
        // so we have to be a little forgiving on parent height growth.
        cellLayoutJudgements.isFloatForCellLayout = traits.style.float !== 'none' &&
          // Narrow row -- make sure height of candidate cell is nearly the height of the row
          (judgements.parentVertGrowthFactor < SMALL_GROWTH_FACTOR &&
            judgements.parentHorizGrowthFactor > ROW_HORIZ_GROWTH_THRESHOLD) ||
          // Wide row -- more forgiving about height of cell compared with row
          (judgements.parentVertGrowthFactor < MODERATE_GROWTH_FACTOR &&
            judgements.parentHorizGrowthFactor > EXTREME_GROWTH_FACTOR);

        // Do we look like a cell in a column of cells?
        cellLayoutJudgements.isCellInCol = judgements.parentHorizGrowthFactor < VERY_SMALL_GROWTH_FACTOR &&      // Approx. same width
          judgements.parentVertGrowthFactor > COLUMN_VERT_GROWTH_THRESHOLD &&       // Large vertical growth
          traits.visualHeight > MIN_COLUMN_CELL_HEIGHT &&
          traits.percentOfViewportHeight < IDEAL_MAX_PERCENT_OF_VIEWPORT_HEIGHT &&
          judgements.vertSeparationImpact > MIN_CELL_VERT_SEPARATION;

        // Do we look like a cell in a row of cells?
        cellLayoutJudgements.isCellInRow = judgements.parentVertGrowthFactor < VERY_SMALL_GROWTH_FACTOR &&
          judgements.parentHorizGrowthFactor > ROW_HORIZ_GROWTH_THRESHOLD &&      // Large horizontal growth
          traits.percentOfViewportWidth < IDEAL_MAX_PERCENT_OF_VIEWPORT_WIDTH &&
          judgements.horizSeparationImpact > SIGNIFICANT_SEPARATION_IMPACT;
      }

      return cellLayoutJudgements;
    }

    // DOM judgements
    // Judgements based on the DOM, including tags, roles and hierarchical relationships.
    // Note: authors do not always use semantics in a reasonable way. Because of this, we do not
    // weigh the use of grouping tags and roles very highly.
    function getDOMStructureJudgements(judgements, traits, childJudgements, node, index) {
      var domJudgements = {
        isGreatTag: GREAT_TAGS.hasOwnProperty(traits.tag),
        isGoodTag: GOOD_TAGS.hasOwnProperty(traits.tag),
        isGoodRole: GOOD_ROLES.hasOwnProperty(traits.role),
        isFormControl: common.isFormControl(node),
        // Being grouped with a single image indicates something is likely good to pick
        isGroupedWithImage: traits.visualHeight > MIN_IMAGE_GROUP_HEIGHT && isCandidateGroupedWithImage(traits, node, index),
        // A child candidate was considered a section start container
        isAncestorOfSectionStartContainer: childJudgements && (childJudgements.isSectionStartContainer || childJudgements.isAncestorOfSectionStartContainer),
        // A divided group should be avoided. Rather, the subgroups should be picked.
        // Avoid picking the current candidate if it is divided by a heading or separator in the middle, because
        // it is probably an ancestor of smaller useful groups.
        isDivided: isDivided(node),
        // Avoid picking things like hero images or ancestors of them
        isWideMediaContainer:
          (childJudgements !== null && childJudgements.isWideMediaContainer) ||
          (traits.isVisualMedia && traits.percentOfViewportWidth > MEDIA_MAX_PERCENT_OF_VIEWPORT_WIDTH)
      };

      // A container that begins with a heading or dividing element is likely a good item to pick
      // Don't check if it's a section-start-container when it's an ancestor of another section start container,
      // unless the parent is about the same size as the child
      domJudgements.isSectionStartContainer = (!domJudgements.isAncestorOfSectionStartContainer ||
        judgements.isRoughlySameSizeAsChild) &&
        isSectionStartContainer(node);

      return domJudgements;
    }

    // Should we even consider this node or not?
    function isUsable(traits) {
      // Don't use inlines unless they are images or other visual media
      // Don't use bad tags or roles
      // Don't use items that are too tall
      return (traits.normDisplay !== 'inline' || traits.isVisualMedia) &&
        !UNUSABLE_ROLES.hasOwnProperty(traits.role) &&
        !UNUSABLE_TAGS.hasOwnProperty(traits.tag) &&
        traits.percentOfViewportHeight < MAX_PERCENT_OF_VIEWPORT_HEIGHT;
    }

    // Groups of related content often pair an image with text -- this is a noticeable pattern, e.g. on news sites
    function isCandidateGroupedWithImage(traits, node, ancestorIndex) {
      var images;
      if (traits.childCount === 0 || traits.childCount > MAX_CHILDREN_IMAGE_GROUP) {
        return false;  // If too many siblings this doesn't fit the pattern
      }
      if (ancestorIndex > MAX_ANCESTOR_INDEX_IMAGE_GROUP) {
        return false;  // Relatively high up in element tree. The benefit of doing this check is not worth cost.
      }
      images = node.getElementsByTagName('img'); // Faster than querySelectorAll()
      return images.length === 1;   // No images or multiple images: doesn't fit the pattern
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
    // This will return true even if there is something before the heading that is not grouped with <header>.
    function isDivided(container) {
      // Find descendants which start a section
      var dividingElements = $(container).find(SECTION_START_SELECTOR),

        // Get the last dividing element
        lastDividingElement = dividingElements.last(),

        // Go up from last dividing element, to find the topmost dividing element.
        // This protects against nested dividing elements confusing us.
        parentSectionStart = $(lastDividingElement).parentsUntil(container).filter(SECTION_START_SELECTOR),

        // Starting point
        currentAncestor = (parentSectionStart.length ? parentSectionStart : lastDividingElement)[0],

        // Used in while loop
        sibling,
        $sibling;

      // Go up from starting point to see if a non-section-start exists before it in the container.
      while (currentAncestor && currentAncestor !== container) {
        sibling = currentAncestor.parentNode.firstElementChild;

        // Look at all the siblings before the currentAncestor
        while (sibling && sibling !== currentAncestor) {
          $sibling = $(sibling);
          if (!$sibling.is(SECTION_START_SELECTOR) && !isSectionStartContainer(sibling) &&
            !$sibling.is(':empty') && traitcache.getStyleProp(sibling, 'display') !== 'none') {
            return true;  // A visible non-section-start element exists before the section-start-element, which means we are divided!
          }
          sibling = sibling.nextElementSibling;
        }
        currentAncestor = currentAncestor.parentNode;
      }
      return false;
    }

    // Magic formula that provides a number for how impactful the margin, padding and border are for a given edge
    function getSeparationImpact(separation, borderWidth) {
      return Math.min(Math.pow(separation / SEPARATION_DIVISOR, SEPARATION_IMPACT_POWER) + borderWidth * BORDER_WIDTH_BONUS,
        MAX_SEPARATION_IMPACT) ;
    }

    function isTransparentColor(color) {
      return color === 'transparent' || color.match(/^rgba.*0\)$/);
    }

    function hasOwnBackground(traits, parentTraits) {
      // 1. Background colors
      var bgColor = traits.style.backgroundColor;
      if (bgColor !== parentTraits.style.backgroundColor && !isTransparentColor(bgColor)) {
        return true;
      }

      // 2. Background images (sprites don't count -- often used for things like bullets)
      return (traits.style.backgroundImage !== 'none' && traits.style.backgroundRepeat !== 'no-repeat');
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

    if (SC_UNIT) {
      exports.getJudgementStack = judge.getJudgementStack;
    }
  });

  callback();
});