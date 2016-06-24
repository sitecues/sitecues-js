define([], function () {

  'use strict';

  var constants = {};

  constants.TRANSPLANT_STATE = {
    UNCLONED: 0,
    CLONED: 1,
    MIXED: 2,
    ROOT: 3,
    NESTED_ROOT: 4,
    NESTED: 5
  };

  constants.INLINE_STYLE_PATTERN = ':\\s?([^;]*);\\s?';
  constants.ATTRIBUTE_REGEX      = /\[([^\=~\|\^\$\*\]]+)[^\]]*\]/;
  constants.ID_REGEX             = /#([^\s\+>~\.\[:]+)/g;
  constants.CLASS_REGEX          = /\.([^\s\+>~\.\[:]+)/g;

  constants.LOCK_ATTR            = 'data-sc-lock-';
  constants.ROOT_ATTR            = 'data-sc-root';
  constants.ROOT                 = 'root';
  constants.FIXED_ROOT           = constants.ROOT + '_fixed';
  constants.HIDDEN_ROOT          = constants.ROOT + '_hidden';
  constants.ROOT_SELECTOR        = '[' + constants.ROOT_ATTR + '^="' + constants.ROOT + '"]';
  constants.FIXED_ROOT_SELECTOR  = '[' + constants.ROOT_ATTR + '="' + constants.FIXED_ROOT + '"]';
  constants.HIDDEN_ROOT_SELECTOR = '[' + constants.ROOT_ATTR + '="' + constants.HIDDEN_ROOT + '"]';

  return constants;
});