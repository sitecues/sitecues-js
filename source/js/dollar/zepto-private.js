//jshint -W117
// Ensure that we do not conflict with the jQuery in the page
// TODO use the jQuery in the page if it has everything we need
define(['dollar/zepto'], function () {

  var $ = Zepto;
  if (SC_DEV) {
    sitecues.$ = $;  // Helpful for debugging
  }
  return $;
});
