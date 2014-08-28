sitecues.def('hpan', function (hpan, callback) {
  'use strict';

  var isOn = false,
    isHlbOn = false,
    isPanelOpen = false,
    MIN_EDGE_PORTION = .1,
    MAX_EDGE_PORTION = .25,
    SPEED_FACTOR = 4,
    MAX_SPEED = 100,
    xLastPos;

  // get dependencies
  sitecues.use('conf', 'util/common', 'jquery', function (conf, common, $) {

    function mousemove(evt) {

      if (common.isInSitecuesUI(evt.target)) {
        return; // Don't pan while interacting with sitecues UI
      }

      var
        // Amount of horizontal mouse movement
        movementX = getBackfillMovementX(evt),

        // Amount of content that didn't fit in the window
        ratioContentToWindowWidth = $(document).width() / $(window).width(),

        // Amount of edge to use for panning
        edgePortion = Math.max(Math.min((ratioContentToWindowWidth / 2 - .55), MAX_EDGE_PORTION), MIN_EDGE_PORTION),
        edgeSize = $(window).width() * edgePortion,

        // Get direction to pan, or return if mouse too near center of screen to cause panning
        direction;

      if (evt.clientX < edgeSize && movementX < 0) {
        direction = -1;
      }
      else if (evt.clientX > $(window).width() - edgeSize && movementX > 0) {
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

        // Finally, calculate movement size: amount of mouse movement + extraMovement
        movementSize = Math.min(Math.round(Math.abs(movementX) * extraMovement), MAX_SPEED);

      // Scroll it
      window.scrollBy(direction * movementSize, 0);
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
        doTurnOn = zoom > 1 && $(document).width() / $(window).width() > 1.01 && !isHlbOn && !isPanelOpen;

      if (doTurnOn !== isOn) {
        if (doTurnOn) {
          $(document).get(0).addEventListener('mousemove', mousemove, false);
        }
        else {
          $(document).get(0).removeEventListener('mousemove', mousemove, false);
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

    sitecues.on('panel/show', function () {
      isPanelOpen = true;
      refresh();
    });

    sitecues.on( 'panel/hide', function () {
      isPanelOpen = false;
      refresh();
    });

    // react on any zoom change
    sitecues.on('zoom', function (value) {
      $(window).off('resize', refresh);
      if (value > 1) {
        $(window).on('resize', refresh);
      }

      refresh();
    });

    // done
    callback();
  });
});