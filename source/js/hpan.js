sitecues.def('hpan', function (hpan, callback) {
  'use strict';

  hpan.isOn = false;
  hpan.isHlbOn = false;

  var MIN_EDGE_PORTION = .1;
  var MAX_EDGE_PORTION = .25;
  var MAX_SPEED = 100;

  // get dependencies
  sitecues.use('conf', 'util/common', 'jquery', function (conf, common, $) {

    hpan.mousemove = function(evt) {
      
      if (common.isInSitecuesUI(evt.target))
        return; // Don't pan while interacting with sitecues badge

      // Amount of horizontal mouse movement
      var movementX = hpan.getBackfillMovementX(evt);

      // Amount of content that didn't fit in the window
      var ratioContentToWindowWidth = $(document).width() / $(window).width();

      // Amount of edge to use for panning
      var edgePortion = Math.max(Math.min((ratioContentToWindowWidth - 1.1), MAX_EDGE_PORTION), MIN_EDGE_PORTION);
      var edgeSize = $(window).width() * edgePortion;

      // Get direction to pan, or return if mouse too near center of screen to cause panning
      var direction;
      if (evt.clientX < edgeSize && movementX < 0)
        direction = -1;
      else if (evt.clientX > $(window).width() - edgeSize && movementX > 0)
        direction = 1;
      else
        return;

      // How far into the panning zone are we?
      var pixelsUntilMouseAtWindowEdge = (direction == 1 ? window.innerWidth - evt.clientX : evt.clientX);
      var pixelsIntoPanningZone = (edgeSize - pixelsUntilMouseAtWindowEdge);
      var percentageIntoPanningZone = pixelsIntoPanningZone / edgeSize;  // .5 = 50%, 1 = 100%, etc.

      // How much to boost mouse movement?
      // Factor in how much more content there is than can fit in the window
      // Factor in how far into the panning zone we are, so it accelerates as we get toward edge
      // (sort of a magic formula developed through tinkering, which seems to work nicely)
      var extraMovement = Math.ceil((ratioContentToWindowWidth - .5) * 5 * percentageIntoPanningZone);

      // Finally, calculate movement size: amount of mouse movement + extraMovement
      var movementSize = Math.min(Math.round(Math.abs(movementX) * extraMovement), MAX_SPEED);

      // Scroll it
      window.scrollBy(direction * movementSize, 0);
    }

    hpan.getBackfillMovementX = function(evt) {
      var movementX = evt.movementX;
      if (typeof movementX !== 'undefined')
        return movementX;

      movementX = evt.mozMovementX;
      if (typeof movementX !== 'undefined')
        return movementX;

      movementX = evt.webkitMovementX;
      if (typeof movementX !== 'undefined')
        return movementX;

      // Does not require new browser capabilities, but not quite as smooth
      movementX = (typeof hpan.xLastPos === 'undefined') ? 0 : evt.clientX - hpan.xLastPos;
      hpan.xLastPos = evt.clientX;
      return movementX;
    }

    hpan.refresh = function() {

      // Turn on if zoom is > 1 and content overflows window more than a tiny amount
      var zoom = conf.get('zoom');
      var on = zoom > 1 && $(document).width() / $(window).width() > 1.01 && !hpan.isHlbOn;

      if (on != hpan.isOn) {
        if (on) {
          $(document).get(0).addEventListener('mousemove', hpan.mousemove, false);
        }
        else {
          $(document).get(0).removeEventListener('mousemove', hpan.mousemove, false);
          hpan.xLastPos = undefined;
        }
      }

      hpan.isOn = on;
    }

    sitecues.on('hlb/ready', function () {
      hpan.isHlbOn = true;
      hpan.refresh();
    });

    sitecues.on( 'hlb/closed', function () {
      hpan.isHlbOn = false;
      hpan.refresh();
    });

    // react on any zoom change
    conf.get('zoom', function (value) {
      if (value > 1) {
        $(window).on('resize', hpan.refresh);
      }
      else {
        $(window).off('resize', hpan.refresh);
      }

      hpan.refresh();
    });

    // done
    callback();
  });
});