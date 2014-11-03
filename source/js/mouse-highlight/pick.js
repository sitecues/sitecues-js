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
 *              Score thievery -- parents and children can steal from each other
 *                Leaf voting -- if there are several good choices allow the content to vote and make one decision for all
 *                  Final result
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
      MIN_ANCESTORS_TO_ANALYZE = 4,    // Three is enough -- after that, we can stop analyzing if things start to look unusable
      MAX_LEAVES_TO_VOTE = 5,          // Maximum number of leaves to vote
      SECOND_BEST_IS_VIABLE_THRESHOLD = 32, // 2nd best is viable if within this many points of best score
      MIN_SCORE_TO_PICK = -200,        // If nothing above this, will pick nothing
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
        isHeading: -8,
        badParents: -10,
        listAndMenuFactor: 18,
        horizontalListDescendantWidth: -0.6,
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
        percentOfViewportHeightOverIdealMax: -2.5,
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
        hasUniformlySizedSiblingCells: 15,
        hasSimilarSiblingCells: 15,
        isSectionStartContainer: 20,
        isHeadingContentPair: 20,  // Also steals from child
        isParentOfOnlyChild: 3, // Also steals from child
        numElementsDividingContent: -8,
        isAncestorOfCell: -10,
        isWideAncestorOfCell: -10,
        isLargeWidthExpansion: -10,
        isWideMediaContainer: UNUSABLE_SCORE
      },
      // When these judgements are not zero, part of the score transfers from a child to parent or vice vers
      // - If > 0, the parent steals this portion of the child's score
      // - In theory, if < 0, the child steals this portion of the parent's score
      //   We don't use this yet and need to make sure that a parent's score doesn't go up from the thievery
      // This is performed in separate stage after WEIGHTS used, and before voting
      THIEF_WEIGHTS = {
        isParentOfOnlyChild: 0.75,
        isHeadingContentPair: 0.75,
        isModeratelyLargerThanChildInOneDimension: 0.3
      },
      MAX_VISUAL_BOX_CHECK_SIZE = 400,  // We try to highlight even over whitespace if cursor is within a box of this size or less
      customSelectors = { // Inject selectors via customization modules
        //prefer: "[selector]",
        //ignore: "[selector]",
        //disable: "[selector]"
      },
      isDebuggingOn,
      isVoteDebuggingOn,
      isVotingOn,  // Temporarily off by default so we can see it's effect
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
      var candidates, picked;

      function processResult(result) {
        lastPicked = result && result[0];
        return result;
      }

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
      // Remove any ancestor that has the #sitecues-badge as a descendant
      candidates = getCandidates(startElement);

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
        return processResult(picked[0] ? picked : null);
      }

      // 6. Get result from heuristics taking into account votes from leaves of content
      picked = getHeuristicResult(candidates);

      // 7. Save results for next time
      lastPicked = picked;

      return processResult(picked ? $(picked) : null);
    };

    picker.reset = function() {
      lastPicked = null;
    };

    function getCandidates(startElement) {
      var allAncestors = $(startElement).parentsUntil('body'),
        validAncestors = allAncestors.not(allAncestors.has('#sitecues-badge'));
      if (lastPicked) {
        var isAncestorOfLastPicked = false;
        // Remove ancestors of the last picked item from possible selection
        // This improves picker consistency and improves performance (fewer elements to check)
        validAncestors = $(validAncestors).filter(function() {
          if (isAncestorOfLastPicked || $.contains(this, lastPicked)) {
            isAncestorOfLastPicked = true;
            return false; // Remove the element as it contains lastPicked
          }
          else {
            return true; // Keep the element
          }
        });
      }

      return [startElement].concat($.makeArray(validAncestors));
    }

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

    // Allow leaf voting to modify results, thus improving overall consistency
    function getHeuristicResult(candidates) {
      function processResult(pickedIndex) {
        // Log the results if necessary for debugging
        if (SC_DEV && isDebuggingOn) {
          sitecues.use('mouse-highlight/pick-debug', function(pickDebug) {
            // Use sitecues.togglePickerDebugging() to turn on the logging
            pickDebug.logHeuristicResult(scoreObjs, bestIndex, candidates);
          });
        }
        return pickedIndex < 0 ? null : candidates[pickedIndex];
      }

      var scoreObjs = getScores(candidates);

      // 1. Get the best candidate (pre-voting)
      var bestIndex = getCandidateWithHighestScore(scoreObjs),
        origBestIndex = bestIndex,
        extraWork = 0;
      if (bestIndex < 0) {
        return processResult(-1); // No valid candidate
      }

      // 2. Get the second best candidate
      while (isVotingOn) {
        var minSecondBestScore = scoreObjs[bestIndex].score - SECOND_BEST_IS_VIABLE_THRESHOLD;
        var secondBestIndex = getCandidateWithHighestScore(scoreObjs, minSecondBestScore, bestIndex);

        if (secondBestIndex < 0) {
          var scores = scoreObjs.map(function(scoreObj) { return scoreObj.score });
          SC_DEV && isVoteDebuggingOn && console.log('--> break no other competitors: ' + JSON.stringify(scores));
          break;  // Only one valid candidate
        }

        SC_DEV && isVoteDebuggingOn && console.log("1st = %d (score=%d) %O", bestIndex, scoreObjs[bestIndex].score, candidates[bestIndex]);
        SC_DEV && isVoteDebuggingOn && console.log("2nd = %d (score=%d) %O", secondBestIndex, scoreObjs[secondBestIndex].score, candidates[secondBestIndex]);

        // 3. Choose between first and second best candidate
        ++ extraWork;
        var topIndex = Math.max(bestIndex, secondBestIndex), // Top-most (container) choice
          topElement = candidates[topIndex],
          bottomIndex = Math.min(bestIndex, secondBestIndex), // Bottom-most (not container) choice
          leaves = getLeavesForVote(candidates[topIndex], candidates[bottomIndex]),
          leafIndex = 0,
          votesForTop = (topIndex === bestIndex) ? 1 : -1;

        SC_DEV && isVoteDebuggingOn && console.log('Starting vote: ' + votesForTop);
        for (; leafIndex < leaves.length; leafIndex++) {
          var candidatesForVote = getCandidates(leaves[leafIndex]),
            scoresForVote = getScores(candidatesForVote),
            leafVoteIndex = getCandidateWithHighestScore(scoresForVote),
            isVoteForTop = candidatesForVote[leafVoteIndex] === topElement;
          SC_DEV && isVoteDebuggingOn && console.log('Vote for top ? %s ---> %o voted for %O', isVoteForTop,
              leaves[leafIndex].firstChild || leaves[leafIndex],
            candidatesForVote[leafVoteIndex])
          votesForTop += isVoteForTop ? 1 : -1;
        }

        // The voters have chosen ...
        if (votesForTop < 0) {
          // The lower candidates to be highlighted as individuals
          bestIndex = bottomIndex;
          secondBestIndex = topIndex;
        }
        else {
          // The upper candidate as a single highlighted container
          bestIndex = topIndex;
          secondBestIndex = bottomIndex;
        }
        if (SC_DEV) {
          isVoteDebuggingOn && console.log('votesForTop = ' + votesForTop);
          // Debug info
          var deltaBest = scoreObjs[bestIndex].score - scoreObjs[secondBestIndex].score,
            deltaSecondBest = MIN_SCORE_TO_PICK - scoreObjs[secondBestIndex].score;
          if (deltaBest) {
            scoreObjs[bestIndex].factors.push({
              about: 'vote-winner',
              value: deltaBest,
              weight: 1
            });
          }
          if (deltaSecondBest) {
            scoreObjs[secondBestIndex].factors.push({
              about: 'vote-loser',
              value: deltaSecondBest,
              weight: 1
            });
          }
        }
        scoreObjs[bestIndex].score = Math.max(scoreObjs[topIndex].score, scoreObjs[bottomIndex].score); // The new champ
        scoreObjs[secondBestIndex].score = MIN_SCORE_TO_PICK;  // Take this one out of the running
        // Now loop around to try and other underdogs within scoring range of the top
      }

      if (SC_DEV && isVoteDebuggingOn) {
        if (origBestIndex !== bestIndex) {
          candidates[origBestIndex].style.outline = '2px solid red';
          candidates[bestIndex].style.outline = '2px solid green';
        }
        else {
          console.log('Extra work ' + extraWork);
          candidates[bestIndex].style.outline = (extraWork * 4) + 'px solid orange';
        }
        setTimeout(function() {
          candidates[origBestIndex].style.outline = '';
          candidates[bestIndex].style.outline = '';
        }, 1000);
      }

      return processResult(bestIndex);
    }

    function getLeavesForVote(startElement, avoidSubtree) {
      // Fastest way to get images and up to MAX_LEAVES_TO_VOTE
      var allLeaves = [],
        candidates = [],
        imageLeaves = startElement.getElementsByTagName('img');

      function isAcceptableTextLeaf(node) {
        // Logic to determine whether to accept, reject or skip node
        if (common.isEmpty(node.data)) {
          return NodeFilter.FILTER_REJECT; // Only whitespace or punctuation
        }
        var element = node.parentNode;
        if (element === avoidSubtree || $.contains(avoidSubtree, element)) {
          return NodeFilter.FILTER_REJECT; // Already looked at this one for original best pick
        }

        return NodeFilter.FILTER_ACCEPT;
      }

      // Retrieve some leaf nodes
      var nodeIterator = document.createNodeIterator(startElement, NodeFilter.SHOW_TEXT,
        { acceptNode: isAcceptableTextLeaf });
      var numLeaves = 0;
      while (numLeaves < MAX_LEAVES_TO_VOTE * 3) {
        var nextTextLeaf = nodeIterator.nextNode();
        if (!nextTextLeaf) {
          break;
        }

        allLeaves[numLeaves ++] = nextTextLeaf.parentNode;
      }

      // Get an even sampling of the leaf nodes
      var numberToSkipForEvenSampling = Math.max(1, Math.floor(numLeaves / MAX_LEAVES_TO_VOTE)),
        index = numberToSkipForEvenSampling;
      for (; index < numLeaves; index += numberToSkipForEvenSampling) {
        // Get an even sampling of the leaves, and don't prefer the ones at the top
        // as they are often not representative of the content
        var candidate = allLeaves[index],
          $candidate = $(candidate);
        // We don't use hidden candidates or those in headings
        // Headings are often anomalous
        if ($candidate.closest(':header').length === 0 &&
          !traitcache.isHidden(candidate, true)) {
          candidates.push(candidate);
        }
      }

      // Add up to one image in as a tie-breaking vote
      if (imageLeaves.length) {
        candidates.push(imageLeaves[0]); // Take up to one image for vote
      }

      return candidates;
    }

    /**
     * Return JQuery collection representing element(s) to highlight
     * Can return empty collection if there are no appropriate elements.
     * Uses a scoring system for each candidate.
     */
    function getScores(candidates) {
      // 1. Limit the number of candidate nodes we analyze (for performance)
      var restrictedCandidates = candidates.slice(0, MAX_ANCESTORS_TO_ANALYZE);

      // 2. Get traits -- basic info such as tag, role, style, coordinates
      var traitStack = traits.getTraitStack(restrictedCandidates);

      // 3. Get judgements -- higher level concepts from hand-tweaked logic
      var judgementStack = judge.getJudgementStack(traitStack, restrictedCandidates);

      // 4. Get scores
      var scoreObjs = [],
        index = 0;
      for (; index < judgementStack.length; index ++) {
        var judgements = judgementStack[index],
          scoreObj = computeScore(judgements, candidates[index], index);
        scoreObj.judgements = judgements;
        scoreObj.traits = traitStack[index];
        if (index > MIN_ANCESTORS_TO_ANALYZE &&
          scoreObj.score < MIN_SCORE_TO_PICK && scoreObjs[index - 1].score < MIN_SCORE_TO_PICK) {
          break; // Quit after two bad in a row
        }
        scoreObjs.push(scoreObj);
      }

      // 5. Parents of only children are strongly influenced by that child
      refineParentScores(scoreObjs);

      return scoreObjs;
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
          weight = judgementWeights[factorKey] || 0;
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

    // Return index of item with best score or -1 if nothing is viable
    // excludeIndex is an index to ignore (so we can easily get second best)
    // minScore is the minimum score before considering
    function getCandidateWithHighestScore(scoreObjs, minScore, excludeIndex) {
      var index,
          bestScore = minScore || UNUSABLE_SCORE,
          bestScoreIndex = -1;

      for (index = 0; index < scoreObjs.length; index ++) {
        if (index !== excludeIndex &&
          scoreObjs[index].score > bestScore) {
          bestScore = scoreObjs[index].score;
          bestScoreIndex = index;
        }
      }

      return bestScore > MIN_SCORE_TO_PICK ? bestScoreIndex : -1;
    }

    //  ----------- Score refinement section -----------

    // For every parent, add child's score to the parent * (refinement weights)
    // A parent is likely to be even more right/wrong than its child
    // Therefore the child's goodness reflects on the parent. We add it's score to the parent score.
    // The benefits of doing this are that if there is a container of child node that has no siblings,
    // or just adds a heading, we tend to prefer the container over the child.
    // If the child is bad, we tend to pick neither.
    function refineParentScores(scoreObjs) {
      var index, reasonToSteal,
        delta, weight, childScore,
        childIndex = -1, parentJudgement;
      for (index = 0; index < scoreObjs.length; index ++ ) {
        if (childIndex >= 0 &&
            scoreObjs[index].isUsable &&
            scoreObjs[index].score > MIN_SCORE_TO_PICK) {
          for (reasonToSteal in THIEF_WEIGHTS) {
            childScore = scoreObjs[childIndex].score; // Child's score
            weight = THIEF_WEIGHTS[reasonToSteal];
            parentJudgement = scoreObjs[index].judgements[reasonToSteal];
            delta = childScore * weight * parentJudgement; // How much to steal from child
            if (delta) {
              scoreObjs[index].score += delta;
              if (SC_DEV) {
                scoreObjs[index].factors.push({
                  about: reasonToSteal + '-from-child',    // Debug info
                  value: childScore,
                  weight: weight
                });
              }
              if (delta > 0) {   // Only take from child, don't give
                scoreObjs[childIndex].score -= delta;
                scoreObjs[childIndex].factors.push({
                  about: reasonToSteal + '-from-parent',
                  value: childScore,
                  weight: -weight
                });
              }
            }
          }
        }
        if (scoreObjs[index].isUsable) {
          childIndex = index;
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
        console.log('Picker debugging: ' + (isDebuggingOn = !isDebuggingOn));
      };
      sitecues.togglePickerVoteDebugging = function() {
        console.log('Picker vote debugging: ' + (isVoteDebuggingOn = !isVoteDebuggingOn));
      };
      sitecues.togglePickerVoting = function() {
        console.log('Picker voting: ' + (isVotingOn = !isVotingOn));
      };
    }

    // ----------------------------------------
    if (SC_UNIT) {
      $.extend(exports, picker);
    }

    callback();
  });
});
