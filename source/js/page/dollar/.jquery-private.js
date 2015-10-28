// Ensure that we do not conflict with the jQuery in the page
// TODO we used to use this for IE9, but looks like we can probably remove ... ?
define(['jquery'], function (jq) {

  $ = jq.noConflict(true);
  if (SC_DEV) {
    sitecues.$ = $;  // Helpful for debugging
  }
  return $;
});
