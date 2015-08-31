// Ensure that we do not conflict with the jQuery in the page
// TODO use the jQuery in the page if it has everything we need
define(['jquery'], function (jq) {
  var $ = jq.noConflict(true);
  if (SC_DEV) {
    sitecues.$ = $;  // Helpful for debugging
  }
  return $;
});
