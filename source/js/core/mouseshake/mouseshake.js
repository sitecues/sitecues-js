/**
 * Mouseshake feature
 * - Value of shake vigor at any one time is 0-MAX_SHAKE_VIGOR
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
    MAX_SHAKE_VIGOR_DECREASE = constants.MAX_SHAKE_VIGOR_DECREASE,
    MAX_SHAKE_VIGOR_INCREASE = constants.MAX_SHAKE_VIGOR_INCREASE,
    MICRO_MOVE_SIZE = constants.MICRO_MOVE_SIZE,
    METRIC_THRESHOLD = constants.METRIC_THRESHOLD;

  function reset() {
    lastMoves = [];
  }

  function getShakeVigorDelta(lastDistance) {
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
      return Math.min(Math.pow(lastDistance, 1.2), MAX_SHAKE_VIGOR_INCREASE); // Shake vigor grows exponentially with last move distance
    }

    // Shake factor shrinks back down as mouse moves (faster as speed increases)
    return Math.min(lastDistance, MAX_SHAKE_VIGOR_DECREASE) - MAX_SHAKE_VIGOR_DECREASE;
  }

  function onMouseMove(evt) {
    var lastDistance,
      prevMove,
      shakeVigorDelta;

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

    shakeVigorDelta = Math.round(getShakeVigorDelta(lastDistance));

    shakeVigor = lastShakeVigor + shakeVigorDelta;
    if (shakeVigor < 0) {
      shakeVigor = 0;
    }
    else if (shakeVigor > MAX_SHAKE_VIGOR) {
      shakeVigor = MAX_SHAKE_VIGOR;
    }

    if (shakeVigor !== lastShakeVigor) {
      // fireShakeVigorChange(shakeVigor);
      if (SC_DEV) {
        console.log(shakeVigorDelta + ' => ' + shakeVigor);
      }
      if (shakeVigor >= METRIC_THRESHOLD && lastShakeVigor < METRIC_THRESHOLD) {
        setTimeout(function() {
          new metric.MouseShake({
            shakeVigor: shakeVigor,
            shakeVigorDelta: shakeVigorDelta
          }).send();
        }, 0);
      }
    }

    lastShakeVigor = shakeVigor;

    lastMoves.shift();
  }

  // function fireShakeVigorChange(shakeVigor) {
  //   lastShakeTimeout = nativeFn.setTimeout(function() {
  //   }, 0);
  // }
  //
  function init() {
    domEvents.on(document, 'mousemove', onMouseMove);
    domEvents.on(document, 'mouseout', reset);
  }

  return {
    init: init
  };
});
