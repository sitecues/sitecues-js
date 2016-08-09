define(
  [
    '$',
    'page/highlight/highlight',
    'page/util/common',
    'page/highlight/pick',
    'page/zoom/util/body-geometry',
    'page/util/geo',
    'core/events',
    'page/highlight/fixed-elements',
    'core/native-functions'
  ],
  function (
    $,
    mh,
    common,
    picker,
    bodyGeo,
    geo,
    events,
    fixedElements,
    nativeFn
  ) {
  'use strict';

  var STEP_SIZE_VERT = 18,
    STEP_SIZE_HORIZ = 24,  // Different step sizes because content tends to be wider than tall (lines of text)
    SPREAD_STEP_SIZE = 32,
    // How quickly do we fan out in our point testing?
    // If this is too large, we will go diagonally too often. Too small and we miss stuff that's not quite in line
    SPREAD_SLOPE = 0.1,
    MAX_SPREAD = 200,
    PIXELS_TO_PAN_PER_MS_HIGHLIGHT = 0.3,
    PIXELS_TO_PAN_PER_MS_HLB_SEARCH = 2,
    PIXELS_TO_SCROLL_PER_MS_HLB = 0.10,
    // For highlight moves, it's hard to track a quickly moving highlight with your eyes
    // This is the delay before the first repeat
    HIGHLIGHT_MOVE_FIRST_REPEAT_DELAY_MS = 400,
    // For highlight moves, prevent one keystroke from acting like two
    // This is the delay before additional repeats
    HIGHLIGHT_MOVE_NEXT_REPEAT_DELAY_MS = 250,
    // Helps us know whether it's the first repeat and therefore how much to delay
    isKeyRepeating,
    isInitialized,
    repeatDelayTimer,
    MAX_PIXELS_TO_PAN = 999,
    HEADING_TAGS = { h1:1,h2:1,h3:1,h4:1,h5:1,h6:1 },
    DO_SHOW_DEBUG_POINTS = false,
    MH_EXTRA_WIDTH = 10, // Amount to account for padding/border of mouse highlight
    isShowingDebugPoints = false,
    hlbElement,
    isKeyStillDown,
    lastMoveCommand,
    $lastPicked,
    // Queue of key navigation command
    navQueue = [],
    // Approximate amount of time for one animation frame
    ONE_ANIMATION_FRAME_MS = 16,  // 16ms is about 60fps
    // Method for animation
    requestFrame = window.requestAnimationFrame,
    isNavigationEnabled = true,// labs.isEnabled('arrowKeyNav'), // We no longer use labs here, it is on by default
    SAFE_ZONE = 30; // Begin scrolling when we get this close to window edge

  // Move the highlight in the direction requested
  // We start with a point in the middle of the highlight
  // Then move the point in the direction until we
  // are outside of the current highlight and we can pick something from that point.
  // Whenever the point gets close to the edge, we pan/scroll to bring up new content until we cant anymore.
  function queueKey(event, keyName) {
    if (isKeyStillDown) {
      return;
    }

    if (SC_DEV) {
      $('.sc-debug-dots').remove();  // Remove last debugging dots
    }

    navQueue.push({keyName: keyName, shiftKey: event.shiftKey });

    clearKeyRepeat();
    isKeyStillDown = true; // Assume it's down until it's let up

    if (navQueue.length === 1) {
      // Key was just pressed
      dequeueNextCommand();
    }
    // else will wait until current move is finished
  }

  function clearKeyRepeat() {
    isKeyRepeating = false;
    isKeyStillDown = false;
    clearTimeout(repeatDelayTimer);
  }

  // Execute the next navigation command off the front of the queue
  function dequeueNextCommand() {
    var nextCommand = navQueue.shift();
    if (nextCommand) {
      lastMoveCommand = null;
      var keyName = nextCommand.keyName;

      // Non-movement command
      if (keyName === 'space') {
        onSpace(nextCommand.shiftKey);
      }
      else if (keyName === 'esc') {
        onEscape(keyName);
      }
      else {
        lastMoveCommand = nextCommand;
        onMovementCommand(nextCommand);
      }
    }
    else {
      mh.setScrollTracking(true);
    }
  }

  function onMovementCommand(nextMove) {
    // Movement command
    if (hlbElement && !nextMove.shiftKey && performHLBScroll(nextMove)) {
      return; // HLB could scroll -- finish (don't do this if shift pressed as we are exploring with speech)
    }

    if (isNavigationEnabled) {
      performMovement(nextMove);
    }
  }

  // TODO Use bottoms of lines when scrolling down, so that the bottom of a line
  // matches with the bottom of the HLB
  function getHLBLineTops(currTop) {
    // Measure height of one line for first visible text node
    var nodeIterator =
          document.createNodeIterator(hlbElement, NodeFilter.SHOW_TEXT, null, false),
        range = document.createRange(),
        lineTops = [],
        hlbZoom = common.getComputedScale(hlbElement);

    while (true) {
      var textNode = nodeIterator.nextNode(),
        rawClientRects,
        index = 0;

      if (!textNode) {
        break;
      }
      range.selectNode(textNode);
      rawClientRects = range.getClientRects();
      for (; index < rawClientRects.length; index ++) {
        // Add each rectangle with a top greater than the last
        var numLines = lineTops.length,
          lineTop = Math.floor(rawClientRects[index].top / hlbZoom) + currTop;
        if (numLines === 0 || lineTop > lineTops[numLines - 1]) {
          lineTops[numLines] = lineTop;
        }
      }
    }

    return lineTops;
  }

  function getLineInRange(origTop, direction, seekStart, seekEnd) {
    var minSeek = Math.min(seekStart, seekEnd),
      maxSeek = Math.max(seekStart, seekEnd),
      lineTops = getHLBLineTops(origTop),
      currTop,
      numLines = lineTops.length,
      index = direction < 0 ? numLines - 1 : 0;

    for (; index >= 0 && index < numLines; index += direction) {
      currTop = lineTops[index];
      if (currTop >= minSeek && currTop < maxSeek) {
        return currTop;
      }
    }
    // No line top found -- go as far as allowed
    return seekEnd;
  }

  // Scroll HLB and return truthy value if a significant scroll occurred
  function performHLBScroll(nextMove) {
    var SCROLL_KEYS =  // Map key codes to scroll direction
      { 'up': { dir: -1, type: 'line' }, /* up */
        'pageup': { dir: -1, type: 'page' }, /* pageup */
        'home': { dir: -1, type: 'doc' }, /* home */
        'down': { dir: 1, type: 'line' }, /* down */
        'pagedn': { dir: 1, type: 'page' }, /* pagedown */
        'end': { dir: 1, type: 'doc' }  /* end */
      },
      keyEntry = SCROLL_KEYS[nextMove.keyName],
      origTop = hlbElement.scrollTop,  // Where it's scrolled to now
      lastTop = origTop,
      targetTop,  // Where we want to scroll to
      hlbHeight = hlbElement.offsetHeight,
      FUZZ_FACTOR = 5, // Make sure we can scroll far enough in all browsers
      maxTop = Math.max(0, hlbElement.scrollHeight - hlbHeight + FUZZ_FACTOR),
      startScrollTime,
      MIN_SCROLL = 5,
      MAX_SCROLL = 50,
      direction;

    if (!keyEntry) {
      return;  // Not an HLB scroll command
    }

    direction = keyEntry.dir;

    switch (keyEntry.type) {
      case 'page':
        // Pageup/pagedown default behavior always affect window/document scroll
        // (simultaneously with element's local scroll).
        // So prevent default and define new scroll logic.

        targetTop = getLineInRange(origTop, direction, origTop + hlbHeight * 0.8 * direction, direction < 0 ? 0 : maxTop);
        break;

      case 'line':
        targetTop = getLineInRange(origTop, direction, origTop + MIN_SCROLL * direction, origTop + MAX_SCROLL * direction);
        break;
      case 'doc':
        hlbElement.scrollTop = direction < 0 ? 0 : maxTop;
        dequeueNextCommand();
        return true;  // Don't scroll smoothly
      // default: return; // can't happen
    }

    function smoothScroll() {
      var msElapsed = Date.now() - startScrollTime + ONE_ANIMATION_FRAME_MS,
        // How many pixels to scroll from the original start
        pixelsToScroll = msElapsed * PIXELS_TO_SCROLL_PER_MS_HLB,
        // Value to scroll to for this animation frame
        midAnimationTop = Math.floor(lastTop + direction * pixelsToScroll),
        isTargetReached;

      if (lastTop !== midAnimationTop) {
        hlbElement.scrollTop = midAnimationTop;
        if (direction < 0 ? (midAnimationTop <= targetTop) : (midAnimationTop >= targetTop)) {
          isTargetReached = true;
        }
      }

      // Didn't move or target reached
      if (isTargetReached) {
        // Finished
        if (isKeyStillDown) {
          performHLBScroll(nextMove);  // Repeat for scrolling, but not for moving HLB
        }
      }
      else {
        requestFrame(smoothScroll);
      }
    }

    // Sanity constraints on scrolling request
    targetTop = Math.round(constrained(targetTop, 0, maxTop));

    if (Math.abs(targetTop - origTop) > MIN_SCROLL) {
      startScrollTime = Date.now();
      smoothScroll();
      return true;      // Returns true if needed scrolling, so that HLB is not moved
    }
  }

  function getHighlight() {
    var highlight = mh.getHighlight();
    return highlight && (highlight.isVisible || hlbElement) && highlight;
  }

  function performMovement(nextMove) {
    if (!getHighlight()) {
      return;  // Sanity check
    }
    prepareMovement();

    var type = nextMove.keyName,
      shiftKey = nextMove.shiftKey;

    switch (type) {
      case 'up':
        moveInDirection(0, -1, shiftKey);
        break;
      case 'down':
        moveInDirection(0, 1, shiftKey);
        break;
      case 'left':
        moveInDirection(-1, 0, shiftKey);
        break;
      case 'right':
        moveInDirection(1, 0, shiftKey);
        break;
      case 'heading':
        moveByTagName(HEADING_TAGS, shiftKey);
        break;
      default:
        if (SC_DEV) { console.log('Illegal command'); }
    }
  }

  // Prepare movement by hiding existing HLB and fixed position content so they do not interfere with elementFromPoint()
  function prepareMovement() {
    // Hide current HLB so it doesn't interfere with getElementFromPoint
    if (hlbElement) {
      hlbElement.style.display = 'none';
    }

    fixedElements.disableMouseEvents();

    // Pre-require audio
    require(['audio/audio'], function(audio) {
      audio.init();
    });
  }

  function fail(origPanX, origPanY) {
    // Don't process the rest of the command queue
    navQueue = [];

    // Restore mouse events and highlighting
    mh.setScrollTracking(true);
    fixedElements.enableMouseEvents();

    // Make lens visible again
    if (hlbElement) {
      hlbElement.style.display = 'block';
      // Scroll back to original position if the lens is now offscreen
      if (typeof origPanX === 'number') {
        var lensRect = hlbElement.getBoundingClientRect();
        if (lensRect.left < 0 && lensRect.right > window.innerWidth || lensRect.top < 0 || lensRect.bottom > window.innerHeight) {
          window.scrollTo(origPanX, origPanY);  // Back to original place in document
        }
      }
    }

    // Play bonk sound
    require(['audio/audio'], function(audio) {
      audio.playEarcon('bump');
    });
  }

  function speakHighlight() {
    require(['page/keys/commands'], function(commands) {
      commands.speakHighlight();
    });
  }

  function succeed(doAllowRepeat, doSpeakText) {
    fixedElements.enableMouseEvents();

    if (doSpeakText) {
      speakHighlight();   // Shift+arrow
    }

    if (hlbElement) {
      // Open new HLB
      if (SC_DEV) { console.log('Retarget HLB'); }
      retargetHLB();
    }
    else if (doAllowRepeat && isKeyStillDown && lastMoveCommand) {
      // For movement, we need a delay between command, otherwise it can happen too fast
      var isFirstRepeat = !isKeyRepeating,
        repeatDelay = isFirstRepeat ? HIGHLIGHT_MOVE_FIRST_REPEAT_DELAY_MS : HIGHLIGHT_MOVE_NEXT_REPEAT_DELAY_MS;
      // Repeat last command if key is still pressed down
      isKeyRepeating = true;
      repeatDelayTimer = nativeFn.setTimeout(function() {
        onMovementCommand(lastMoveCommand);
      }, repeatDelay);
      return;
    }

    dequeueNextCommand();
  }

  function moveInDirection(horizDir, vertDir, isShifted) {

    var
      highlight = getHighlight(),

      // *** Window size ***
      winRight = window.innerWidth - 1,
      winBottom = window.innerHeight - 1,

      // ** Panning state **
      // Starting pan time and location
      startPanTime,
      // Farthest panning could possibly go
      maxPanUp = 0,
      maxPanLeft = bodyGeo.getBodyLeft(),
      maxPanRight = bodyGeo.getBodyRight() - winRight,
      maxPanDown = document.documentElement.scrollHeight - winBottom,
      // Target end point for panning
      targetPanLeft,
      targetPanRight,
      targetPanUp,
      targetPanDown,
      lastPanX,
      lastPanY;

    updateLastPanXY();

    var
      // *** Highlight state ***
      origPanX = lastPanX,
      origPanY = lastPanY,
      origPickedRect = getHighlightRect(highlight, origPanX, origPanY),
      doPickNewHighlight,

      // *** Current position and direction of dot movement ***
      isHorizMovement = !vertDir,
      isVertMovement = !isHorizMovement,
      // x start point will be at the left edge, middle or right edge
      // depending on whether horizDir is -1, 0 or 1
      x = Math.floor(constrained(origPickedRect.left + (1 + horizDir) * origPickedRect.width / 2, 0, winRight)),
      // y start point will be at the top edge, middle or bottom edge
      // depending on whether vertDir is -1, 0 or 1
      y = Math.floor(constrained(origPickedRect.top + (1 + vertDir) * origPickedRect.height / 2, 0, winBottom)),

      // *** Spread state for dots as we go farther out (how it fans out) ****
      // The minimum size of a row (spread is how far from the center do to venture on that row)
      minSpread = Math.max((isHorizMovement ? origPickedRect.height : origPickedRect.width) / 2, SPREAD_STEP_SIZE + 1),
      // How many pixels from the original screen coordinate ar we?
      distanceFromOriginal = 0,
      // How many rows of points from the original aka how far from the original are we?
      numberOfDotRowsChecked = 0,
      // How fast to pan -- if HLB we want to pan immediately (better UX)
      pixelsToPanPerMs = hlbElement ? PIXELS_TO_PAN_PER_MS_HLB_SEARCH : PIXELS_TO_PAN_PER_MS_HIGHLIGHT;

    isShowingDebugPoints = DO_SHOW_DEBUG_POINTS && isShifted; // Show debugging dots if shift is pressed
    var doSpeakText = !isShowingDebugPoints && isShifted;
    $lastPicked = highlight.picked;

    function testPointIfOnscreen(x, y) {
      if (x < 0 || y < 0 || x > winRight || y > winBottom) {
        return null;
      }
      return testPoint(x, y, $lastPicked, 'blue');
    }

    function testNextRowOfPointsAt(x, y, distance) {
      ++ numberOfDotRowsChecked;

      var
        // Can we pick something from the center dot?
        $picked = testPoint(x, y, $lastPicked, 'red'),
        // How far from center dot will we check?
        spreadEnd = constrained(distance * SPREAD_SLOPE, minSpread, MAX_SPREAD),
        // These are to enable the cross-hatch pattern that allows fewer points to be more effective
        toggleExtraY = 0,
        spreadStart = isHorizMovement ? (SPREAD_STEP_SIZE * ((numberOfDotRowsChecked % 2) ? 0.7 : 1.2)) : SPREAD_STEP_SIZE;

      // Each iteration of this loop will test another dot on the current row of dots
      // spread out from the red center dot
      for (var spreadDistance = spreadStart; !$picked && spreadDistance < spreadEnd; spreadDistance += SPREAD_STEP_SIZE) {
        if (isVertMovement) {
          // Enable crosshatch pattern
          toggleExtraY = toggleExtraY ? 0 : SPREAD_STEP_SIZE / 2;
        }

        // Test dots in orthogonal directions from base direction of movement
        // Spreading out in a fan shape in the direction of travel
        $picked =
          testPointIfOnscreen(x - isVertMovement * spreadDistance, y - isHorizMovement * spreadDistance + toggleExtraY) ||
          testPointIfOnscreen(x + isVertMovement * spreadDistance, y + isHorizMovement * spreadDistance + toggleExtraY);
      }

      if (!$picked) {
        return;
      }

      updateLastPanXY();

      if (isValidDirectionForNewHighlight(origPickedRect, $picked, origPanX, origPanY, lastPanX, lastPanY, horizDir, vertDir) &&
        tryHighlight($picked)) {

        // Pan until highlight is fully visible onscreen (if necessary)
        var pickedRect = getHighlight().fixedContentRect;

        if (horizDir < 0 && pickedRect.left < SAFE_ZONE) {
          // Pan left far enough so that full width of the highlight is visible
          targetPanLeft = lastPanX + pickedRect.left - SAFE_ZONE;
        }
        else if (horizDir > 0 && pickedRect.right > winRight - SAFE_ZONE) {
          // Pan right far enough so that full width of the highlight is visible
          targetPanRight = lastPanX + pickedRect.right - winRight + SAFE_ZONE;
        }
        else if (vertDir < 0 && pickedRect.top < SAFE_ZONE) {
          // Pan up far enough so that the full height of the highlight is visible
          targetPanUp = lastPanY + pickedRect.top - SAFE_ZONE;
        }
        else if (vertDir > 0 && pickedRect.bottom > winBottom - SAFE_ZONE) {
          targetPanDown = lastPanY + pickedRect.bottom - winBottom + SAFE_ZONE;
        }
        else {
          // No need to pan -- finish up
          succeed(!hlbElement, doSpeakText);
          return true;
        }

        // Start final highlight panning after all other operations are finished
        startPanning(false);
        return true;
      }
    }

    function updateLastPanXY() {
      lastPanX = window.pageXOffset;
      lastPanY = window.pageYOffset;
    }

    function startPanning(isHighlightStillNeeded) {
      // Don't allow the mouse highlight to follow scroll events from keyboard panning
      mh.setScrollTracking(false);

      targetPanUp = Math.floor(constrained(targetPanUp, maxPanUp, maxPanDown));
      targetPanLeft = Math.floor(constrained(targetPanLeft, maxPanLeft, maxPanRight));
      targetPanRight = Math.floor(constrained(targetPanRight, maxPanLeft, maxPanRight));
      targetPanDown = Math.floor(constrained(targetPanDown, maxPanUp, maxPanDown));
      doPickNewHighlight = isHighlightStillNeeded;
      startPanTime = Date.now();
      // Turn mousemove-to-highlight off
      // so that the invisible mouse doesn't pick stuff moving underneath it
      panInDirection();
    }

    function isPanningTargetReached(panX, panY) {
      return (horizDir < 0 && panX <= targetPanLeft) ||
        (horizDir > 0 && panX >= targetPanRight) ||
        (vertDir < 0 && panY <= targetPanUp) ||
        (vertDir > 0 && panY >= targetPanDown);
    }

    function panInDirection() {
      // Check if there is anything more to pan to
      var msElapsed = Date.now() - startPanTime,
        pixelsToPan = msElapsed * pixelsToPanPerMs,
        attemptPanX = Math.floor(constrained(lastPanX + pixelsToPan * horizDir, targetPanLeft, targetPanRight)),
        attemptPanY = Math.floor(constrained(lastPanY + pixelsToPan * vertDir, targetPanUp, targetPanDown));

      // TODO can we find a way to disable the mouse pointer
      // without making scrolling jerkier? The problem is we need pointer-events for checking the highlight
      // Maybe we can put a fixed 1px thing right under the mouse that captures it?
      // Unfortunately, fixed position stuff doesn't work with zoom!
      // Perhaps we can do a row of dots

      window.scrollTo(attemptPanX, attemptPanY);

      // If we haven't found anything yet, check the next row of points
      if (doPickNewHighlight &&
        testNextRowOfPointsAt(x - horizDir, y, distanceFromOriginal + pixelsToPan)) {
        // FOUND SOMETHING!
        return;
      }

      if (isPanningTargetReached(attemptPanX, attemptPanY)) {
        // THE TARGET HAS BEEN REACHED!
        if (doPickNewHighlight) {
          // Was not successful
          fail(origPanX, origPanY);
        }
        else {
          // Successful -- already had a highlight
          succeed(!hlbElement, doSpeakText);
        }
        return;
      }

      // Continue panning
      requestFrame(panInDirection);
    }

    // Go quickly through visible possibilities
    while (true) {
      var panX = 0,
        panY = 0;
      if (horizDir) {
        x += horizDir * STEP_SIZE_HORIZ;
        if (x < SAFE_ZONE) {
          panX = SAFE_ZONE - x;
        }
        else if (x > winRight - SAFE_ZONE) {
          panX = winRight - SAFE_ZONE - x;
        }
      }
      else {
        y += vertDir * STEP_SIZE_VERT;
        if (y < SAFE_ZONE) {
          panY = SAFE_ZONE - y;
        }
        else if (y > winBottom - SAFE_ZONE) {
          panY = winBottom - SAFE_ZONE - y;
        }
      }

      if (panX || panY) {
        // NO HIGHLIGHT FOUND ON VISIBLE SCREEN (Haven't panned yet though ...)
        // Reached the edge -- but we haven't found a highlight yet.
        // We need to begin panning to find a highlight
        x += panX;
        y += panY;
        // Panning too much is crazy. Give up after MAX_PIXELS_TO_PAN pixels.
        // User can keep arrowing in that direction if they want ... but don't autoscroll forever!
        targetPanUp = lastPanY - MAX_PIXELS_TO_PAN;
        targetPanLeft = lastPanX - MAX_PIXELS_TO_PAN;
        targetPanRight = lastPanX + MAX_PIXELS_TO_PAN;
        targetPanDown = lastPanY + MAX_PIXELS_TO_PAN;
        startPanning(true);
        break;
      }

      distanceFromOriginal += isHorizMovement ? STEP_SIZE_HORIZ : STEP_SIZE_VERT;
      if (testNextRowOfPointsAt(x, y, distanceFromOriginal)) {
        break;
      }
    }
  }

  // Ensure that the entire newly picked item's rect is in the correct direction
  // It may not be if the spread picks an object that covers a a large area
  function isValidDirectionForNewHighlight(origPickedRect, $picked, origPanX, origPanY, panX, panY, horizDir, vertDir) {
    var newRect = $picked[0].getBoundingClientRect(),
      FUZZ_FACTOR = 9;
    if (horizDir > 0) {
      // Correct move to the right?
      return newRect.left + panX + FUZZ_FACTOR > origPickedRect.right + origPanX;
    }
    if (horizDir < 0) {
      // Correct move to the left?
      return newRect.right + panX - FUZZ_FACTOR < origPickedRect.left + origPanX;
    }
    if (vertDir > 0) {
      // Correct move down?
      return newRect.top + panY + FUZZ_FACTOR > origPickedRect.bottom + origPanY;
    }

    // Correct move up?
    return newRect.bottom + panY - FUZZ_FACTOR < origPickedRect.top + origPanY;
  }

  // The current target that we might want to pick/highlight
  // is not an ancestor of the last picked item, or vice-versa
  function isValidTarget(target, $lastPicked) {
    if (!$lastPicked) {
      return !!target; // Nothing previously picked -- any non-null target is valid
    }
    return target &&
      !$lastPicked.is(target) &&
      !$.contains(target, $lastPicked[0]) &&
      !$.contains($lastPicked[0], target);
  }

  function testPoint(x, y, $lastPicked, color) {
    var target = document.elementFromPoint(x, y);
    if (SC_DEV && isShowingDebugPoints) {
      // Briefly display the points being tested
      $('<div class="sc-debug-dots">')
        .appendTo('html')
        .css({
          position: 'absolute',
          left: (x + window.pageXOffset) + 'px',
          top: (y + window.pageYOffset) + 'px',
          width: '0px',
          height: '0px',
          outline: '3px solid ' + color,
          zIndex: 999999
        });
    }

    // Need to use something that's not a container of the last picked item
    if (!isValidTarget(target, $lastPicked)) {
      return null;
    }

    var $picked = picker.find(target);
    if (!$picked || !isValidTarget($picked[0], $lastPicked)) {
      return null;
    }


    return $picked;
  }

  function tryHighlight($picked) {
    var doKeepHighlightHidden = !!hlbElement;
    return mh.highlight($picked, false, false, doKeepHighlightHidden);
  }

  function moveByTagName(acceptableTagsMap, isReverse) {

    var
      treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false),
      $lastPicked = getHighlight().picked;

    function doesMatchTags(element) {
      if (!acceptableTagsMap[element.localName]) {
        return;
      }
      if (!isValidTarget(element, $lastPicked)) {
        return; // The suggested element to pick is not valid
      }

      var $picked = $(element);
      if (!$picked.text().trim()) {
        return; // Not valid because there is no text in the element
      }

      element.scrollIntoView(true);
      if (!tryHighlight($picked)) {
        return; // Couldn't highlight (element offscreen, invisible, etc.)
      }

      if (!isValidTarget(getHighlight().picked[0], $lastPicked)) {
        return;  // The actually picked element from the suggested target is not valid
      }
      // Successful highlight
      return true;
    }

    function searchDocument() {
      while (true) {
        var newNode = isReverse ? treeWalker.previousNode() : treeWalker.nextNode();
        if (!newNode) {
          return false;
        }
        if (doesMatchTags(newNode)) {
          return true;
        }
      }
    }

    // Set the starting point (can do with tree walker but doesn't look like the similar node iterator API can do this)
    if ($lastPicked) {
      treeWalker.currentNode = $lastPicked[0];
    }

    if (!searchDocument()) {
      // Search one more time, from beginning instead of mid-point.
      // Wraps to beginning/end of document depending on direction.
      // This doesn't happen often so code here is optimized for size rather than speed.
      // Don't try to use H command to navigate headings in the fixed areas.
      treeWalker.currentNode = isReverse ? treeWalker.currentNode = $(document.body).find('*').last()[0] : document.body;
      if (!searchDocument()) {
        fail();
        return;
      }
    }

    // Adjust final scroll position so that highlight that it's not jammed against the top/left of window unless it needs to
    window.scrollBy(-100, -100);
    succeed();
  }

  function constrained(value, min, max) {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }

  function getHighlightRect(highlight, pageOffsetX, pageOffsetY) {
    // First get the outline in absolute coordinates
    var outlineRect = geo.expandOrContractRect(highlight.absoluteRect, -MH_EXTRA_WIDTH);

    // Next subtract the current scroll position
    outlineRect.left -= pageOffsetX;
    outlineRect.right -= pageOffsetX;
    outlineRect.top -= pageOffsetY;
    outlineRect.bottom -= pageOffsetY;
    return outlineRect;
  }

  function toggleHLB() {
    require(['hlb/hlb'], function(hlb) {
      hlb.toggleHLB(getHighlight());
    });
  }

  function retargetHLB() {
    require(['hlb/hlb'], function(hlb) {
      // Nothing found .. close HLB and enable highlight on last known item
      hlb.retargetHLB(getHighlight());
    });
  }

  function onSpace(doSpeakText) {
    if (hlbElement || getHighlight()) {
      // Has an HLB or a highlight -- toggle HLB
      toggleHLB();
    }
    else if (isNavigationEnabled) {
      // No highlight -- make one
      mh.autoPick();
    }
    if (doSpeakText) {
      speakHighlight(); // Shift+space
    }
  }

  function onEscape() {
    if (hlbElement) {
      toggleHLB();
    }
    else {
      // TODO next arrow key is still moving highlight
      // Probably the invisible mouse cursor is messing us up as well
      mh.hide(true);
      navQueue = []; // No highlight -- can't process any more nav keys in the queue
    }
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    fixedElements.init();

    $(window).on('keyup', function () {
      clearTimeout(repeatDelayTimer);
      isKeyStillDown = false;
      isKeyRepeating = false;
    });

    events.on('hlb/did-create', function($hlb) {
      hlbElement = $hlb[0];
    });

    events.on('hlb/closed', function() {
      hlbElement = null;
    });
  }

  return {
    queueKey: queueKey,
    init: init
  };
});
