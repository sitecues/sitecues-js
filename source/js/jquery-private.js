// Ensure that we do not conflict with the jQuery in the page
define(['jquery'], function (jq) {
  var $ = jq.noConflict(true);
  if (SC_DEV) {
    sitecues.$ = $;  // Helpful for debugging
  }
  return $;
});
