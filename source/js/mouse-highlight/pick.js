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
 * nodes -- an array of candidate nodes
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

    var pickedItemsCache = {},
      UNUSABLE_SCORE = -99999,    // A score so low there is no chance of picking the item
      MAX_ANCESTORS_TO_ANALYZE = 9,  // Maximum ancestors to climb looking for start. Up to 9 would be nicer in a few cases but might be causing perf issues in IE.
      MIN_SCORE_TO_PICK = -100,      // If nothing above this, will pick nothing
      // In order of precedence:
      PICK_RULE_DISABLE = 'disable', // don't pick this anything -- not this item, any ancestor, or any descendant
      PICK_RULE_PREFER = 'prefer',   // pick this item
      PICK_RULE_IGNORE = 'ignore',   // don't pick this item
      // The following weights are used to multiple each judgement of the same name, defined in judgements.js
      // The initialScore is a sum of these weights * judgements
      // Public in order to allow customizations
      judgementWeights = {
        isGreatTag: 13,
        isGoodTag: 5,
        isGoodRole: 8,
        isGroupedWithImage: 10,
        isDivided: -10,
        isNewBgContainer: 20,
        vertSeparationImpact: 1,
        horizSeparationImpact: 1,
        percentHeightUnderIdealMin: -.5,
        percentHeightOverIdealMax: -.7,
        percentWidthUnderIdealMin: -.5,
        percentWidthOverIdealMax: -.5,
        isLargeGrowthOverTallChild: -10,   // Maybe change to: is large growth over good rich child
        tinyHeightFactor: -3,
        tinyWidthFactor: -5,
        isFloatForCellLayout: 20,
        badGrowthTop: -1,
        badGrowthBottom: -1,
        badGrowthLeft: -1,
        badGrowthRight: -1,
        isLarge2dGrowth: -30,
        isModerate1dGrowthIntoParent: -8,
        isModerate1dGrowthOverChild: 8,
        isCellInRow: 15,
        isCellInCol: 15,
        isSectionStartContainer: 10,
        isAncestorOfCell: -5,
        isWideAncestorOfCell: -10,
        isLargeWidthExpansion: -10,
        isWideMediaContainer: UNUSABLE_SCORE
      },
      REFINEMENT_WEIGHTS = {
        isParentOfOnlyChild: .25  // Done in separate stage after WEIGHTS used
      },
      customJudgements = {},
      customSelectors = { // Inject selectors via customization modules
        //prefer: "[selector]",
        //ignore: "[selector]",
        //disable: "[selector]"
      };

    /*
     * MAIN FUNCTION AND ENTRY POINT
     * Find the best highlightable element, if any, given a target element.
     * Returns JQuery object if anything picked, otherwise null (never returns JQuery object of length 0)
     *
     * @param hover The element the mouse is hovering over
     */
    picker.find = function find(startElement) {
      var ancestors, candidates, picked;

      // 1. Don't pick anything in the sitecues UI
      if (common.isInSitecuesUI(startElement)) {
        return null;
      }

      // 2. Don't pick anything when over whitespace
      //    Avoids slow, jumpy highlight, and selecting ridiculously large containers
      if (!hasVisibleChildContent(startElement)) {
        return null;
      }

      // 3. Reset pick results cache if view has resized or zoom has changed,
      //    because some picks are dependent on the size of the item relative to the viewport.
      if (traitcache.checkViewHasChanged()) {
        resetPickedItemsCache();
      }

      // 4. Get candidate nodes that could be picked
      ancestors = $.makeArray($(startElement).parentsUntil(document.body));
      candidates = [startElement].concat(ancestors);

      // 5. Get deterministic result
      //    a) from customizations or
      //    b) previously stored picker results
      picked = getDeterministicResult(candidates);
      if (picked !== null) {
        return picked;
      }

      // 6. Get result from heuristics
      picked = getHeuristicResult(candidates);

      // 7. Save results in picked items cache for later reuse
      if (picked.length) {
        pickedItemsCache[traitcache.getUniqueId(picked[0])] = 1; // Set to anything, so that it's stored in the map
      }

      return picked.length? picked : null;
    };

    function isNonEmptyTextNode(node) {
      return node.nodeType === 3 /* Text node */ && node.data.trim() !== '';
    }

    function hasVisibleChildContent(current) {
      var children, index;
      if (common.isVisualMedia(current)) {
        return true;
      }

      // Check to see if there are non-empty child text nodes.
      // If there are, we say we're not over whitespace.
      children = current.childNodes;

      // Shortcut: could not have text children because all children are elements
      if (current.childElementCount === children.length) {
        return false;
      }

      // Longer check: see if any children are non-empty text nodes, one by one
      for (index = 0; index < children.length; index++) {
        if (isNonEmptyTextNode(children[index])) {
          return true;
        }
      }
      return false;
    }

    // --------- Deterministic results ---------

    // A deterministic result is a hard rule for picking a specific element,
    // or for picking nothing when the element is an ancestor.
    // Ways a deterministic result can occur:
    // 1) A customization in highlight.disable="[selector]" or highlight.prefer="[selector]"
    // 2) HTML attribute @data-sc-pick on the element itself ('prefer' or 'disable') -- see PICK_RULE_FOO constants
    // 3) The value of previous computations saved in the pickRuleCache
    function getDeterministicResult(candidates) {
      // 1. Check customizations
      var picked = getCustomizationResult(candidates);
      if (picked) {
        return picked;
      }

      // 2. Check pickRuleCache (previously stored results) and @data-sc-pick (markup-specified rule)
      return getPickRuleResult(candidates);
    }

    function getPickRuleResult(candidates) {
      var picked = null;

      function checkPickRuleForElement(item) {
        var pickRule = getPickRuleForElement(item);
        if (pickRule === PICK_RULE_DISABLE) {
          picked = $(); // Don't pick anything in this chain
        }
        else if (pickRule === PICK_RULE_PREFER) {
          picked = $(item);
        }
        else {
          return true; // Keep going
        }
      }

      // Check pickRuleCache and @data-sc-pick for values in PICK_RULE_DISABLE or PICK_RULE_PREFER
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
        picked = $candidates.has(customSelectors.prefer).first();
        if (picked.length) {
          return picked;  // Customization result: pick this item
        }
      }

      return null;  // No customization result
    }

    // The pick rule comes from markup, or from previously stored picker results in the picked items cache
    // See PICK_RULE_FOO constants for possible values
    function getPickRuleForElement(item) {
      var pickRule = $(item).attr('data-sc-pick'); // This attribute can be used to override everything
      if (!pickRule) {
        // Check pick rule cache, to see if this item has been previously picked
        var id = traitcache.getUniqueId(item);
        if (id && pickedItemsCache[id]) {
          pickRule = PICK_RULE_PREFER;
        }
      }
      return pickRule;
    }

    function resetPickedItemsCache() {
      pickedItemsCache = {};
    }

    // --------- Heuristic results ---------

    /**
     * Return JQuery collection representing element(s) to highlight
     * Can return empty collection if there are no appropriate elements.
     * Uses a scoring system for each candidate.
     */
    function getHeuristicResult(candidates) {
      // 1. Limit the number of candidate nodes we analyze (for performance)
      var nodes = candidates.slice(0, MAX_ANCESTORS_TO_ANALYZE);

      // 2. Get traits -- basic info such as tag, role, style, coordinates
      var traitStack = traits.getTraitStack(nodes);

      // 3. Get judgements -- higher level concepts from hand-tweaked logic
      var judgementStack = judge.getJudgementStack(traitStack, nodes, customJudgements);

      // 4. Get the best choice
      return getBestCandidate(traitStack, judgementStack, nodes);
    }

    function getBestCandidate(traitStack, judgementStack, nodes) {
      var scoreObjs, bestIndex;

      // 1. Get scores for candidate nodes
      scoreObjs = getInitialScores(judgementStack, nodes);

      // 2. Parents of only children are strongly influenced by that child
      refineScoresForParentsOfOneChild(traitStack, scoreObjs);

      // 3. Get the best candidate
      bestIndex = getCandidateWithHighestScore(scoreObjs);

      // 4. Log the results if necessary
      picker.logResults(scoreObjs, bestIndex, traitStack, judgementStack, nodes);

      // 5. Return item, or nothing if score was too low
      return scoreObjs[bestIndex].finalScore < MIN_SCORE_TO_PICK ? $() : $(nodes[bestIndex]);
    }

    // Placeholder used by 'debug' customization
    picker.logResults = function() { };

    // Get a score for each candidate node
    // Unusable nodes get UNUSABLE_SCORE -- a score so low it will never be picked
    function getInitialScores(judgementStack, nodes) {
      var index,
          scoreObj = null,
          allScoreObjs = [];

      for (index = 0; index < judgementStack.length; index ++) {
        // Check if node is usable
        if ((customSelectors.ignore && $(nodes[index]).is(customSelectors.ignore)) ||
             nodes[index].getAttribute('data-sc-pick') === PICK_RULE_IGNORE ||
             !judgementStack[index]) {
          scoreObj = {
            initialScore: UNUSABLE_SCORE,
            finalScore: UNUSABLE_SCORE,
            about: 'Ancestor #' + index + '. Ignored'  // Debug
          };
        }
        else {
          // Get the score for the candidate node at the given index
          scoreObj = computeInitialScore(judgementStack, index);
        }
        allScoreObjs.push(scoreObj);
      }
      return allScoreObjs;
    }

    // Get the score for the candidate node at the given index
    function computeInitialScore(judgementStack, index) {
      var judgements = judgementStack[index],
        factorKey, value, scoreDelta, weight,
        scoreObj = {
          initialScore: 0,
          finalScore: 0,
          info: [],
          about: 'Ancestor #' + index  // Debug
        };

      // Score = judgements * weights
      for (factorKey in judgementWeights) {
        if (judgementWeights.hasOwnProperty(factorKey)) {
          value = judgements[factorKey];
          weight = judgementWeights[factorKey];
          scoreDelta = value * weight;  // Numeric or Boolean value: JS treats true=1, false=0
          scoreObj.initialScore += scoreDelta;
          scoreObj.info.push({
            about: factorKey,
            value: value,
            weight: weight
          });
        }
      }

      // Temporary until we either reintroduce sibling vote code or decide to remove sibling vote concept.
      // Aaron to follow-up.
      scoreObj.finalScore = scoreObj.initialScore;

      return scoreObj;
    }

    function getCandidateWithHighestScore(scores) {
      var index,
          bestScore = scores[0].initialScore,
          bestScoreIndex = 0;

      for (index = 1; index < scores.length; index ++) {
        if (scores[index].initialScore > bestScore) {
          bestScore = scores[index].initialScore;
          bestScoreIndex = index;
        }
      }

      return bestScoreIndex;
    }

    //  ----------- Score refinement section -----------

    // For every single parent, add child's score to us
    // A parent is likely to be even more right/wrong than its child
    // Therefore the child's goodness reflects on the parent. We add it's score to the parent score.
    function refineScoresForParentsOfOneChild(traitStack, scoreObjs) {
      var index, delta;
      for (index = 1; index < traitStack.length - 1; index ++ ) {
        if (traitStack[index].childCount === 1 && scoreObjs[index-1].initialScore !== UNUSABLE_SCORE) {
          delta = scoreObjs[index - 1].initialScore;
          scoreObjs[index].initialScore += delta * REFINEMENT_WEIGHTS.isParentOfOnlyChild;
          scoreObjs[index].info.push({
            about: 'singleParentRefinement',
            value: delta,
            weight: REFINEMENT_WEIGHTS.isParentOfOnlyChild
          });
        }
      }
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

    // This is a hook for customization scripts, which can add their own judgements by overriding this method.
    // Pass in as { judgementName: fn(), judgementName2: fn2(), etc. }
    // Parameters to judgement functions are:
    //   judgements, traits, belowTraits, belowJudgements, parentTraits, firstNonInlineTraits, node, index
    // For each judgement, a weight of the same name must exist.
    picker.provideCustomJudgements = function(judgements) {
      customJudgements = judgements;
    };

    // --- For debugging ----------------------
    sitecues.pickFrom = function(element) {
      return picker.find(element);
    };
    // ----------------------------------------

    callback();
  });
});