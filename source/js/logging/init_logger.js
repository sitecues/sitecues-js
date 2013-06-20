/*
 * Sitecues: init_logger.js
 *
 * This setup script initiates the JavaScript Logger.
 *
 */

(function(){

  // Convenience alias log4javascript instance stored on windows.sitcues
  var log4js = window.sitecues.log4js;

  // The main Logger 
  var Logger = {

  

    //// Logger Settings ////

    // The log-line-version of the logger
    version: "Heart.1",

    // Set the path for the logging server
    ajaxEndpoint: "./logging/ajax/endpoint",

    // Default Layout Pattern
    layoutPattern: "%d{yyyyMMdd_HHmmss.SS}, %f, %c, %p, %m{3}",


    
    //// Logger Internals  ////

    // Appender store
    appenders: {},



    //// Add Appender to store ////

    addAppender: function(name, objref, level){

      // Set the default layout on this new appender
      objref.setLayout(this.layout);

      // Set the Threshold for the errors
      objref.setThreshold(level);

      // Store the appender
      this.appenders[name] = objref;
    },



    //// Logger Initialization Function ////

    init: function(){
     
      // Set the default appender layout
      this.layout = new log4js.PatternLayout(this.layoutPattern);

      // Add the Log-Line-Version custom field to the default Layout
      this.layout.setCustomField('log-line-version', this.version);

      // Create popup appender
      this.addAppender('popup',
        new log4js.PopUpAppender(),
        log4js.Level.INFO
      );

      // Create AJAX appender

      // this.addAppender('ajax',
      //   new log4js.AjaxAppender(this.ajaxEndpoint),
      //   log4js.Level.INFO
      // );

      // Make messages appear at top of popUpAppender
      this.appenders.popup.setNewestMessageAtTop(true);

      // Hide popup appender (only in dev mode unless toggled)
      this.appenders.popup.setInitiallyMinimized(true);

      return this;
    },


    //// Create New or Return Existing Logger ////
    log: function(name){

      // Create the loggerinstance
      var newLogger = log4js.getLogger(name);

      // Step through the appenders created
      for (var appenderName in this.appenders) {

        // Attached the appenders to the new logger
        newLogger.addAppender(this.appenders[appenderName]);
      }

      // Map console-like interface
      return {
        instance: newLogger,
        
        // console.log now routes to log4javascript.logger.info
        log   : function(a){
          newLogger.info(a);
        },
        
        trace : function(a){ newLogger.trace(a); },
        debug : function(a){ newLogger.debug(a); },
        info  : function(a){ newLogger.info(a);  },
        warn  : function(a){ newLogger.warn(a);  },
        error : function(a){ newLogger.error(a); },
        fatal : function(a){ newLogger.fatal(a); }
      }
    },

    //// Toggle State Handlers ////

    toggleItems: {
    
      // Toggle the use of the popUpAppender
      popup: { state: false,
        on: function(){
          this.appenders.popup.show();
          this.toggleItems.popup.state = true;
          return "On";
        },
        off: function(){
          this.appenders.popup.hide();
          this.toggleItems.popup.state = false;
          return "Off";
        }}

    
      // Toggle route-logs-to-console (use with caution)
      
      // console: { state: false, 
      //   on: function(){

      //   },
      //   off: function(){

      //   }}
    },



    //// Toggle Interface ////

    toggle: function( type ){
      if ( typeof this.toggleItems[type] === "object" ) {

        var toggleItem = this.toggleItems[type],
            state = toggleItem.state;

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
    }
  
  // Logger: end-of-def
  };

  // Initialize the global Logger
  window.sitecues.logger = Logger.init();

})();