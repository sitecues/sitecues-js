/**
 * Mouseshake feature
 * - For now, only fires a metric so that we can measure the potential usefulness
 * - Ideas for use -- make mouse larger, make badge glow temporarily
 */
define([
  'core/metric',
  'core/dom-events',
  'core/mousemove/constants',
  'core/native-functions'
], function(metric,
            domEvents,
            constants,
            nativeFn) {

  var lastMoves = [],
    extraZoomEffect = 0,
    extraZoomEffectStep = 0,
    lastShakeTimeout = 0,
    lastShakeSize = 0,
    MIN_DIR_SWITCHES_FOR_SHAKE = constants.MIN_DIR_SWITCHES_FOR_SHAKE,
    POSITIONS_ARRAY_SIZE = constants.POSITIONS_ARRAY_SIZE,
    SMART_CURSOR_STEP = constants.SMART_CURSOR_STEP,
    MIN_SHAKE_DIST = constants.MIN_SHAKE_DIST,
    MAX_SHAKE_DIST = constants.MAX_SHAKE_DIST,
    MAX_EXTRA_ZOOM_EFFECT = constants.MAX_EXTRA_ZOOM_EFFECT,
    MICRO_MOVE_SIZE = constants.MICRO_MOVE_SIZE;

  function getShakeSize(lastDistance) {
    var
      prevMove = lastMoves[0],
      xDir = lastMoves[1].x > prevMove.x ? 1 : -1,
      yDir = lastMoves[1].y > prevMove.y ? 1 : -1,
      index,
      isShakeX,
      isShakeY,
      isShake,
      totalXDist,
      totalYDist,
      xDirectionSwitches = 0,
      yDirectionSwitches = 0;

    for (index = 1; index < lastMoves.length; index ++) {
      var currMove = lastMoves[index],
        xDelta = currMove.x - prevMove.x,
        xDist = Math.abs(xDelta),
        yDelta = currMove.y - prevMove.y,
        yDist = Math.abs(yDelta),
        xDirection = xDist > MIN_SHAKE_DIST ? (xDist / xDelta) : 0,
        yDirection = yDist > MIN_SHAKE_DIST ? (yDist / yDelta) : 0;

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
    }

    totalXDist = Math.abs(lastMoves[lastMoves.length-1].x - lastMoves[0].x);
    isShakeX = (xDirectionSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE);
    totalYDist = Math.abs(lastMoves[lastMoves.length-1].y - lastMoves[0].y);
    isShakeY = (yDirectionSwitches >= MIN_DIR_SWITCHES_FOR_SHAKE);

    isShake = (isShakeX && isShakeY) ||
      (isShakeX && totalYDist < MAX_SHAKE_DIST) ||
      (isShakeY && totalXDist < MAX_SHAKE_DIST);

    if (isShake) {
      var lastDistanceFactor = Math.min(Math.pow(lastDistance, 1.5), 3), // Shake size grows exponentially with last move
        isExtraDirectionSwitch = (xDirectionSwitches > MIN_DIR_SWITCHES_FOR_SHAKE || yDirectionSwitches > MIN_DIR_SWITCHES_FOR_SHAKE);  // Boost for extra direction switches

      return Math.floor(lastDistanceFactor + isExtraDirectionSwitch);
    }

    return 0;
  }

  function onMouseMove(evt) {
    var lastDistance,
      prevMove,
      extraZoomEffectGoal = 0,
      shakeSize;

    clearTimeout(lastShakeTimeout);

    // Add move to LIFO array
    lastMoves.push({ x: evt.clientX, y: evt.clientY, t: evt.timeStamp });

    // Too few mouse moves to analyze: return early
    if (lastMoves.length < POSITIONS_ARRAY_SIZE) {
      return;
    }

    prevMove = lastMoves[length - 2];
    lastDistance = Math.abs(evt.clientX - prevMove.x) + Math.abs(evt.clientY - prevMove.y);

    // Small move: return early
    if (lastDistance <= MICRO_MOVE_SIZE) {
      lastMoves.shift();
      return;
    }

    shakeSize = getShakeSize(lastDistance);
    if (shakeSize > 0) {
      extraZoomEffectGoal = MAX_EXTRA_ZOOM_EFFECT;
      if (extraZoomEffectGoal > 3 - lastShakeSize) {  // Can't be past 3
        extraZoomEffectGoal = 3 - lastShakeSize;
      }
      extraZoomEffectStep += shakeSize * SMART_CURSOR_STEP;
      if (extraZoomEffect + extraZoomEffectStep > extraZoomEffectGoal) {
        extraZoomEffectStep = extraZoomEffectGoal - extraZoomEffect;
      }
    }
    else {  // Shake factor shrinks back down as mouse moves (faster as speed increases)
      var shakeReduction = Math.max(lastDistance, 15) - 15;
      extraZoomEffectStep -= Math.min(shakeReduction, 100) / 2500;
      if (extraZoomEffect < -extraZoomEffectStep) {
        extraZoomEffectStep = -extraZoomEffect;
      }
    }

    if (Math.abs(extraZoomEffectStep) >= 0.05) {
      extraZoomEffect += extraZoomEffectStep;
      extraZoomEffectStep = 0; // Use it up
      lastShakeTimeout = nativeFn.setTimeout(fireMouseShake, 0);
    }

    lastMoves.shift();
  }

  // function getEffectiveZoomForMouse() {
  //   return Math.min(lastZoom + extraZoomEffect, 3);
  // }

  function fireMouseShake(details) {
    new metric.MouseShake(details).send();
  }

  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
  }

  return {
    init: init
  };
});
