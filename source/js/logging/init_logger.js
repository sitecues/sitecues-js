/*
 * Sitecues: init_logger.js
 *
 * This setup script initiates the JavaScript Logger.
 *
 */

(function(){

  
  // Settings object for the logger
  var logSettings = {
    
    // The log-line-version of the logger
    version: "1",

    // Set the path for the logging server
    ajax_endpoint: "./some/path/"
  };

  if ( typeof window.sitecues !== "object" ) {
    window.sitecues = {};
  }
  
  // Create the logger (makes new logger if name does not yet exist)
  // Make sitecues.log namespace global by attaching it to the window
  window.sitecues.log = log4javascript.getLogger('siteCuesMainLogger');

  // Create a popUpAppender with default options
  window.sitecues.popUpAppender = new log4javascript.PopUpAppender();
  window.sitecues.ajaxAppender = new log4javascript.AjaxAppender( logSettings.ajax_endpoint );

  // Create the layout filter for the appenders
  var layout = new log4javascript.PatternLayout(
      "%d{yyyyMMdd_HHmmss.SS} " +
      "[ " + logSettings.version + " ]" +
      "[%-5p] %c %f %m{3}"
  );
  
  // Set the layout to the appenders
  sitecues.popUpAppender.setLayout(layout);
  sitecues.ajaxAppender.setLayout(layout);
  
  // Set the error level for the appenders
  sitecues.popUpAppender.setThreshold(log4javascript.Level.ALL);
  window.sitecues.ajaxAppender.setThreshold(log4javascript.Level.ERROR);

  // Make messages appear at top of popUpAppender
  sitecues.popUpAppender.setNewestMessageAtTop(true);

  // Add the appender(s) to the main logger
  sitecues.log.addAppender(sitecues.ajaxAppender);

  //sitecues.log.error("testthis");

})();