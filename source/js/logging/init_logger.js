/*
 * Sitecues: init_logger.js
 *
 * This setup script initiates the JavaScript Logger.
 *
 */

(function(){


  //// LOGGING SETTINGS ////////////////////////////////////////////////////////
  
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

  sitecues.log._sitecues_appenders = {};

  sitecues.log._sitecues_layouts = {};



  //// SETUP APPENDERS /////////////////////////////////////////////////////////

  // Create a popUpAppender with default options
  sitecues.log._sitecues_appenders.popUpAppender = 
    new log4javascript.PopUpAppender();

  sitecues.log._sitecues_appenders.ajaxAppender = 
    new log4javascript.AjaxAppender( logSettings.ajax_endpoint );

  // Alias private vars to make following code easier to read
  var popUpAppender  = sitecues.log._sitecues_appenders.popUpAppender,
      ajaxAppender   = sitecues.log._sitecues_appenders.popUpAppender;

  // Create the layout filter for the appenders
  sitecues.log._sitecues_layouts.default_layout = new log4javascript.PatternLayout(
      "%d{yyyyMMdd_HHmmss.SS}, " +
      "" + logSettings.version + ", " +
      "%p, %f, %m{3}"
  );

  var default_layout = sitecues.log._sitecues_layouts.default_layout;
  
  // Add Custom Fields to Layout
  default_layout.setCustomField('module', 'logger');

  // Set the layout to the appenders
  popUpAppender.setLayout(default_layout);
  ajaxAppender.setLayout(default_layout);
  
  // Set the error level for the appenders
  ajaxAppender.setThreshold(log4javascript.Level.ERROR);
  popUpAppender.setThreshold(log4javascript.Level.INFO);

  // Add the appender(s) to the main logger
  sitecues.log.addAppender(ajaxAppender);
  sitecues.log.addAppender(popUpAppender)

  // Make messages appear at top of popUpAppender
  popUpAppender.setNewestMessageAtTop(true);

  // Hide the popup appender (this will be shown only in dev mode unless toggled)
  //popUpAppender.hide();
  //popUpAppender.close();
  popUpAppender.setInitiallyMinimized(true);

  
  //// TOGGLE FEATURES /////////////////////////////////////////////////////////
 
  // Toggle Items
  sitecues.log.toggleItems = {
    
    // Toggle the use of the popUpAppender
    popup: { state: false,
      on: function(){
        popUpAppender.show();
        sitecues.log.toggleItems.popup.state = true;
        return "On";
      },
      off: function(){
        popUpAppender.hide();
        sitecues.log.toggleItems.popup.state = false;
        return "Off";
      }},

    /*
    // Toggle route-logs-to-console (use with caution)
    console: { state: false, 
      on: function(){

      },
      off: function(){

      }}
    */
  };

  // Toggle Interface
  sitecues.log.toggle = function( type ){
    if ( typeof sitecues.log.toggleItems[type] === "object" ) {

      var toggleItem = sitecues.log.toggleItems[type],
          state      = toggleItem.state;

      if (typeof state === "boolean") {
        if (state === true ){
          return "Toggle '"+type+"': "+toggleItem.off();
        } else {
          return "Toggle '"+type+"': "+toggleItem.on();
        }
      }

    } else {
      return "No such Toggle-Item found.";
    }
  };

})();