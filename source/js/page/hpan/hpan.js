define(
  [
    'page/zoom/util/body-geometry',
    'core/events',
    'page/zoom/util/viewport',
    'core/dom-events',
    'page/zoom/zoom'
  ],
  function (
    bodyGeo,
    events,
    viewport,
    domEvents,
    zoomMod
  ) {
  var isOn = false,
    isHlbOn = false,
    isPanelOpen = false,
    isZooming = false,
    MIN_EDGE_PORTION = 0.1,
    MAX_EDGE_PORTION = 0.25,
    SPEED_FACTOR = 4,
    MAX_SPEED = 100,
    isListeningToResize,
    xLastPos;

  // get dependencies

  function mousemove(evt) {

    var
      // Amount of horizontal mouse movement
      movementX = getBackfillMovementX(evt),

      // Right side of body in absolute coordinates
      bodyRight = bodyGeo.getBodyRight(),

      pageXOffset = viewport.getPageXOffset(),

      // Width of window
      winWidth = viewport.getInnerWidth(),

      // Amount of content that didn't fit in the window
      ratioContentToWindowWidth = bodyRight / winWidth,

      // Amount of edge to use for panning
      edgePortion = Math.max(Math.min((ratioContentToWindowWidth / 2 - 0.55), MAX_EDGE_PORTION), MIN_EDGE_PORTION),
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
      pixelsUntilMouseAtWindowEdge = (direction === 1 ? winWidth - evt.clientX : evt.clientX),
      pixelsIntoPanningZone = (edgeSize - pixelsUntilMouseAtWindowEdge),
      percentageIntoPanningZone = pixelsIntoPanningZone / edgeSize,  // .5 = 50%, 1 = 100%, etc.

      // How much to boost mouse movement?
      // Factor in how much more content there is than can fit in the window
      // Factor in how far into the panning zone we are, so it accelerates as we get toward edge
      // (sort of a magic formula developed through tinkering, which seems to work nicely)
      extraMovement = Math.max(0.5, (ratioContentToWindowWidth - 0.3) * SPEED_FACTOR * (percentageIntoPanningZone + 0.5)),

      // How far can we move until we reach the right edge of the visible content
      maxMovementUntilRightEdge = bodyRight - winWidth - pageXOffset,

      // Calculate movement size: amount of mouse movement + extraMovement
      movementSize = Math.min(Math.round(Math.abs(movementX) * extraMovement), MAX_SPEED),

      // Finally, calculate the total movement -- do not allow move past right or left edge
      movement = Math.min(direction * movementSize, maxMovementUntilRightEdge);
      movement = Math.max(movement, -pageXOffset);

    // Scroll it
    if (movement >= 1 || movement <= -1) {
      window.scrollBy(movement, 0);
    }
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

  function onZoomBegin() {
    isZooming = true;
  }

  function onZoomChange(zoomLevel) {
    if (zoomLevel> 1 && !isListeningToResize) {
      isListeningToResize = true;
      events.on('resize', refresh);
    }
    isZooming = false;
    refresh();
  }

  function getZoom() {
    return zoomMod.getCompletedZoom() || 1;
  }

  function refresh() {

    // Turn on if zoom is > 1 and content overflows window more than a tiny amount
    var zoom = getZoom(),
      doTurnOn = zoom > 1 && bodyGeo.getBodyRight() / viewport.getInnerWidth() > 1.02 && !isHlbOn && !isPanelOpen && !isZooming;

    if (doTurnOn !== isOn) {
      if (doTurnOn) {
        domEvents.on(document, 'mousemove', mousemove);

      }
      else {
        domEvents.off(document, 'mousemove', mousemove);
        xLastPos = undefined;
      }
    }

    isOn = doTurnOn;
  }

  function init() {
    events.on('hlb/ready', function () {
      isHlbOn = true;
      refresh();
    });

    events.on('hlb/closed', function () {
      isHlbOn = false;
      refresh();
    });

    // Dont pan while the bp is expanded.
    events.on('bp/will-expand', function () {
      isPanelOpen = true;
      refresh();
    });

    // Allow panning while the bp is shrunk.
    events.on('bp/did-shrink', function () {
      isPanelOpen = false;
      refresh();
    });

    events.on('zoom/begin', onZoomBegin);

    // react on any zoom change
    events.on('zoom', onZoomChange);
    onZoomChange(getZoom());
  }

  return {
    init: init
  };
});
