// TODO
// Unit tests
// Better original pick start
// Bug -- hold down arrow key, gets jerky -- not sure what we should do here
// Tab keys, enter
// IE HLB dimmer must be outline or will catch pointer events
// HLB transition
// HLB work with arrow keys to scroll inside HLB
// Mouse out of HLB after reached with keys not working

sitecues.def('mouse-highlight/move-keys', function(picker, callback) {
  'use strict';
  sitecues.use('jquery', 'mouse-highlight', 'highlight-box', 'platform', 'hlb/dimmer', 'mouse-highlight/highlight-position',
    'mouse-highlight/picker', 'zoom', 'util/geo', function($, mh, hlb, platform, dimmer, mhpos, picker, zoomMod, geo) {

    var STEP_SIZE = 24,
      SPREAD_STEP_SIZE = 32,
      // How quickly do we fan out in our point testing?
      // If this is too large, we will go diagonally too often. Too small and we miss stuff that's not quite in line
      SPREAD_SLOPE = 0.1,
      MAX_SPREAD = 200,
      PIXELS_TO_PAN_PER_MS = 0.2,
      PIXELS_TO_PAN_PER_MS_HLB = 2,
      MAX_PIXELS_TO_PAN = 999,
      VISIBLE_SPACE_AROUND_HIGHLIGHT = 50,
      HEADING_TAGS = { h1:1,h2:1,h3:1,h4:1,h5:1,h6:1 },
      SCROLL_EXTRA_PIXELS = 100,
      REENABLE_MOUSE_FOLLOW_MS = 2000,
      MIN_PAN_TRY_MS = 100,
      reenableMouseFollowTimer,
      MH_EXTRA_WIDTH = 10, // Amount to account for padding/border of mouse highlight
      MIN_SIGNIFICANT_HLB_SCROLL = 3,
      isShowingDebugPoints = false,
      hlbElement,
      // Queue of key navigation commands
      navQueue = [],
      // Method for animation
      requestFrame = window.requestAnimationFrame || window.msRequestAnimationFrame ||
        function (fn) {
          return setTimeout(fn, 16)
        };  // 16ms is about 60fps

    // Move the highlight in the direction requested
    // We start with a point in the middle of the highlight
    // Then move the point in the direction until we
    // are outside of the current highlight and we can pick something from that point.
    // Whenever the point gets close to the edge, we pan/scroll to bring up new content until we cant anymore.
    function onNavCommand(event, keyName) {
      if (SC_DEV) {
        $('.sc-debug-dots').remove();  // Remove last debugging dots
      }

      navQueue.push({keyName: keyName, isShifted: event.shiftKey });

      if (navQueue.length === 1) {
        dequeNextCommand();
      }
      // else will wait until current move is finished
    }

    // Execute the next navigagtion command off the front of the queue
    function dequeNextCommand() {
      var nextMove = navQueue.shift();
      if (nextMove) {
        var keyName = nextMove.keyName;

        // Non-movement commands
        if (keyName === 'space') {
          onSpace();
        }
        else if (keyName === 'esc') {
          onEscape(keyName);
        }
        else {
          onMovementCommand(nextMove);
        }
      }
      else {
        // TODO why do we need this hack? It seems to be necessary to avoid having the highlight jump to an invisible mouse
        clearTimeout(reenableMouseFollowTimer);
        reenableMouseFollowTimer = setTimeout(function() { setIsMouseEnabled(true); }, REENABLE_MOUSE_FOLLOW_MS);
      }
    }

    function onMovementCommand(nextMove) {
      // TODO should we use the real line-height as getLineHeight() in highlight-position.js does?
      // Movement commands
      hlbElement = hlb.getElement();

      if (hlbElement && performHLBScroll(nextMove)) {
        return; // HLB could scroll -- finish
      }

      performMovement(nextMove);
    }

    function getHLBLineHeight() {
      var range = document.createRange();
      range.selectNodeContents(hlbElement);
      return range.getClientRects()[0].height / zoomMod.getCompletedZoom(); // TODO * HLBZoom (1.5)?
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
        currTop = hlbElement.scrollTop,  // Where it's scrolled to now
        newTop,  // Where we want to scroll to
        lineHeight;

        if (!keyEntry) {
          return;  // Not an HLB scroll command
        }

        switch (keyEntry.type) {
          case 'page':
            // Pageup/pagedown default behavior always affect window/document scroll
            // (simultaneously with element's local scroll).
            // So prevent default and define new scroll logic.
            newTop = currTop + hlbElement.offsetHeight * keyEntry.dir;
            break;
          case 'line':
            lineHeight = getHLBLineHeight();
            newTop = currTop + keyEntry.dir * lineHeight;
            break;
          case 'doc':
            newTop = keyEntry.dir < 0 ? 0 : hlbElement.scrollHeight;
            break;
          // default: return; // can't happen
        }

        hlbElement.scrollTop = Math.max(0, newTop);
        return (hlbElement.scrollTop - currTop) > MIN_SIGNIFICANT_HLB_SCROLL;
    }

    function performMovement(nextMove) {
      if (hlbElement) {
        prepareHLBMovement();
      }

      setIsMouseEnabled(false);

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
          SC_DEV && console.log('illegal command');
      }
    }

    // Will move HLB instead of highlight
    function prepareHLBMovement() {
      // Hide HLB so it doesn't interfere with getElementFromPoint
      $(hlb.getElement()).css('display', 'none');
    }

    function fail() {
      SC_DEV && console.log('Fail');
      navQueue = [];  // Don't keep trying
      setIsMouseEnabled(true);

      // TODO check this case and make sure it works -- the HLB is probably is display: none right now
      if (hlbElement) {
        SC_DEV && console.log('Close HLB');
        sitecues.emit('hlb/toggle'); // Nothing found .. close HLB
      }
    }

    function succeed() {
      SC_DEV && console.log('Succeed');
      if (hlb.getElement()) {
        // Open new HLB
        SC_DEV && console.log('Retarget HLB');
        sitecues.emit('hlb/retarget');
      }
      dequeNextCommand();
    }

    function setIsMouseEnabled(isMouseEnabled) {
      clearTimeout(reenableMouseFollowTimer);

      // Pointer-events are not supported in IE 9/10
      // but at least we can make sure the mouse-highlight doesn't follow the invisible mouse during panning
      sitecues.emit('mh/follow-mouse', isMouseEnabled);

      // Reenable dimmer element
      setIsDimmerCatchingMouseEvents(isMouseEnabled);
    }

    function setIsDimmerCatchingMouseEvents(isDimmerCatchingMouseEvents) {
      var isLegacyIE = platform.browser.isIE && platform.browser.version < 11;
      var property, value;
      if (isLegacyIE) {
        // TODO make dimmer an outline so this works in IE9/10, or don't allow HLB movement in IE9/10
        property = 'display';
        value = isDimmerCatchingMouseEvents ? 'block' : 'none';
      }
      else {
        property = 'pointerEvents';
        value = isDimmerCatchingMouseEvents ? '' : 'none';
      }

      $(dimmer.getDimmerElement()).css(property, value);
    }

    function moveInDirection(horizDir, vertDir, isShifted) {
      isShowingDebugPoints = SC_DEV && isShifted; // Show debugging dots if shift is pressed

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
        $lastPicked = highlight.picked,
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
        pixelsToPanPerMs = hlbElement ? PIXELS_TO_PAN_PER_MS_HLB : PIXELS_TO_PAN_PER_MS;


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
          // How far from center dot will we check?
          spreadEnd = constrained(distanceFromOriginal * STEP_SIZE * SPREAD_SLOPE, minSpread, MAX_SPREAD),
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
          sitecues.highlight($picked[0], false)) {
          clearHighlightIfInDimmer();
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
            succeed();
            return true;
          }

          // Start final highlight panning after all other operations are finished
          startPanning(false);
          return true;
        }

        return false; // Nothing picked yet
      }

      function startPanning(isHighlightStillNeeded) {
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
            succeed();
          }
          return;
        }

        // TODO safety check to avoid infinite loop
        // E.g. if last position was reached and the scroll position didn't change

        // Continue panning
        requestFrame(panInDirection);
      }

      // Go quickly through visible possibilities
      while (true) {
        x += horizDir * STEP_SIZE;
        y += vertDir * STEP_SIZE;
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

    function moveByTagName(acceptableTagsMap, isReverse) {
      function doesMatchTags(element) {
        if (!acceptableTagsMap[element.localName]) {
          return NodeFilter.FILTER_SKIP; // Still consider children
        }
        if (!isValidTarget(element, $lastPicked)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (! $lastPicked.text().trim()) {
          return NodeFilter.FILTER_REJECT; // No text
        }

        var $picked = $(element);

        if (!$picked || !isValidTarget($picked[0], $lastPicked)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!sitecues.highlight($picked, false)) {
          return NodeFilter.FILTER_REJECT; // Couldn't highlight
        }

        // Successful highlight
        return NodeFilter.FILTER_ACCEPT;
      }

      var $lastPicked = mh.getHighlight().picked,
        treeWalker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          { acceptNode: doesMatchTags });

      // Set the starting point (can do with tree walker but doesn't look like the similar node iterator API can do this)
      treeWalker.currentNode = $lastPicked[0];

      if (isReverse ? treeWalker.previousNode() : treeWalker.nextNode()) {
        clearHighlightIfInDimmer();
        scrollToHighlight();
        succeed();
      }
      else {
        fail();
      }
    }

    // When moving the HLB, clear any highlight we just made
    // as it's distracting/unnatural when in the background dimmed area.
    // TODO how about we don't visibly show the highlight in the first place? Makes more sense.
    function clearHighlightIfInDimmer() {
      if (hlbElement) {
        sitecues.emit('mh/clear');
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
      else {
        // No highlight -- make one
        sitecues.emit('mh/center');
      }
    }

    function onEscape() {
      if (hlb.getElement()) {
        sitecues.emit('hlb/toggle');
      }
      else {
        sitecues.emit('mh/clear');
        navQueue = []; // No highlight -- can't process any more nav keys in the queue
      }
    }

    sitecues.on('key/nav key/space key/esc', onNavCommand);

    callback();
  });
});
