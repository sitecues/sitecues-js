// DO NOT MODIFY THIS SCRIPT WITHOUT ASSISTANCE FROM SITECUES
var sitecues = window.sitecues || {};
  
sitecues.config = {
  site_id : 's-00000005',
};
  
(function () {
  var script = document.createElement('script'),
  first = document.getElementsByTagName('script')[0];
  sitecues.config.script_url=document.location.protocol+'//localhost/l/s;id='+sitecues.config.site_id+'/js/sitecues.js';
  script.src=sitecues.config.script_url;
  script.type = 'text/javascript';
  script.async = true;
  first.parentNode.insertBefore(script, first);

})();