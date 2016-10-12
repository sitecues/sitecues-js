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
  constants.ATTRIBUTE_REGEX = /\[([^\=~\|\^\$\*\]]+)[^\]]*\]/;
  constants.ID_REGEX      = /#([^\s\+>~\.\[:]+)/g;
  constants.CLASS_REGEX   = /\.([^\s\+>~\.\[:]+)/g;

  constants.LOCK_ATTR     = 'data-sc-lock-';
  constants.ROOT_ATTR     = 'data-sc-root';
  constants.ANCHOR_ATTR   = 'data-sc-anchor';
  constants.VISIBLE       = 'visible';
  constants.HIDDEN        = 'hidden';
  constants.ROOT_SELECTOR = '[' + constants.ROOT_ATTR + ']';
  constants.VISIBLE_ANCHOR_SELECTOR = '[' + constants.ANCHOR_ATTR + '="' + constants.VISIBLE + '"]';
  constants.HIDDEN_ANCHOR_SELECTOR  = '[' + constants.ANCHOR_ATTR + '="' + constants.HIDDEN + '"]';

  return constants;
});
