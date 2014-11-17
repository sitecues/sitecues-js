sitecues.def('mouse-highlight/move-keys', function(picker, callback) {
  'use strict';
  sitecues.use('jquery', 'mouse-highlight', 'highlight-box', 'platform', 'hlb/dimmer', 'util/common',
    'mouse-highlight/picker', 'zoom', 'util/geo', 'labs',
    function($, mh, hlb, platform, dimmer, common, picker, zoomMod, geo, labs) {

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
      repeatDelayTimer,
      MAX_PIXELS_TO_PAN = 999,
      VISIBLE_SPACE_AROUND_HIGHLIGHT = 50,
      HEADING_TAGS = { h1:1,h2:1,h3:1,h4:1,h5:1,h6:1 },
      SCROLL_EXTRA_PIXELS = 100,
      MH_EXTRA_WIDTH = 10, // Amount to account for padding/border of mouse highlight
      isShowingDebugPoints = false,
      hlbElement,
      isKeyStillDown,
      lastMoveCommand,
      $lastPicked,
      // Queue of key navigation commands
      navQueue = [],
      // Approximate amount of time for one animation frame
      ONE_ANIMATION_FRAME_MS = 16,  // 16ms is about 60fps
      // Method for animation
      requestFrame = window.requestAnimationFrame || window.msRequestAnimationFrame ||
        function (fn) {
          return setTimeout(fn, ONE_ANIMATION_FRAME_MS)
        },
      isNavigationEnabled = labs.isEnabled('arrowKeyNav');

    // Move the highlight in the direction requested
    // We start with a point in the middle of the highlight
    // Then move the point in the direction until we
    // are outside of the current highlight and we can pick something from that point.
    // Whenever the point gets close to the edge, we pan/scroll to bring up new content until we cant anymore.
    function onNavCommand(event, keyName) {
      if (isKeyStillDown) {
        return;
      }

      if (SC_DEV) {
        $('.sc-debug-dots').remove();  // Remove last debugging dots
      }

      navQueue.push({keyName: keyName, isShifted: event.shiftKey });

      clearKeyRepeat();
      isKeyStillDown = true; // Assume it's down until it's let up

      if (navQueue.length === 1) {
        // Key was just pressed
        dequeNextCommand();
      }
      // else will wait until current move is finished
    }

    function clearKeyRepeat() {
      isKeyRepeating = false;
      isKeyStillDown = false;
      clearTimeout(repeatDelayTimer);
    }

    // Execute the next navigation command off the front of the queue
    function dequeNextCommand() {
      var nextCommand = navQueue.shift();
      if (nextCommand) {
        lastMoveCommand = null;
        var keyName = nextCommand.keyName;

        // Non-movement commands
        if (keyName === 'space') {
          onSpace();
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
        setIsScrollTrackingEnabled(true);
      }
    }

    function onMovementCommand(nextMove) {
      // Movement commands
      hlbElement = hlb.getElement();

      if (hlbElement && performHLBScroll(nextMove)) {
        return; // HLB could scroll -- finish
      }

      isNavigationEnabled && performMovement(nextMove);
    }

    // TODO Use bottoms of lines when scrolling down, so that the bottom of a line
    // matches with the bottom of the HLB
    function getHLBLineTops(currTop) {
      // Measure height of one line for first visible text node
      var nodeIterator =
            document.createNodeIterator(hlbElement, NodeFilter.SHOW_TEXT, null, false),
          range = document.createRange(),
          lineTops = [],
          hlbZoom = common.getTransform($(hlbElement));

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

    // Scroll HLB and return truthy value if a significant scroll occured
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
          dequeNextCommand();
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
          var hasMoreToScroll = direction > 0 ? midAnimationTop < maxTop - MIN_SCROLL : midAnimationTop > MIN_SCROLL;
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

    function performMovement(nextMove) {
      if (hlbElement) {
        prepareHLBMovement();
      }

      var type = nextMove.keyName,
        isShifted = nextMove.isShifted;

      switch (type) {
        case 'up':
          moveInDirection(0, -1, isShifted);
          break;
        case 'down':
          moveInDirection(0, 1, isShifted);
          break;
        case 'left':
          moveInDirection(-1, 0, isShifted);
          break;
        case 'right':
          moveInDirection(1, 0, isShifted);
          break;
        case 'heading':
          moveByTagName(HEADING_TAGS, isShifted);
          break;
        default:
          SC_DEV && console.log('Illegal command');
      }
    }

    // Will move HLB instead of highlight
    function prepareHLBMovement() {
      // Hide HLB so it doesn't interfere with getElementFromPoint
      hlbElement.style.display = 'none'
    }

    function fail() {
      SC_DEV && console.log('Fail');
      navQueue = [];  // Don't keep trying
      setIsScrollTrackingEnabled(true);

      if (hlbElement) {
        SC_DEV && console.log('Close HLB');
        sitecues.emit('hlb/toggle'); // Nothing found .. close HLB and enable highlight on last known item
      }
    }

    function succeed(doAllowRepeat) {
      SC_DEV && console.log('Succeed');
      if (hlb.getElement()) {
        // Open new HLB
        SC_DEV && console.log('Retarget HLB');
        sitecues.emit('hlb/retarget');
      }
      else if (doAllowRepeat && isKeyStillDown && lastMoveCommand) {
        // For movement, we need a delay between commands, otherwise it can happen too fast
        var isFirstRepeat = !isKeyRepeating,
          repeatDelay = isFirstRepeat ? HIGHLIGHT_MOVE_FIRST_REPEAT_DELAY_MS : HIGHLIGHT_MOVE_NEXT_REPEAT_DELAY_MS;
        // Repeat last command if key is still pressed down
        isKeyRepeating = true;
        repeatDelayTimer = setTimeout(function() {
          onMovementCommand(lastMoveCommand);
        }, repeatDelay);
        return;
      }

      dequeNextCommand();
    }

    // Don't allow the mouse highlight to follow scroll events from keyboard panning
    function setIsScrollTrackingEnabled(doTrackScroll) {
      sitecues.emit('mh/track-scroll', doTrackScroll);
    }

    function moveInDirection(horizDir, vertDir, isShifted) {

      var
        highlight = mh.getHighlight(),

        // *** Window size ***
        winRight = window.innerWidth - 1,
        winBottom = window.innerHeight - 1,

        // ** Panning state **
        // Starting pan time and location
        startPanTime,
        lastPanX = window.pageXOffset,
        lastPanY = window.pageYOffset,
        // Farthest panning could possibly go
        maxPanUp = 0,
        maxPanLeft = zoomMod.getBodyLeft(),
        maxPanRight = zoomMod.getBodyRight() - winRight,
        maxPanDown = document.body.scrollHeight - winBottom,
        // Target end point for panning
        targetPanLeft,
        targetPanRight,
        targetPanUp,
        targetPanDown,

        // *** Highlight state ***
        lastPickedRect = getHighlightRect(highlight, lastPanX, lastPanY),
        doPickNewHighlight,

        // *** Current position and direction of dot movement ***
        isHorizMovement = !vertDir,
        isVertMovement = !isHorizMovement,
        // x start point will be at the left edge, middle or right edge
        // depending on whether horizDir is -1, 0 or 1
        x = Math.floor(constrained(lastPickedRect.left + (1 + horizDir) * lastPickedRect.width / 2, 0, winRight)),
        // y start point will be at the top edge, middle or bottom edge
        // depending on whether vertDir is -1, 0 or 1
        y = Math.floor(constrained(lastPickedRect.top + (1 + vertDir) * lastPickedRect.height / 2, 0, winBottom)),

        // *** Spread state for dots as we go farther out (how it fans out) ****
        // The minimum size of a row (spread is how far from the center do to venture on that row)
        minSpread = Math.max((isHorizMovement ? lastPickedRect.height : lastPickedRect.width) / 2, SPREAD_STEP_SIZE + 1),
        // How many rows of points from the original aka how far from the original are we?
        distanceFromOriginal = 0,
        // How fast to pan -- if HLB we want to pan immediately (better UX)
        pixelsToPanPerMs = hlbElement ? PIXELS_TO_PAN_PER_MS_HLB_SEARCH : PIXELS_TO_PAN_PER_MS_HIGHLIGHT;

      isShowingDebugPoints = SC_DEV && isShifted; // Show debugging dots if shift is pressed
      $lastPicked = highlight.picked;

      function testPointIfOnscreen(x, y) {
        if (x < 0 || y < 0 || x > winRight || y > winBottom) {
          return null;
        }
        return testPoint(x, y, $lastPicked, 'blue');
      }

      function testNextRowOfPointsAt(x, y) {
        ++distanceFromOriginal;

        var
          // Can we pick something from the center dot?
          $picked = testPoint(x, y, $lastPicked, 'red'),
          stepSize = isHorizMovement ? STEP_SIZE_HORIZ : STEP_SIZE_VERT,
          // How far from center dot will we check?
          spreadEnd = constrained(distanceFromOriginal * stepSize * SPREAD_SLOPE, minSpread, MAX_SPREAD),
          // These are to enable the cross-hatch pattern that allows fewer points to be more effective
          toggleExtraX = 0,
          toggleExtraY = 0,
          spreadStart = isHorizMovement ? (SPREAD_STEP_SIZE * ((distanceFromOriginal % 2) ? .7 : 1.2)) : SPREAD_STEP_SIZE;

        // Each iteration of this loop will test another dot on the current row of dots
        // spread out from the red center dot
        for (var spreadDistance = spreadStart; !$picked && spreadDistance < spreadEnd; spreadDistance += SPREAD_STEP_SIZE) {
          if (isVertMovement) {
            // Enable crosshatch pattern
            toggleExtraY = toggleExtraY ? 0 : SPREAD_STEP_SIZE / 2
          }

          // Test dots in orthogonal directions from base direction of movement
          // Spreading out in a fan shape in the direction of travel
          $picked =
            testPointIfOnscreen(x - isVertMovement * spreadDistance + toggleExtraX, y - isHorizMovement * spreadDistance + toggleExtraY) ||
            testPointIfOnscreen(x + isVertMovement * spreadDistance + toggleExtraX, y + isHorizMovement * spreadDistance + toggleExtraY);
        }

        if ($picked &&
          isValidDirectionForNewHighlight(lastPickedRect, $picked, lastPanX, lastPanY, horizDir, vertDir) &&
          tryHighlight($picked)) {
          // Pan until highlight is fully visible onscreen (if necessary)
          var pickedRect = mh.getHighlight().fixedContentRect;

          if (horizDir < 0 && pickedRect.left < 0) {
            // Pan left far enough so that full width of the highlight is visible
            targetPanLeft = lastPanX + pickedRect.left - VISIBLE_SPACE_AROUND_HIGHLIGHT;
          }
          else if (horizDir > 0 && pickedRect.right > winRight) {
            // Pan right far enough so that full width of the highlight is visible
            targetPanRight = lastPanX + pickedRect.right - winRight + VISIBLE_SPACE_AROUND_HIGHLIGHT;
          }
          else if (vertDir < 0 && pickedRect.top < 0) {
            // Pan up far enough so that the full height of the highlight is visible
            targetPanUp = lastPanY + pickedRect.top - VISIBLE_SPACE_AROUND_HIGHLIGHT;
          }
          else if (vertDir > 0 && pickedRect.bottom > winBottom) {
            targetPanDown = lastPanY + pickedRect.bottom - winBottom + VISIBLE_SPACE_AROUND_HIGHLIGHT;
          }
          else {
            // No need to pan -- finish up
            succeed(!hlbElement);
            return true;
          }

          // Start final highlight panning after all other operations are finished
          startPanning(false);
          return true;
        }

        return false; // Nothing picked yet
      }

      function startPanning(isHighlightStillNeeded) {
        setIsScrollTrackingEnabled(false);

        targetPanUp = Math.floor(constrained(targetPanUp, maxPanUp, maxPanDown));
        targetPanLeft = Math.floor(constrained(targetPanLeft, maxPanLeft, maxPanRight));
        targetPanRight = Math.floor(constrained(targetPanRight, maxPanLeft, maxPanRight));
        targetPanDown = Math.floor(constrained(targetPanDown, maxPanUp, maxPanDown));
        lastPanX = window.pageXOffset;
        lastPanY = window.pageYOffset;
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
        if (doPickNewHighlight && testNextRowOfPointsAt(x, y)) {
          // FOUND SOMETHING!
          return;
        }

        if (isPanningTargetReached(attemptPanX, attemptPanY)) {
          // THE TARGET HAS BEEN REACHED!
          if (doPickNewHighlight) {
            // Was not successful
            fail();
          }
          else {
            // Successful -- already had a highlight
            succeed(!hlbElement);
          }
          return;
        }

        // Continue panning
        requestFrame(panInDirection);
      }

      // Go quickly through visible possibilities
      while (true) {
        x += horizDir * STEP_SIZE_HORIZ;
        y += vertDir * STEP_SIZE_VERT;
        var panX = x < 0 ? -x : Math.min(winRight - x, 0),
          panY = y < 0 ? -y : Math.min(winBottom - y, 0);

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

        if (testNextRowOfPointsAt(x, y)) {
          break;
        }
      }
    }

    // Ensure that the entire newly picked item's rect is in the correct direction
    // It may not be if the spread picks an object that covers a a large area
    function isValidDirectionForNewHighlight(lastPickedRect, $picked, lastPanX, lastPanY, horizDir, vertDir) {
      var newRect = $picked[0].getBoundingClientRect(),
        FUZZ_FACTOR = 9,
        panX = window.pageXOffset,
        panY = window.pageYOffset;
      if (horizDir === 1) {
        // Correct move to the right?
        return newRect.left + panX + FUZZ_FACTOR > lastPickedRect.right + lastPanX;
      }
      if (horizDir === -1) {
        // Correct move to the left?
        return newRect.right + panX - FUZZ_FACTOR < lastPickedRect.left + lastPanX;
      }
      if (vertDir === 1) {
        // Correct move down?
        return newRect.top + panY + FUZZ_FACTOR > lastPickedRect.bottom + lastPanY;
      }

      // Correct move up?
      return newRect.bottom + panY - FUZZ_FACTOR < lastPickedRect.top + lastPanY;
    }

    // The current target that we might want to pick/highlight
    // is not an ancestor of the last picked item, or vice-versa
    function isValidTarget(target, $lastPicked) {
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
      return sitecues.highlight($picked, false, false, doKeepHighlightHidden);
    }

    function moveByTagName(acceptableTagsMap, isReverse) {
      function doesMatchTags(element) {
        if (!acceptableTagsMap[element.localName]) {
          return;
        }
        if (!isValidTarget(element, $lastPicked)) {
          return;
        }

        if (! $lastPicked.text().trim()) {
          return; // No text
        }

        var $picked = $(element);

        if (!$picked || !isValidTarget($picked[0], $lastPicked)) {
          return;
        }

        if (!tryHighlight($picked)) {
          return; // Couldn't highlight
        }

        // Successful highlight
        return true;
      }

      var $lastPicked = mh.getHighlight().picked,
        treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);

      // Set the starting point (can do with tree walker but doesn't look like the similar node iterator API can do this)
      treeWalker.currentNode = $lastPicked[0];

      while (true) {
        var newNode = isReverse ? treeWalker.previousNode() : treeWalker.nextNode();
        if (!newNode) {
          fail();
          break;
        }
        else if (doesMatchTags(newNode)) {
          scrollToHighlight();
          succeed();
          break;
        }
      }
    }

    function scrollToHighlight() {
      var highlightRect = mh.getHighlight().absoluteRect;
      window.scrollTo(highlightRect.left - SCROLL_EXTRA_PIXELS, highlightRect.top - SCROLL_EXTRA_PIXELS);
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

    function onSpace() {
      if (hlb.getElement() || mh.getHighlight().isVisible) {
        // Has an HLB or a highlight -- toggle HLB
        sitecues.emit('hlb/toggle');
      }
      else if (isNavigationEnabled) {
        // No highlight -- make one
        sitecues.emit('mh/autopick');
      }
    }

    $(window).on('keyup', function() {
      clearTimeout(repeatDelayTimer);
      isKeyStillDown = false;
      isKeyRepeating = false;
    });

    function onEscape() {
      if (hlb.getElement()) {
        sitecues.emit('hlb/toggle');
      }
      else {
        // TODO next arrow key is still moving highlight
        // Probably the invisible mouse cursor is messing us up as well
        sitecues.emit('mh/hide', true);
        navQueue = []; // No highlight -- can't process any more nav keys in the queue
      }
    }

    sitecues.on('key/nav key/space key/esc', onNavCommand);

    callback();
  });
});
