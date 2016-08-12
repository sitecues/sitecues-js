/**
 * Mouseshake feature
 * - For now, only fires a metric so that we can measure the potential usefulness
 * - Ideas for use -- make mouse larger, make badge glow temporarily
 */
define([
  'core/metric',
  'core/dom-events',
  'core/mouseshake/constants',
  'core/native-functions'
], function(metric,
            domEvents,
            constants,
            nativeFn) {

  var lastMoves = [],
    shakeVigor = 0,
    lastShakeTimeout = 0,
    lastShakeVigor = 0,
    MIN_DIR_SWITCHES_FOR_SHAKE = constants.MIN_DIR_SWITCHES_FOR_SHAKE,
    POSITIONS_ARRAY_SIZE = constants.POSITIONS_ARRAY_SIZE,
    MIN_SHAKE_DIST = constants.MIN_SHAKE_DIST,
    MAX_SHAKE_DIST = constants.MAX_SHAKE_DIST,
    MAX_SHAKE_VIGOR = constants.MAX_SHAKE_VIGOR,
    SIGNIFICANT_SHAKE_VIGOR_DELTA = constants.SIGNIFICANT_SHAKE_VIGOR_DELTA,
    MICRO_MOVE_SIZE = constants.MICRO_MOVE_SIZE;

  function getShakeIncrease(lastDistance) {
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
      var lastDistanceFactor = Math.min(Math.pow(lastDistance, 1.5), 3), // Shake vigor grows exponentially with last move distance
        isExtraDirectionSwitch = (xDirectionSwitches > MIN_DIR_SWITCHES_FOR_SHAKE || yDirectionSwitches > MIN_DIR_SWITCHES_FOR_SHAKE);  // Boost for extra direction switches

      return Math.floor(lastDistanceFactor + isExtraDirectionSwitch);
    }

    return 0;
  }

  function onMouseMove(evt) {
    var lastDistance,
      prevMove,
      shakeIncrease;

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

    shakeIncrease = getShakeIncrease(lastDistance);
    if (shakeIncrease > 0) {
      shakeVigor = Math.min(MAX_SHAKE_VIGOR, lastShakeVigor + shakeIncrease);
    }
    else {  // Shake factor shrinks back down as mouse moves (faster as speed increases)
      var shakeDecrease = Math.max(lastDistance, 15) - 15;
      shakeDecrease = Math.min(shakeDecrease, 100) / 2500;
      shakeVigor = Math.max(lastShakeVigor - shakeDecrease, 0);
    }

    var shakeVigorDelta = shakeVigor - lastShakeVigor;
    lastShakeVigor = shakeVigor;

    if (Math.abs(shakeVigorDelta) >= SIGNIFICANT_SHAKE_VIGOR_DELTA || (shakeVigor === 0 && shakeVigorDelta < 0)) {
      shakeVigor += shakeVigorDelta;
      fireShakeVigorChange(shakeVigor, shakeVigorDelta);
    }

    lastMoves.shift();
  }

  function fireShakeVigorChange(shakeVigor, shakeVigorDelta) {
    lastShakeTimeout = nativeFn.setTimeout(function() {
      new metric.MouseShake({
        shakeVigor: shakeVigor,
        shakeVigorDelta: shakeVigorDelta
      }).send();
    }, 0);
  }

  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
  }

  return {
    init: init
  };
});
