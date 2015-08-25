// Ensure that we do not conflict with the jQuery in the page
define(['jquery'], function (jq) {
  return jq.noConflict( true );
});
