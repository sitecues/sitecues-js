define([], function () {

  'use strict';

  var constants = {};

  constants.MS_PER_X_ZOOM_GLIDE = 1400; // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
  constants.MS_PER_X_ZOOM_SLIDER = 500; // For click in slider

  constants.ZOOM_PRECISION = 3; // Decimal places allowed

  constants.SITECUES_ZOOM_ID = 'sitecues-js-zoom';

  constants.ANIMATION_END_EVENTS = 'animationend webkitAnimationEnd MSAnimationEnd';

  constants.MIN_RECT_SIDE = 4;

  constants.ANIMATION_OPTIMIZATION_SETUP_DELAY = 20;   // Provide extra time to set up compositor layer if a key is pressed
  constants.CLEAR_ANIMATION_OPTIMIZATION_DELAY = 7000;  // After zoom, clear the will-change property if no new zoom occurs within this amount of time
  constants.UNPINCH_END_DELAY = 150;

  constants.REPAINT_FOR_CRISP_TEXT_DELAY = 100;          // This is conjured out of thin air. Just seems to work.

  constants.CRISPING_ATTRIBUTE = 'data-sc-crisp';

  constants.UNPINCH_FACTOR = 0.015; // How much the unpinch delta affects zoom

  constants.MAX_ZOOM = 3;
  constants.MIN_ZOOM = 1;
  constants.ZOOM_STEP = 0.01;
  constants.MIN_ZOOM_PER_CLICK = 0.2;  // Change zoom at least this amount if user clicks on A button or presses +/- or left/right in slider
  constants.ZOOM_RANGE = constants.MAX_ZOOM - constants.MIN_ZOOM;

  constants.GLIDE_CHANGE_INTERVAL_MS = 30;  // How often to call back with a new zoom value

  return constants;

});