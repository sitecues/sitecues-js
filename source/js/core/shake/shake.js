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
  'core/native-functions',
  'core/shake/badge-glow'
], function(metric,
            events,
            domEvents,
            constants,
            platform,
            nativeFn,
            badgeGlow) {

  'use strict';

  var mousePositionsQueue = [],
    lastShakeChangeFiredTime = 0,
    lastShakeVigor = 0,
    lastShakeVigorPercent = 0,
    wasUnderThreshold = true,
    lastIncreaseTime,
    numShakes = 0,
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
    METRIC_THRESHOLD_SHAKE_PERCENT_RESET = constants.METRIC_THRESHOLD_SHAKE_PERCENT_RESET,
    WAIT_BEFORE_DECREASE = constants.WAIT_BEFORE_DECREASE;

  function reset() {
    mousePositionsQueue = [];
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
      xDir = mousePositionsQueue.length > 1 && mousePositionsQueue[1].x > prevMove.x ? 1 : -1,
      yDir = mousePositionsQueue.length > 1 && mousePositionsQueue[1].y > prevMove.y ? 1 : -1,
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

  function getShakeVigorDelta(isIncreaseAllowed, lastDistance, currTime) {
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

    if (isIncreaseAllowed && isMouseShake()) {
      lastIncreaseTime = currTime;
      var distanceFactor = Math.max(movementSummary.totalXDist, movementSummary.totalYDist);
      return Math.min(Math.pow(distanceFactor, SHAKE_INCREASE_POWER), MAX_SHAKE_VIGOR_INCREASE); // Shake vigor grows exponentially with last move distance
    }

    if (currTime - lastIncreaseTime > WAIT_BEFORE_DECREASE && movementSummary.xSwitches + movementSummary.ySwitches <= 1) {
      return -getShakeVigorDecrease(lastDistance);
    }

    return 0;
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
      shakeVigor = getShakeVigor(numMoves, lastDistance, lastMove),
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

    nativeFn.setTimeout(function() {
      processMouseMove(x, y, t);
    }, 0);
  }

  // Rough approximation for faster math
  function getDistanceBetweenMoves(move1, move2) {
    return Math.abs(move2.x - move1.x) + Math.abs(move2.y - move1.y);
  }

  function getShakeVigor(numMoves, lastDistance, lastMove) {
    var shakeVigor,
      isShakeIncreaseAllowed = numMoves >= MOUSE_POSITIONS_ARRAY_SIZE && (lastShakeVigor || lastDistance >= MIN_MOVE_SIZE_FOR_SHAKE),
      shakeVigorDelta = getShakeVigorDelta(isShakeIncreaseAllowed, lastDistance, lastMove.t);

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
    // Metric
    // Fires only when it goes over the threshold, to limit network requests
    var didPassThreshold;

    if (shakeVigorPercent >= METRIC_THRESHOLD_SHAKE_PERCENT_FIRE && wasUnderThreshold) {
      wasUnderThreshold = false;
      didPassThreshold = true;
      ++ numShakes;
      persistNumShakesInSession();
      nativeFn.setTimeout(function() {
        fireShakeVigorMetric(shakeVigorPercent);
      }, 0);
      fireShakeReachedThreshold(true);
    }
    else if (shakeVigorPercent < METRIC_THRESHOLD_SHAKE_PERCENT_RESET && !wasUnderThreshold) {
      wasUnderThreshold = true;
      didPassThreshold = true;
      fireShakeReachedThreshold(false);
    }

    var currentTime = getCurrentTime();
    // Fire change event when we pass the threshold or there was enough time between events
    if (didPassThreshold || shakeVigorPercent === 0 ||
        currentTime - lastShakeChangeFiredTime > constants.MS_BETWEEN_SHAKE_EVENTS) {
      lastShakeChangeFiredTime = currentTime;
      fireShakeVigorChange(shakeVigorPercent);
    }
  }

  function getCurrentTime() {
    return new Date().getTime();
  }

  function fireShakeReachedThreshold(isOn) {
    sitecues.emit('shake/did-pass-threshold', isOn);
  }

  function fireShakeVigorMetric(shakeVigorPercent) {
    var details = {
      vigor: shakeVigorPercent,
      sessionCount: getNumShakesInSession()
    };

    if (SC_DEV) {
      console.log('Mouse shake metric fired: ', JSON.stringify(details));
    }

    new metric.MouseShake(details).send();
  }

  function getNumShakesInSession() {
    return sessionStorage.getItem(constants.SESSION_SHAKE_COUNT_KEY) || 0;
  }

  function persistNumShakesInSession() {
    if (!platform.isStorageUnsupported) {
      sessionStorage.setItem(constants.SESSION_SHAKE_COUNT_KEY, numShakes);
    }
  }

  function fireShakeVigorChange(shakeVigorPercent) {
    events.emit('shake/did-change', shakeVigorPercent, numShakes);
  }

  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
    domEvents.on(document, 'mouseleave', onMouseLeave);

    badgeGlow.init();
  }

  return {
    init: init,
    getNumShakesInSession: getNumShakesInSession
  };
});
