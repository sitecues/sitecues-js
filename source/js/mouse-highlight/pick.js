/*
 * This module determines the set of elements to highlight, given a starting element.
 *
 * Rough stages:
 * 1. Check for cached results
 * 2. Check for custom rules
 * 3. Get candidate with best score, as follows:
 *    Start element ->
 *      Candidate ancestors ->
 *        Traits (basic info for each candidate, such as bounding boxes, margins, style)->
 *          Judgements (heuristics to judge characteristics) ->
 *            Basic scores (sum of judgements * weights) ->
 *              Score refinement part 1 (single parents are heavily impacted by their children) ->
 *                 Final result
 *`
 * In this process we compute store the following arrays:
 * candidates -- an array of candidate nodes
 *          The 0th item is always the original event target, #1 is the parent, #2, grandparent, etc.
 * traitStack
 *       -- an array of corresponding traits for each node
 * judgementStack
 *       -- an array of corresponding judgements for each node (depends on traits to be computed)
 *
 * For more details see https://equinox.atlassian.net/wiki/display/EN/Picker+v2+Architecture
 */

sitecues.def('mouse-highlight/picker', function(picker, callback) {
  'use strict';
  sitecues.use('jquery', 'util/common', 'conf',
               'mouse-highlight/traitcache', 'mouse-highlight/traits', 'mouse-highlight/judge',
               function($, common, conf, traitcache, traits, judge) {

    var UNUSABLE_SCORE = -99999,       // A score so low there is no chance of picking the item
      MAX_ANCESTORS_TO_ANALYZE = 14,   // Maximum ancestors to climb looking for start.
      MIN_SCORE_TO_PICK = -100,        // If nothing above this, will pick nothing
      // In order of precedence:
      PICK_RULE_DISABLE = 'disable', // don't pick this anything -- not this item, any ancestor, or any descendant
      PICK_RULE_PREFER = 'prefer',   // pick this item
      PICK_RULE_IGNORE = 'ignore',   // don't pick this item
      // The following weights are used to multiple each judgement of the same name, defined in judgements.js
      // The score is a sum of these weights * judgements
      // Public in order to allow customizations
      judgementWeights = {
        isGreatTag: 13,
        isGoodTag: 3,
        isGoodRole: 8,
        badParents: -10,
        listAndMenuFactor: 18,
        hasHorizontalListDescendant: -15,
        isGroupedWithImage: 15,
        isFormControl: 20,
        hasOwnBackground: 20,
        hasSiblingBackground: 5,
        hasRaisedZIndex: 20,
        hasDescendantWithRaisedZIndex: -50,
        isOutOfFlow: 15,
        hasDescendantOutOfFlow: UNUSABLE_SCORE,
        vertSeparationImpact: 0.8,
        horizSeparationImpact: 0.8,
        percentOfViewportHeightUnderIdealMin: -0.5,
        percentOfViewportHeightOverIdealMax: -2,
        percentOfViewportWidthUnderIdealMin: -0.7,
        percentOfViewportWidthOverIdealMax: -0.5,
        nearBodyWidthFactor: -1,
        tinyHeightFactor: -3,
        tinyWidthFactor: -5,
        isExtremelyTall: UNUSABLE_SCORE,
        badGrowthTop: -0.5,
        badGrowthBottom: -0.5,
        large2dGrowth: -1,
        isModeratelySmallerThanParentInOneDimension: -20,
        isModeratelyLargerThanChildInOneDimension: 20,
        isCellInRow: 15,
        isCellInCol: 15,
        hasExactWidthSiblingCells: 15,
        hasSimilarSiblingCells: 15,
        isSectionStartContainer: 25,
        isDividedInHalf: -8,
        isAncestorOfCell: -5,
        isWideAncestorOfCell: -10,
        isLargeWidthExpansion: -10,
        isWideMediaContainer: UNUSABLE_SCORE
      },
      REFINEMENT_WEIGHTS = {
        isParentOfOnlyChild: .25  // Done in separate stage after WEIGHTS used
      },
      MAX_VISUAL_BOX_CHECK_SIZE = 400,  // We try to highlight even over whitespace if cursor is within a box of this size or less
      customSelectors = { // Inject selectors via customization modules
        //prefer: "[selector]",
        //ignore: "[selector]",
        //disable: "[selector]"
      },
      isDebuggingOn,
      lastPicked;

    /*
     * ----------------------- PUBLIC -----------------------
     *
     * MAIN FUNCTION AND ENTRY POINT
     * Find the best highlightable element, if any, given a target element.
     * Returns JQuery object if anything picked, otherwise null (never returns JQuery object of length 0)
     *
     * @param hover The element the mouse is hovering over
     */
    picker.find = function find(startElement) {
      var ancestors, candidates, picked;

      // 1. Don't pick anything in the sitecues UI
      if (common.isInSitecuesUI(startElement) || $(startElement).is('html,body')) {
        return null;
      }

      // 1.5. If over a map, use associated image element for processing
      if (startElement.localName === 'area') {
        startElement = getImageForMapArea(startElement);
      }

      // 2. Reset trait cache
      traitcache.resetCache();

      // 3. Get candidate nodes that could be picked
      ancestors = $.makeArray($(startElement).parentsUntil('body'));
      candidates = [startElement].concat(ancestors);

      // 4. Don't pick anything when over whitespace
      //    Avoids slow, jumpy highlight, and selecting ridiculously large containers
      if (!hasVisibleContent(candidates)) {
        return null;
      }

      // 5. Get deterministic result
      //    a) from customizations or
      //    b) previously stored picker results
      picked = getDeterministicResult(candidates);
      if (picked !== null) {
        return picked[0] ? picked : null;
      }

      // 6. Get result from heuristics
      picked = getHeuristicResult(candidates);

      // 7. Save results for next time
      lastPicked = picked;

      return picked ? $(picked) : null;
    };

    function getImageForMapArea(element) {
      var mapName = $(element).closest('map').attr('name'),
        imageSelector = 'img[usemap="#' + mapName + '"]';
      return mapName ? $(imageSelector)[0] : null;
    }

    // --------- Deterministic results ---------

    // A deterministic result is a hard rule for picking a specific element,
    // or for picking nothing when the element is an ancestor.
    // Ways a deterministic result can occur:
    // 1) A customization via provideCustomSelectors() e.g. { disable:"[selector]", prefer: "[selector]" }
    // 2) HTML attribute @data-sc-pick on the element itself ('prefer' or 'disable') -- see PICK_RULE_FOO constants
    function getDeterministicResult(candidates) {
      // 1. Check customizations
      var picked = getCustomizationResult(candidates);
      if (picked) {
        return picked;
      }

      // 2. Check @data-sc-pick (markup-specified rule)
      return getPickRuleResult(candidates);
    }

    function getPickRuleResult(candidates) {
      var picked = null;

      function checkPickRuleForElement(item) {
        var pickRule = $(item).attr('data-sc-pick');
        if (pickRule === PICK_RULE_DISABLE) {
          picked = $(); // Don't pick anything in this chain
        }
        else if (pickRule === PICK_RULE_PREFER) {
          picked = $(item);
        }
        // Else keep going
      }

      // Check @data-sc-pick for values in PICK_RULE_DISABLE or PICK_RULE_PREFER
      candidates.some(checkPickRuleForElement);

      return picked;
    }

    // Return a jQuery object with a result determined from customizations,
    // or null if no customization applies.
    function getCustomizationResult(candidates) {
      var picked, $candidates = $(candidates);

      // 1. Customizations in picker.disable = "[selector]";
      if (customSelectors.disable && $candidates.is(customSelectors.disable)) {
        return $(); // Customization result: pick nothing here
      }

      // 2. Customizations in picker.prefer = "[selector]";
      if (customSelectors.prefer) {
        picked = $candidates.filter(customSelectors.prefer).first();
        if (picked.length) {
          return picked;  // Customization result: pick this item
        }
      }

      return null;  // No customization result
    }


    // --------- Heuristic results ---------

    /**
     * Return JQuery collection representing element(s) to highlight
     * Can return empty collection if there are no appropriate elements.
     * Uses a scoring system for each candidate.
     */
    function getHeuristicResult(candidates) {
      // 1. Limit the number of candidate nodes we analyze (for performance)
      var restrictedCandidates = candidates.slice(0, MAX_ANCESTORS_TO_ANALYZE);

      // 2. Get traits -- basic info such as tag, role, style, coordinates
      var traitStack = traits.getTraitStack(restrictedCandidates);

      // 3. Get judgements -- higher level concepts from hand-tweaked logic
      var judgementStack = judge.getJudgementStack(traitStack, restrictedCandidates);

      // 4. Get the best choice
      return getBestCandidate(traitStack, judgementStack, restrictedCandidates);
    }

    function isUsable(element, judgements) {
      // If no judgements exist, the candidate was already marked as unusable by the judgements system
      if (!judgements.isUsable) {
        return false;
      }
      // Check custom selectors
      if (customSelectors.ignore && $(element).is(customSelectors.ignore)) {
        return false;
      }
      // Check data attribute
      if (element.getAttribute('data-sc-pick') === PICK_RULE_IGNORE) {
        return false;
      }
      return true;
    }

    function getBestCandidate(traitStack, judgementStack, candidates) {
      // 1. Get scores for candidate nodes
      function getScore(judgements, index) {
        return computeScore(judgements, candidates[index], index);
      }
      var scoreObjs = judgementStack.map(getScore);

      // 2. Parents of only children are strongly influenced by that child
      refineScoresForParentsOfSingleChild(traitStack, scoreObjs);

      // 3. Get the best candidate
      var bestIndex = getCandidateWithHighestScore(scoreObjs);

      // 4. Log the results if necessary for debugging
      if (SC_DEV && isDebuggingOn) {
        sitecues.use('mouse-highlight/pick-debug', function(pickDebug) {
          // Use sitecues.togglePickerDebugging() to turn on the logging
          pickDebug.logHeuristicResult(scoreObjs, bestIndex, traitStack, judgementStack, candidates);
        });
      }

      // 5. Return item, or nothing if score was too low
      return scoreObjs[bestIndex].score < MIN_SCORE_TO_PICK ? null : candidates[bestIndex];
    }

    if (SC_DEV) {
      // Placeholder used by 'debug' customization
      picker.logResults = function () {
      };
    }

    // Get the score for the candidate node at the given index
    function computeScore(judgements, element, index) {
      // 1. Check if usable: if item is not usable mark it as such
      // TODO give each isUsable() a different name

      if (!isUsable(element, judgements)) {
        return {
          score: UNUSABLE_SCORE,
          factors: [],                                             // Debug info
          about: 'Ancestor #' + index + '. Unusable/ignored',      // Debug info
          isUsable: false
        };
      }

      // 2. Compute score: add up judgements * weights
      var factorKey, value, scoreDelta, weight,
        scoreObj = {
          score: 0,
          factors: [],                  // Debug info
          about: 'Ancestor #' + index,  // Debug info
          isUsable: true
        };

      for (factorKey in judgementWeights) {
        if (judgementWeights.hasOwnProperty(factorKey)) {
          value = judgements[factorKey];
          weight = judgementWeights[factorKey];
          scoreDelta = value * weight;  // value is a numeric or boolean value: for booleans, JS treats true=1, false=0
          scoreObj.score += scoreDelta;
          if (SC_DEV) {
            scoreObj.factors.push({
              about: factorKey,
              value: value,
              weight: weight,
              impact: scoreDelta
            });
          }
        }
      }

      return scoreObj;
    }

    function getCandidateWithHighestScore(scoreObjs) {
      var index,
          bestScore = scoreObjs[0].score,
          bestScoreIndex = 0;

      for (index = 1; index < scoreObjs.length; index ++) {
        if (scoreObjs[index].score > bestScore) {
          bestScore = scoreObjs[index].score;
          bestScoreIndex = index;
        }
      }

      return bestScoreIndex;
    }

    //  ----------- Score refinement section -----------

    // For every single parent, add child's score to the parent * (singleParentRefinement weight)
    // A parent is likely to be even more right/wrong than its child
    // Therefore the child's goodness reflects on the parent. We add it's score to the parent score.
    // The benefits of doing this are that if there is a container of child node that has no siblings,
    // we tend to prefer the container over the child. If the child is bad, we tend to pick neither.
    function refineScoresForParentsOfSingleChild(traitStack, scoreObjs) {
      var index, delta;
      for (index = 1; index < traitStack.length - 1; index ++ ) {
        if (traitStack[index].childCount === 1 && scoreObjs[index-1].isUsable) {
          delta = scoreObjs[index - 1].score;
          scoreObjs[index].score += delta * REFINEMENT_WEIGHTS.isParentOfOnlyChild;
          if (SC_DEV) {
            scoreObjs[index].factors.push({
              about: 'singleParentRefinement',    // Debug info
              value: delta,
              weight: REFINEMENT_WEIGHTS.isParentOfOnlyChild
            });
          }
        }
      }
    }

    function hasVisibleContent(candidates) {
      // First check for direct visible text nodes
      if (common.hasVisibleContent(candidates[0])) {
        return true;
      }

      // Otherwise, see if we are inside of a box
      var index = 0,
        candidate,
        rect,
        style,
        zoom = conf.get('zoom');
      for (; index < candidates.length; index ++) {
        candidate = candidates[index];
        if (lastPicked && $.contains(candidate, lastPicked)) {
          break; // Once we've picked a sub-box inside a box, we want to avoid skipping to larger box when over whitespace
        }
        rect = traitcache.getRect(candidate);
        style = traitcache.getStyle(candidate);
        if (rect.width / zoom > MAX_VISUAL_BOX_CHECK_SIZE ||
          rect.height / zoom > MAX_VISUAL_BOX_CHECK_SIZE) {
          break;  // Don't check any more
        }
        if (common.isVisualRegion(candidate, style, traitcache.getStyle(candidate.parentNode))) {
          return true;
        }
      }

      return false;
    }

    // -------------- Customizations ----------------------
    // See https://equinox.atlassian.net/wiki/display/EN/Picker+hints+and+customizations

    // This is a hook for customization scripts, which can add their own judgements by overriding this method.
    picker.provideCustomSelectors = function(selectors) {
      customSelectors = selectors;
    };

    // This is a hook for customization scripts, which can add their own judgements by overriding this method.
    // Weights can be changed for pre-existing or added for custom judgements
    // Pass in as { judgementName: weightValue, judgementName2: weightValue2, etc. }
    picker.provideCustomWeights = function(weights) {
      $.extend(judgementWeights, weights);
    };

    if (SC_DEV) {
      // --- For debugging ----------------------
      sitecues.pickFrom = function (element) {
        return picker.find(element);
      };

      sitecues.togglePickerDebugging = function() {
        isDebuggingOn = !isDebuggingOn;
      };
    }

    // ----------------------------------------
    if (SC_UNIT) {
      $.extend(exports, picker);
    }

    callback();
  });
});
