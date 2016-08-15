define([], function () {

  return {
    SESSION_SHAKE_COUNT_KEY: '-sc-mouseshake-count',
    MOUSE_POSITIONS_ARRAY_SIZE: 10,       // Number of mouse positions stored
    MIN_DIR_SWITCHES_FOR_SHAKE: 2,  // How many vertical/horizontal direction switches required to be considered a shake
    MIN_SHAKE_DIST: 3,              // Minimum pixels moved to begin a mouse shake
    MAX_DIST_NON_SHAKE_AXIS: 99,    // Max pixels moved on axis not being shaken (vertical/horizontal)
    MIN_SHAKE_VIGOR_DECREASE: 4,    // Minimum speed of shake decrease
    MAX_SHAKE_VIGOR_DECREASE: 32,   // Maximum speed of shake decrease
    SHAKE_DECREASE_MULTIPLIER: 6,       // Magic value for shake decreases based on mouse speed
    SHAKE_INCREASE_POWER: 1.2,      // Magic value for exponential shake increase based on mouse speed
    MAX_SHAKE_VIGOR_INCREASE: 100,  // Max shake increase (out of total possible MAX_SHAKE_VIGOR)
    MAX_SHAKE_VIGOR: 400,           // Max total shake vigor
    MIN_MOVE_SIZE_FOR_SHAKE: 3,     // Pixel-size for irrelevant mousemove
    MS_BETWEEN_SHAKE_EVENTS: 50,    // ms between internal shake events
    METRIC_THRESHOLD_SHAKE_PERCENT: 50   // Only fire metric when shake vigor suddenly jumps over this % of MAX_SHAKE_VIGOR
  };
});