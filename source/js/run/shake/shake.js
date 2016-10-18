/**
 * Mouseshake feature
 * - Value of shake vigor at any one time is 0-MAX_SHAKE_VIGOR (internal value)
 * - Value of shake vigor percent is 0-100 (external value -- used to communicate with other modules)
 * - For now, only fires a metric so that we can measure the potential usefulness
 * - Ideas for use -- make mouse larger, make badge glow temporarily
 */
define([
  'run/metric/metric',
  // 'run/events',
  'run/dom-events',
  'run/shake/constants',
  'run/platform',
  'mini-core/native-global'
], function(metric,
            // events,
            domEvents,
            constants,
            platform,
            nativeGlobal) {

  'use strict';

  var mousePositionsQueue = [],
    lastShakeTimeout,
    lastShakeVigor = 0,
    lastShakeVigorPercent = 0,
    canFireMetricAgain = true,
    MIN_DIR_SWITCHES_FOR_SHAKE = constants.MIN_DIR_SWITCHES_FOR_SHAKE,
    MOUSE_POSITIONS_ARRAY_SIZE = constants.MOUSE_POSITIONS_ARRAY_SIZE,
    MIN_SHAKE_DIST = constants.MIN_SHAKE_DIST,
    MAX_DIST_NON_SHAKE_AXIS = constants.MAX_DIST_NON_SHAKE_AXIS,
    MAX_SHAKE_VIGOR = constants.MAX_SHAKE_VIGOR,
    MIN_SHAKE_VIGOR_DECREASE = constants.MIN_SHAKE_VIGOR_DECREASE,
    MAX_SHAKE_VIGOR_DECREASE = constants.MAX_SHAKE_VIGOR_DECREASE,
    SHAKE_DECREASE_MULTIPLIER = constants.SHAKE_DECREASE_MULTIPLIER,
    SHAKE_INCREASE_POWER = constants.SHAKE_INCREASE_POWER,
    MAX_SHAKE_VIGOR_INCREASE = constants.MAX_SHAKE_VIGOR_INCREASE,
    MIN_MOVE_SIZE_FOR_SHAKE = constants.MIN_MOVE_SIZE_FOR_SHAKE,
    MAX_TIME_BETWEEN_MOVES = constants.MAX_TIME_BETWEEN_MOVES,
    METRIC_THRESHOLD_SHAKE_PERCENT_FIRE = constants.METRIC_THRESHOLD_SHAKE_PERCENT_FIRE,
    METRIC_THRESHOLD_SHAKE_PERCENT_RESET = constants.METRIC_THRESHOLD_SHAKE_PERCENT_RESET;

  function reset() {
    mousePositionsQueue = [];
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
      prevMove = mousePositionsQueue[0],
      xDir = mousePositionsQueue[1].x > prevMove.x ? 1 : -1,
      yDir = mousePositionsQueue[1].y > prevMove.y ? 1 : -1,
      totalDist = 0,
      xDirectionSwitches = 0,
      yDirectionSwitches = 0,
      distanceRequirement = lastShakeVigor ? 0 : MIN_SHAKE_DIST,
      minX = prevMove.x,
      minY = prevMove.y,
      maxX = minX,
      maxY = minY;

    mousePositionsQueue.slice(1).forEach(function(currMove) {
      var
        x = currMove.x,
        y = currMove.y,
        xDelta = x - prevMove.x,
        xDist = Math.abs(xDelta),
        yDelta = y - prevMove.y,
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

      if (x < minX) {
        minX = x;
      }
      else if (x > maxX) {
        maxX = x;
      }

      if (y < minY) {
        minY = y;
      }
      else if (y > maxY) {
        maxY = y;
      }

      prevMove = currMove;
    });

    return {
      xSwitches: xDirectionSwitches,
      ySwitches: yDirectionSwitches,
      totalXDist: maxX - minX,
      totalYDist: maxY - minY
    };
  }

  function getShakeVigorIncrease() {
    var
      isShakeX,
      isShakeY,
      movementSummary = getMovementSummary(mousePositionsQueue);

    function isMouseShake() {
      if (lastShakeVigor) {
        // Was already shaking -- make it easy to keep it going
        return movementSummary.xSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE ||
          movementSummary.ySwitches >= MIN_DIR_SWITCHES_FOR_SHAKE;
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
        return movementSummary.totalYDist < MAX_DIST_NON_SHAKE_AXIS;
      }

      if (isShakeY) {
        // Vertical only -- require small total horizontal movement
        return movementSummary.totalXDist < MAX_DIST_NON_SHAKE_AXIS;
      }
    }

    if (isMouseShake()) {
      var distanceFactor = Math.max(movementSummary.totalXDist, movementSummary.totalYDist);
      return Math.min(Math.pow(distanceFactor, SHAKE_INCREASE_POWER), MAX_SHAKE_VIGOR_INCREASE); // Shake vigor grows exponentially with last move distance
    }
  }

  function getShakeVigorDecrease(lastDistance) {
    // Shake factor shrinks back down as mouse moves (faster as speed increases)
    var unboundedResult = lastDistance * SHAKE_DECREASE_MULTIPLIER,
      boundedResult = Math.max(Math.min(unboundedResult, MAX_SHAKE_VIGOR_DECREASE), MIN_SHAKE_VIGOR_DECREASE);

    return boundedResult;
  }

  function processMouseMove(x, y, t) {
    // Add move to queue
    var currMove = { x: x, y: y, t: t },
      numMoves = mousePositionsQueue.length,
      lastMove = numMoves > 0 && mousePositionsQueue[numMoves - 1];

    mousePositionsQueue.push(currMove);

    var
      lastDistance = lastMove ? getDistanceBetweenMoves(currMove, lastMove) : 0,
      shakeVigor = getShakeVigor(numMoves, lastDistance),
      shakeVigorPercent;

    if (shakeVigor !== lastShakeVigor) {
      shakeVigorPercent = Math.round(100 * shakeVigor / MAX_SHAKE_VIGOR);
      fireNotifications(shakeVigorPercent);
      lastShakeVigor = shakeVigor;
      lastShakeVigorPercent = shakeVigorPercent;
    }

    // Shift oldest item out of moves queue
    if (lastMove && numMoves > MOUSE_POSITIONS_ARRAY_SIZE) {
      mousePositionsQueue.shift();
    }
  }

  function onMouseMove(evt) {
    var x = evt.screenX,
      y = evt.screenY,
      t = evt.timeStamp,
      numMoves = mousePositionsQueue.length,
      lastMove = numMoves > 0 && mousePositionsQueue[numMoves - 1];

    if (lastMove && t - lastMove.t > MAX_TIME_BETWEEN_MOVES) {
      mousePositionsQueue = []; // Start from scratch
    }

    nativeGlobal.setTimeout(function() {
      processMouseMove(x, y, t);
    }, 0);
  }

  // Rough approximation for faster math
  function getDistanceBetweenMoves(move1, move2) {
    return Math.abs(move2.x - move1.x) + Math.abs(move2.y - move1.y);
  }

  function getShakeVigor(numMoves, lastDistance) {
    var shakeVigor,
      isShakeIncreaseAllowed = numMoves >= MOUSE_POSITIONS_ARRAY_SIZE && (lastShakeVigor || lastDistance >= MIN_MOVE_SIZE_FOR_SHAKE),
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

  function fireNotifications(shakeVigorPercent) {
    // Internal change event
    // TODO add back once we use it
    // if (!lastShakeTimeout) {
      // lastShakeTimeout = nativeGlobal.setTimeout(function() {
      //   fireShakeVigorChange(shakeVigorPercent);
      // }, constants.MS_BETWEEN_SHAKE_EVENTS);
    // }

    // Debugging
    // Too noisy for main build
    // if (SC_DEV) {
    //   console.log('Shake value: ' + shakeVigorPercent);
    // }

    // Metric
    // Fires only when it goes over the threshold, to limit network requests
    if (shakeVigorPercent >= METRIC_THRESHOLD_SHAKE_PERCENT_FIRE && canFireMetricAgain) {
      canFireMetricAgain = false;
      nativeGlobal.setTimeout(function() {
        fireShakeVigorMetric(shakeVigorPercent);
      }, 0);
    }
    else if (shakeVigorPercent < METRIC_THRESHOLD_SHAKE_PERCENT_RESET) {
      canFireMetricAgain = true;
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
  //   lastShakeTimeout = 0;
  //   events.emit('run/mouseshake', shakeVigorPercent);
  // }

  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
    domEvents.on(document, 'mouseleave', onMouseLeave);
  }

  return {
    init: init
  };
});
