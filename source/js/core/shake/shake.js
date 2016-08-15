/**
 * Mouseshake feature
 * - Value of shake vigor at any one time is 0-MAX_SHAKE_VIGOR (internal value)
 * - Value of shake vigor percent is 0-100 (external value -- used to communicate with other modules)
 * - For now, only fires a metric so that we can measure the potential usefulness
 * - Ideas for use -- make mouse larger, make badge glow temporarily
 */
define([
  'core/metric',
  'core/events',
  'core/dom-events',
  'core/shake/constants',
  'core/platform',
  'core/native-functions'
], function(metric,
            events,
            domEvents,
            constants,
            platform,
            nativeFn) {

  var recentMousePositions = [],
    lastShakeTimeout = 0,
    lastShakeVigor = 0,
    lastShakeVigorPercent = 0,
    MIN_DIR_SWITCHES_FOR_SHAKE = constants.MIN_DIR_SWITCHES_FOR_SHAKE,
    MOUSE_POSITIONS_ARRAY_SIZE = constants.MOUSE_POSITIONS_ARRAY_SIZE,
    MIN_SHAKE_DIST = constants.MIN_SHAKE_DIST,
    MAX_SHAKE_DIST = constants.MAX_DIST_NON_SHAKE_AXIS,
    MAX_SHAKE_VIGOR = constants.MAX_SHAKE_VIGOR,
    MIN_SHAKE_VIGOR_DECREASE = constants.MIN_SHAKE_VIGOR_DECREASE,
    MAX_SHAKE_VIGOR_DECREASE = constants.MAX_SHAKE_VIGOR_DECREASE,
    SHAKE_DECREASE_MULTIPLIER = constants.SHAKE_DECREASE_MULTIPLIER,
    SHAKE_INCREASE_POWER = constants.SHAKE_INCREASE_POWER,
    MAX_SHAKE_VIGOR_INCREASE = constants.MAX_SHAKE_VIGOR_INCREASE,
    MIN_MOVE_SIZE_FOR_SHAKE = constants.MIN_MOVE_SIZE_FOR_SHAKE,
    METRIC_THRESHOLD_SHAKE_PERCENT = constants.METRIC_THRESHOLD_SHAKE_PERCENT;

  function reset() {
    if (SC_DEV) {
      console.log('reset mouseshake');
    }
    recentMousePositions = [];
    clearTimeout(lastShakeTimeout);
    if (lastShakeVigor > 0) {
      lastShakeVigor = lastShakeVigorPercent = 0;
      fireNotifications(0);
    }
  }

  function onMouseLeave(evt) {
    if (evt.target === document.documentElement) {
      reset();
    }
  }

  function getMovementSummary() {
    var
      prevMove = recentMousePositions[0],
      xDir = recentMousePositions[1].x > prevMove.x ? 1 : -1,
      yDir = recentMousePositions[1].y > prevMove.y ? 1 : -1,
      totalDist = 0,
      xDirectionSwitches = 0,
      yDirectionSwitches = 0,
      distanceRequirement = lastShakeVigor ? 0 : MIN_SHAKE_DIST;

    recentMousePositions.slice(1).forEach(function(currMove) {
      var xDelta = currMove.x - prevMove.x,
        xDist = Math.abs(xDelta),
        yDelta = currMove.y - prevMove.y,
        yDist = Math.abs(yDelta),
        xDirection = xDist < distanceRequirement ? 0 : xDist / xDelta,
        yDirection = yDist < distanceRequirement ? 0 : yDist / yDelta;

      totalDist += xDist + yDist;

      // Calculate horizontal direction switches
      if (xDirection === -xDir) {
        ++ xDirectionSwitches;
        xDir = xDirection;
      }

      // Calculate vertical direction switches
      if (yDirection === -yDir) {
        ++ yDirectionSwitches;
        yDir = yDirection;
      }

      prevMove = currMove;
    });

    return {
      xSwitches: xDirectionSwitches,
      ySwitches: yDirectionSwitches,
      averageDist: totalDist / MOUSE_POSITIONS_ARRAY_SIZE
    };
  }

  function getShakeVigorIncrease(currMove) {
    var
      isShakeX,
      isShakeY,
      totalXDist,
      totalYDist,
      movementSummary = getMovementSummary(recentMousePositions);

    function isMouseShake() {
      if (lastShakeVigor) {
        // Was already shaking -- make it easy to keep it going
        return movementSummary.xSwitches || movementSummary.ySwitches;
      }

      // Possible new shake -- be more stringent
      isShakeX = (movementSummary.xSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE);
      isShakeY = (movementSummary.ySwitches >= MIN_DIR_SWITCHES_FOR_SHAKE);
      if (isShakeX && isShakeY) {
        // Horizontal AND vertical shake => is a shake
        return true;
      }

      if (isShakeX) {
        // Horizontal only -- require small total vertical movement
        totalYDist = Math.abs(currMove.y - recentMousePositions[0].y);
        return totalYDist < MAX_SHAKE_DIST;
      }

      if (isShakeX) {
        // Vertical only -- require small total horizontal movement
        totalXDist = Math.abs(currMove.x - recentMousePositions[0].x);
        return totalXDist < MAX_SHAKE_DIST;
      }
    }

    if (isMouseShake()) {
      return Math.min(Math.pow(movementSummary.averageDist, SHAKE_INCREASE_POWER), MAX_SHAKE_VIGOR_INCREASE); // Shake vigor grows exponentially with last move distance
    }
  }

  function getShakeVigorDecrease(lastDistance) {
    // Shake factor shrinks back down as mouse moves (faster as speed increases)
    var unboundedResult = lastDistance * SHAKE_DECREASE_MULTIPLIER,
      boundedResult = Math.max(Math.min(unboundedResult, MAX_SHAKE_VIGOR_DECREASE), MIN_SHAKE_VIGOR_DECREASE);

    return boundedResult;
  }

  function onMouseMove(evt) {
    clearTimeout(lastShakeTimeout);

    // Add move to FIFO array
    recentMousePositions.push({x: evt.clientX, y: evt.clientY});

    // Too few mouse moves to analyze: return early
    if (recentMousePositions.length < MOUSE_POSITIONS_ARRAY_SIZE) {
      return;
    }

    var
      currPosIndex = MOUSE_POSITIONS_ARRAY_SIZE - 1,
      shakeVigor = getShakeVigor(recentMousePositions[currPosIndex], recentMousePositions[currPosIndex - 1]),
      shakeVigorPercent;

    if (shakeVigor !== lastShakeVigor) {
      shakeVigorPercent = Math.round(100 * shakeVigor / MAX_SHAKE_VIGOR);
      fireNotifications(shakeVigorPercent);
      lastShakeVigor = shakeVigor;
      lastShakeVigorPercent = shakeVigorPercent;
    }

    // Shift oldest item out of FIFO array
    recentMousePositions.shift();
  }

  function getShakeVigor(currMove, prevMove) {
    var lastDistance = Math.abs(currMove.x - prevMove.x) + Math.abs(currMove.y - prevMove.y),
      shakeVigor,
      isShakeIncreaseAllowed = lastShakeVigor || lastDistance >= MIN_MOVE_SIZE_FOR_SHAKE,
      shakeVigorIncrease = isShakeIncreaseAllowed && getShakeVigorIncrease(currMove),
      shakeVigorDelta = shakeVigorIncrease || - getShakeVigorDecrease(lastDistance);

    shakeVigor = lastShakeVigor + shakeVigorDelta;

    if (shakeVigor < 0) {
      return 0;
    }
    else if (shakeVigor > MAX_SHAKE_VIGOR) {
      return MAX_SHAKE_VIGOR;
    }

    return Math.floor(shakeVigor);
  }

  function fireNotifications(shakeVigorPercent) {
    // Internal change event
    // TODO add back once we use it
    // lastShakeTimeout = nativeFn.setTimeout(function() {
    //   fireShakeVigorChange(shakeVigorPercent);
    // }, 0);

    // Debugging
    // Too noisy for main build
    // if (SC_DEV) {
    //   console.log('Shake value: ' + shakeVigorPercent);
    // }

    // Metric
    // Fires only when it goes over the threshold, to limit network requests
    if (shakeVigorPercent >= METRIC_THRESHOLD_SHAKE_PERCENT && lastShakeVigorPercent < METRIC_THRESHOLD_SHAKE_PERCENT) {
      nativeFn.setTimeout(function() {
        fireShakeVigorMetric(shakeVigorPercent);
      }, 0);
    }
  }

  function fireShakeVigorMetric(shakeVigorPercent) {
    var details = {
      vigor: shakeVigorPercent,
      sessionCount: incrementSessionShakes()
    };

    if (SC_DEV) {
      console.log('Mouse shake metric fired: ', JSON.stringify(details));
    }

    new metric.MouseShake(details).send();
  }

  function incrementSessionShakes() {
    if (!platform.isStorageUnsupported) {
      var numShakes = sessionStorage.getItem(constants.SESSION_SHAKE_COUNT_KEY) || 0;
      ++ numShakes;
      sessionStorage.setItem(constants.SESSION_SHAKE_COUNT_KEY, numShakes);
      return numShakes;
    }
  }

  // Add back once we use it
  // function fireShakeVigorChange(shakeVigorPercent) {
  //   events.emit('core/mouseshake', shakeVigorPercent);
  // }

  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
    domEvents.on(document, 'mouseleave', onMouseLeave);
  }

  return {
    init: init
  };
});
