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

define(
  [
    '$',
    'page/util/common',
    'core/conf/user/manager',
    'core/conf/site',
    'page/highlight/traitcache',
    'page/highlight/traits',
    'page/highlight/judge',
    'core/native-functions'
  ],
  function (
    $,
    common,
    conf,
    site,
    traitcache,
    traits,
    judge,
    nativeFn
  ) {
  'use strict';

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
    // Use hack to avoid IE bugs where HLB on inputs does not allow editing
    GLOBAL_DISABLE_PICKER_SELECTOR =
      'iframe[name="google_conversion_frame"]', // Don't pick invisible Google Adwords iframe

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

    // Inject selectors via sitecues.config.picker or customization module using provideCustomSelectors()
    // Object is as follows:
    //{
    //  prefer: "[selector]",
    //  ignore: "[selector]",
    //  disable: "[selector]"
    //},
    customSelectors = site.get('picker') || {},

    isDebuggingOn,
    isVoteDebuggingOn,
    isAutoPickDebuggingOn,
    isVotingOn = true,
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
  function find(startElement, doSuppressVoting) {
    var candidates, picked;

    function processResult(result) {
      lastPicked = result && result[0];
      return result;
    }

    // 1. Don't pick anything in the sitecues UI
    if (!startElement || $(startElement).is('html,body') || isInSitecuesUI(startElement)) {
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
    if (!candidates || !hasVisibleContent(candidates)) {
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
    picked = getHeuristicResult(candidates, isVotingOn && !doSuppressVoting);

    // 7. Save results for next time
    lastPicked = picked;

    return processResult(picked ? $(picked) : null);
  }

  function reset() {
    lastPicked = null;
  }

  function getCandidates(startElement) {
    var allAncestors = $(startElement).parentsUntil('body'),
      visibleAncestors = getVisibleAncestors(allAncestors),
      validAncestors = visibleAncestors.not(visibleAncestors.has('#sitecues-badge'));

    if (validAncestors.length === 0) {
      return [ startElement ]; // Always at least one valid candidate -- the startElement
    }
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

  function getVisibleAncestors (ancestors){
    var opacity = null,
      index = ancestors.length;
    while (index --) {
      opacity = traitcache.getStyleProp(ancestors[index], 'opacity');
      if (opacity === '0') {
        ancestors = ancestors.slice(index + 1, ancestors.length - 1);
        break;
      }
    }
    return ancestors;
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

  // What elements should picking be disabled on?
  function getPickingDisabledSelector() {
    var selector = customSelectors.disable ? customSelectors.disable.slice() : '';
    // TODO: Once HLB'd form controls no longer crashes MS Edge we can remove it, at least for those versions
    // For now: make sure we don't pick those controls by adding them to the custom disabled selector
    selector = (selector ? selector + ',' : '') + GLOBAL_DISABLE_PICKER_SELECTOR;
    return selector;
  }

  // Return a jQuery object with a result determined from customizations,
  // or null if no customization applies.
  function getCustomizationResult(candidates) {
    var picked,
      $candidates = $(candidates),
      pickingDisabledSelector = getPickingDisabledSelector();

    // 1. Customizations in picker.disable = "[selector]";
    if (pickingDisabledSelector && $candidates.is(pickingDisabledSelector)) {
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

  function performVote(scoreObjs, bestIndex, candidates, extraWork, origBestIndex) {
    function getNumericScore(scoreObj) {
      return scoreObj.score;
    }

    while (true) {
      var minSecondBestScore = scoreObjs[bestIndex].score - SECOND_BEST_IS_VIABLE_THRESHOLD;
      var secondBestIndex = getCandidateWithHighestScore(scoreObjs, minSecondBestScore, bestIndex);

      if (secondBestIndex < 0) {
        var scores = scoreObjs.map(getNumericScore);
        if (SC_DEV && isVoteDebuggingOn) {
          console.log('--> break no other competitors: ' + nativeFn.JSON.stringify(scores));
        }
        break;  // Only one valid candidate
      }

      if (SC_DEV && isVoteDebuggingOn) {
        console.log('1st = %d (score=%d) %O', bestIndex, scoreObjs[bestIndex].score, candidates[bestIndex]);
        console.log('2nd = %d (score=%d) %O', secondBestIndex, scoreObjs[secondBestIndex].score, candidates[secondBestIndex]);
      }

      // 3. Choose between first and second best candidate
      ++extraWork;
      var topIndex = Math.max(bestIndex, secondBestIndex), // Top-most (container) choice
        topElement = candidates[topIndex],
        bottomIndex = Math.min(bestIndex, secondBestIndex), // Bottom-most (not container) choice
        leaves = getLeavesForVote(candidates[topIndex], candidates[bottomIndex]),
        leafIndex = 0,
        votesForTop = (topIndex === bestIndex) ? 1 : -1;

      if (SC_DEV && isVoteDebuggingOn) {
        console.log('Starting vote: ' + votesForTop);
      }
      for (; leafIndex < leaves.length; leafIndex++) {
        var candidatesForVote = getCandidates(leaves[leafIndex]),
          scoresForVote = getScores(candidatesForVote),
          leafVoteIndex = getCandidateWithHighestScore(scoresForVote),
          isVoteForTop = candidatesForVote[leafVoteIndex] === topElement;
        if (SC_DEV && isVoteDebuggingOn) {
          console.log(
            'Vote for top ? %s ---> %o voted for %O',
            isVoteForTop,
              leaves[leafIndex].firstChild || leaves[leafIndex],
            candidatesForVote[leafVoteIndex]
          );
        }
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
        modifyResultsFromVote(votesForTop, scoreObjs, bestIndex, secondBestIndex);
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
      nativeFn.setTimeout(function () {
        candidates[origBestIndex].style.outline = '';
        candidates[bestIndex].style.outline = '';
      }, 1000);
    }
    return bestIndex;
  }

  function getHeuristicResult(candidates, doAllowVoting) {

    // 1. Get the best candidate (pre-voting)
    var
      scoreObjs = getScores(candidates),
      bestIndex = getCandidateWithHighestScore(scoreObjs),
      origBestIndex = bestIndex,
      extraWork = 0;

    function processResult(pickedIndex) {
      // Log the results if necessary for debugging
      if (SC_DEV && isDebuggingOn) {
        require(['pick-debug'], function(pickDebug) {
          // Use sitecues.togglePickerDebugging() to turn on the logging
          pickDebug.logHeuristicResult(scoreObjs, bestIndex, candidates);
        });
      }
      return pickedIndex < 0 ? null : candidates[pickedIndex];
    }

    if (bestIndex < 0) {
      return processResult(-1); // No valid candidate
    }

    // 2. Get the second best candidate
    if (doAllowVoting) {
      bestIndex = performVote(scoreObjs, bestIndex, candidates, extraWork, origBestIndex);
    }

    return processResult(bestIndex);
  }

  // Allow leaf voting to modify results, thus improving overall consistency
  function modifyResultsFromVote(votesForTop, scoreObjs, bestIndex, secondBestIndex) {
    if (isVoteDebuggingOn) {
      console.log('votesForTop = ' + votesForTop);
    }
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

  function getLeavesForVote(startElement, avoidSubtree) {
    // Fastest way to get images and up to MAX_LEAVES_TO_VOTE
    var allLeaves = [],
      candidates = [],
      imageLeaves = startElement.getElementsByTagName('img');

    function isAcceptableTextLeaf(node) {
      // Logic to determine whether to accept, reject or skip node
      if (common.isWhitespaceOrPunct(node)) {
        return; // Only whitespace or punctuation
      }
      var element = node.parentNode;
      if (element === avoidSubtree || $.contains(avoidSubtree, element)) {
        return; // Already looked at this one for original best pick
      }

      return true;
    }

    // Retrieve some leaf nodes
    var nodeIterator = document.createNodeIterator(startElement, NodeFilter.SHOW_TEXT,
      null, false);

    function nextNode() {
      var node;
      while (true) {
        node = nodeIterator.nextNode();
        if (!node) {
          return null;
        }
        else if (isAcceptableTextLeaf(node)) {
          return node;
        }
      }
    }

    nextNode();

    var numLeaves = 0;
    while (numLeaves < MAX_LEAVES_TO_VOTE * 3) {
      var nextTextLeaf = nextNode();
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
      if ($candidate.closest('h1,h2,h3,h4,h5,h6').length === 0 &&
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
    // TODO move picker debugging to new module system
//    logResults = function () {
//    };
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
          if (THIEF_WEIGHTS.hasOwnProperty(reasonToSteal)) {
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
      zoom = conf.get('zoom') || 1;
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

  // This gives us a score for how good what we want to auto pick is.
  // Auto picking is where we highlight something useful onscreen after the user presses space with no highlight.
  // The candidate passed in is guaranteed to be at least partly onscreen
  function getAutoPickScore(picked, fixedRect, absoluteRect, bodyWidth, bodyHeight) {
    var MIN_TOP_COORDINATE_PREFERRED = 100;
    var MIN_SIGNIFICANT_TEXT_LENGTH = 25;
    var topRole = picked.parents('[role]').last().attr('role');
    var winHeight = window.innerHeight;

    // 1. Get basic scoring info
    var scoreInfo = {
      isAtTopOfScreen: fixedRect.top < MIN_TOP_COORDINATE_PREFERRED,
      isAtTopOfDoc: absoluteRect.top < MIN_TOP_COORDINATE_PREFERRED,
      isOnTopHalfOfScreen: fixedRect >= MIN_TOP_COORDINATE_PREFERRED &&
        fixedRect.top < winHeight * 0.6,
      isPartlyBelowBottom: fixedRect.bottom > winHeight,
      isMostlyBelowBottom: fixedRect.top + fixedRect.height / 2 > winHeight,
      hasSignificantText: picked.text().length > MIN_SIGNIFICANT_TEXT_LENGTH,
      headingScore: (function() {
        // Prefer something with a heading (h1 excellent, h2 very good, h3 okay)
        var headings = picked.find('h1,h2,h3,h4,h5,h6').addBack();
        return (headings.filter('h1').length > 0) * 3 ||
          (headings.filter('h2').length > 0) * 2 ||
          headings.length > 0;
      }()),
      isInMainContent: topRole === 'main',
      hasBadAriaRole: !!topRole && topRole !== 'main',
      isInTallAndNarrowContainer: 0,
      isInTallAndWideContainer: 0
    };

    var isWide, isTall;

    // 2. Use a size heuristic
    var portionOfBodyWidth,
      portionOfBodyHeight,
      ancestor = picked[0],
      ancestorRect,
      isInWideContainer = 0,
      isInTallContainer = 0;
    while (ancestor.localName !== 'body') {
      ancestorRect = traitcache.getScreenRect(ancestor);
      portionOfBodyWidth = ancestorRect.width / bodyWidth;
      portionOfBodyHeight = ancestorRect.height / bodyHeight;

      if (portionOfBodyWidth < 0.3 && ancestorRect.height > ancestorRect.width * 2) {
        // We're in a tall container -- probably a sidebar
        isInWideContainer = 0;
        scoreInfo.isInTallAndNarrowContainer = 1;
        scoreInfo.skip = ancestor; // Skip past the rest of this
        break;
      }

      if (portionOfBodyWidth > 0.5 && portionOfBodyWidth < 0.95) {
        isWide = 1; // Majority of <body>'s width (but not the entire thing)
      }
      if (portionOfBodyHeight > 0.75 && portionOfBodyHeight < 0.95) {
        isTall = 1;
      }

      ancestor = ancestor.parentNode;
    }

    scoreInfo.isInTallAndWideContainer = isInWideContainer && isInTallContainer;

    scoreInfo.score =
      !scoreInfo.isAtTopOfScreen +
      !scoreInfo.isAtTopOfDoc +
      scoreInfo.isOnTopHalfOfScreen +
      scoreInfo.isPartlyBelowBottom * -2 +
      scoreInfo.isMostlyBelowBottom * -2 +
      scoreInfo.headingScore +
      scoreInfo.hasSignificantText * 2 +
      scoreInfo.isInMainContent * 2 +
      scoreInfo.hasBadAriaRole * -3 +
      scoreInfo.isInTallAndNarrowContainer * -4 +
      scoreInfo.isInTallAndWideContainer * 2;

    if (SC_DEV && isAutoPickDebuggingOn) {
      console.log('%d: %o', scoreInfo.score, picked[0]);
      console.log('   %O %s', scoreInfo, picked.text().substr(0,30).trim());
    }

    return scoreInfo;
  }

  // -------------- Customizations ----------------------
  // See https://equinox.atlassian.net/wiki/display/EN/Picker+hints+and+customizations

  // This is a hook for customization scripts, which can add their own judgements by overriding this method.
  function provideCustomSelectors(selectors) {
    customSelectors = selectors;
  }

  // This is a hook for customization scripts, which can add their own judgements by overriding this method.
  // Weights can be changed for pre-existing or added for custom judgements
  // Pass in as { judgementName: weightValue, judgementName2: weightValue2, etc. }
  function provideCustomWeights(weights) {
    $.extend(judgementWeights, weights);
  }

  // Return true if the element is part of the sitecues user interface
  // Everything inside the <body> other than the page-inserted badge
  function isInSitecuesUI(node) {
    var element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    return ! $(element).closest('body').length ||  // Is not in the <body> (must also check clone body)
      $(element).closest('#sitecues-badge,#scp-bp-container').length;
  }

  if (SC_DEV) {
    // --- For debugging ----------------------
    sitecues.pickFrom = function (element) {
      return find(element);
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
    sitecues.toggleAutoPickDebugging= function() {
      console.log('Auto pick debugging: ' + (isAutoPickDebuggingOn = !isAutoPickDebuggingOn));
    };
  }
  return {
    find: find,
    reset: reset,
    getAutoPickScore: getAutoPickScore,
    provideCustomSelectors: provideCustomSelectors,
    provideCustomWeights: provideCustomWeights
  };

});
