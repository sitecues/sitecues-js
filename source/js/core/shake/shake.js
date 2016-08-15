/**
 * Mouseshake feature
 * - Value of shake vigor at any one time is 0-MAX_SHAKE_VIGOR
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

  var lastMoves = [],
    lastShakeTimeout = 0,
    lastShakeVigor = 0,
    lastShakeVigorPercent = 0,
    MIN_DIR_SWITCHES_FOR_SHAKE = constants.MIN_DIR_SWITCHES_FOR_SHAKE,
    POSITIONS_ARRAY_SIZE = constants.POSITIONS_ARRAY_SIZE,
    MIN_SHAKE_DIST = constants.MIN_SHAKE_DIST,
    MAX_SHAKE_DIST = constants.MAX_DIST_NON_SHAKE_AXIS,
    MAX_SHAKE_VIGOR = constants.MAX_SHAKE_VIGOR,
    MAX_SHAKE_VIGOR_DECREASE = constants.MAX_SHAKE_VIGOR_DECREASE,
    SHAKE_DECREASE_DIVISOR = constants.SHAKE_DECREASE_DIVISOR,
    SHAKE_INCREASE_POWER = constants.SHAKE_INCREASE_POWER,
    MAX_SHAKE_VIGOR_INCREASE = constants.MAX_SHAKE_VIGOR_INCREASE,
    MIN_MOVE_SIZE_FOR_SHAKE = constants.MIN_MOVE_SIZE_FOR_SHAKE,
    METRIC_THRESHOLD_SHAKE_PERCENT = constants.METRIC_THRESHOLD_SHAKE_PERCENT;

  function reset() {
    if (SC_DEV) {
      console.log('reset mouseshake');
    }
    lastMoves = [];
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
      prevMove = lastMoves[0],
      xDir = lastMoves[1].x > prevMove.x ? 1 : -1,
      yDir = lastMoves[1].y > prevMove.y ? 1 : -1,
      totalDist = 0,
      xDirectionSwitches = 0,
      yDirectionSwitches = 0,
      distanceRequirement = lastShakeVigor ? 0 : MIN_SHAKE_DIST;

    lastMoves.slice(1).forEach(function(currMove) {
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
      averageDist: totalDist / POSITIONS_ARRAY_SIZE
    };
  }

  function getShakeVigorIncrease() {
    var
      isShakeX,
      isShakeY,
      isShake,
      totalXDist,
      totalYDist,
      movementSummary = getMovementSummary(lastMoves),
      currMove = lastMoves[lastMoves.length - 1];

    if (lastShakeVigor) {
      // Was already shaking -- make it easy to keep it going
      isShake = movementSummary.xSwitches || movementSummary.ySwitches;
    }
    else {
      // New shake -- be more stringent
      isShakeX = (movementSummary.xSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE);
      isShakeY = (movementSummary.ySwitches >= MIN_DIR_SWITCHES_FOR_SHAKE);
      if (isShakeX && isShakeY) {
        // Horizontal AND vertical
        isShake = true;
      }
      else if (isShakeX) {
        // Horizontal only -- require small total vertical movement
        totalYDist = Math.abs(currMove.y - lastMoves[0].y);
        isShake = totalYDist < MAX_SHAKE_DIST;
      }
      else if (isShakeX) {
        // Vertical only -- require small total horizontal movement
        totalXDist = Math.abs(currMove.x - lastMoves[0].x);
        isShake = totalXDist < MAX_SHAKE_DIST;
      }
    }

    if (isShake) {
      return Math.min(Math.pow(movementSummary.averageDist, SHAKE_INCREASE_POWER), MAX_SHAKE_VIGOR_INCREASE); // Shake vigor grows exponentially with last move distance
    }
  }

  function getShakeVigorDecrease(lastDistance) {
    // Shake factor shrinks back down as mouse moves (faster as speed increases)
    return Math.min(lastDistance / SHAKE_DECREASE_DIVISOR, MAX_SHAKE_VIGOR_DECREASE);
  }

  function onMouseMove(evt) {
    clearTimeout(lastShakeTimeout);

    // Add move to FIFO array
    lastMoves.push({x: evt.clientX, y: evt.clientY, t: evt.timeStamp});

    // Too few mouse moves to analyze: return early
    if (lastMoves.length < POSITIONS_ARRAY_SIZE) {
      return;
    }

    var shakeVigor = getShakeVigor(evt),
      shakeVigorPercent;

    if (shakeVigor !== lastShakeVigor) {
      shakeVigorPercent = Math.round(100 * shakeVigor / MAX_SHAKE_VIGOR);
      fireNotifications(shakeVigorPercent);
      lastShakeVigor = shakeVigor;
      lastShakeVigorPercent = shakeVigorPercent;
    }

    lastMoves.shift();
  }

  function fireNotifications(shakeVigorPercent) {
    // Internal change event
    lastShakeTimeout = nativeFn.setTimeout(function() {
      fireShakeVigorChange(shakeVigorPercent);
    }, 0);

    // Debugging
    if (SC_DEV) {
      console.log(shakeVigorPercent);
    }

    // Metric
    // Fires only when it goes over the threshold, to limit network requests
    if (shakeVigorPercent >= METRIC_THRESHOLD_SHAKE_PERCENT && lastShakeVigorPercent < METRIC_THRESHOLD_SHAKE_PERCENT) {
      nativeFn.setTimeout(function() {
        fireShakeVigorMetric(shakeVigorPercent);
      }, 0);
    }
  }

  function getShakeVigor(evt) {
    var prevMove = lastMoves[length - 2],
      lastDistance = Math.abs(evt.clientX - prevMove.x) + Math.abs(evt.clientY - prevMove.y),
      shakeVigor,
      isShakeIncreaseAllowed = lastShakeVigor || lastDistance >= MIN_MOVE_SIZE_FOR_SHAKE,
      shakeVigorIncrease = isShakeIncreaseAllowed && getShakeVigorIncrease(),
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

  function incrementSessionShakes() {
    if (!platform.isStorageUnsupported) {
      var numShakes = sessionStorage.getItem(constants.SESSION_SHAKE_COUNT_KEY) || 0;
      ++ numShakes;
      sessionStorage.setItem(constants.SESSION_SHAKE_COUNT_KEY, numShakes);
      return numShakes;
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

  function fireShakeVigorChange(shakeVigorPercent) {
    // TODO use this or remove it based on metrics
    events.emit('core/mouseshake', shakeVigorPercent);
  }

  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
    domEvents.on(document, 'mouseleave', onMouseLeave);
  }

  return {
    init: init
  };
});
