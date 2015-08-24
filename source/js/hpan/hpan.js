define(['conf/user/manager', 'util/common', 'jquery', 'zoom/zoom'], function (conf, common, $, zoomMod) {
  var isOn = false,
    isHlbOn = false,
    isPanelOpen = false,
    MIN_EDGE_PORTION = .1,
    MAX_EDGE_PORTION = .25,
    SPEED_FACTOR = 4,
    MAX_SPEED = 100,
    xLastPos;

  // get dependencies

  function mousemove(evt) {

    if (common.isInSitecuesUI(evt.target)) {
      return; // Don't pan while interacting with sitecues UI
    }

    var
      // Amount of horizontal mouse movement
      movementX = getBackfillMovementX(evt),

      // Right side of body in absolute coordinates
      bodyRight = zoomMod.getBodyRight(),

      // Width of window
      winWidth = window.innerWidth,

      // Amount of content that didn't fit in the window
      ratioContentToWindowWidth = bodyRight / winWidth,

      // Amount of edge to use for panning
      edgePortion = Math.max(Math.min((ratioContentToWindowWidth / 2 - .55), MAX_EDGE_PORTION), MIN_EDGE_PORTION),
      edgeSize = winWidth * edgePortion,

      // Get direction to pan, or return if mouse too near center of screen to cause panning
      direction;

    if (evt.clientX < edgeSize && movementX < 0) {
      direction = -1;
    }
    else if (evt.clientX > winWidth - edgeSize && movementX > 0) {
      direction = 1;
    }
    else {
      return;
    }

    var
      // How far into the panning zone are we?
      pixelsUntilMouseAtWindowEdge = (direction === 1 ? window.innerWidth - evt.clientX : evt.clientX),
      pixelsIntoPanningZone = (edgeSize - pixelsUntilMouseAtWindowEdge),
      percentageIntoPanningZone = pixelsIntoPanningZone / edgeSize,  // .5 = 50%, 1 = 100%, etc.

      // How much to boost mouse movement?
      // Factor in how much more content there is than can fit in the window
      // Factor in how far into the panning zone we are, so it accelerates as we get toward edge
      // (sort of a magic formula developed through tinkering, which seems to work nicely)
      extraMovement = Math.max(.5, (ratioContentToWindowWidth - .3) * SPEED_FACTOR * (percentageIntoPanningZone + .5)),

      // How far can we move until we reach the right edge of the visible content
      maxMovementUntilRightEdge = bodyRight - winWidth - window.pageXOffset,

      // Calculate movement size: amount of mouse movement + extraMovement
      movementSize = Math.min(Math.round(Math.abs(movementX) * extraMovement), MAX_SPEED),

      // Finally, calculate the total movement -- do not allow move past right edge
      movement = Math.min(direction * movementSize, maxMovementUntilRightEdge);

    // Scroll it
    window.scrollBy(movement, 0);
  }

  function getBackfillMovementX(evt) {
    var movementX = evt.movementX;
    if (typeof movementX !== 'undefined') {
      return movementX;
    }

    movementX = evt.mozMovementX;
    if (typeof movementX !== 'undefined') {
      return movementX;
    }

    movementX = evt.webkitMovementX;
    if (typeof movementX !== 'undefined') {
      return movementX;
    }

    // Does not require new browser capabilities, but not quite as smooth
    movementX = (typeof xLastPos === 'undefined') ? 0 : evt.clientX - xLastPos;
    xLastPos = evt.clientX;
    return movementX;
  }

  function refresh() {

    // Turn on if zoom is > 1 and content overflows window more than a tiny amount
    var zoom = conf.get('zoom'),
      doTurnOn = zoom > 1 && zoomMod.getBodyRight() / window.innerWidth > 1.02 && !isHlbOn && !isPanelOpen;

    if (doTurnOn !== isOn) {
      if (doTurnOn) {
        document.addEventListener('mousemove', mousemove, false);
      }
      else {
        document.removeEventListener('mousemove', mousemove, false);
        xLastPos = undefined;
      }
    }

    isOn = doTurnOn;
  }

  sitecues.on('hlb/ready', function () {
    isHlbOn = true;
    refresh();
  });

  sitecues.on( 'hlb/closed', function () {
    isHlbOn = false;
    refresh();
  });

  // Dont pan while the bp is expanded.
  sitecues.on('bp/will-expand', function () {
    isPanelOpen = true;
    refresh();
  });

  // Allow panning while the bp is shrunk.   
  sitecues.on('bp/did-shrink', function () {
    isPanelOpen = false;
    refresh();
  });

  // react on any zoom change
  sitecues.on('zoom', function (value) {
    sitecues.off('resize', refresh);
    if (value > 1) {
      sitecues.on('resize', refresh);
    }
    refresh();
  });
  //no publics
});