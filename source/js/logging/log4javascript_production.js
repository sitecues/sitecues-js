var log4javascript = {

  getLogger: function(){
    
    var log = function(){};
    log.prototype.trace = function(){};
    log.prototype.debug = function(){};
    log.prototype.info = function(){};
    log.prototype.warn = function(){};
    log.prototype.error = function(){};
    log.prototype.fatal = function(){};
    log.prototype.addAppender = function(){};
    log.prototype.getLogger = function(){};

    return new log();
  },

  PopUpAppender: function(){
    return {
      PopUpAppender: function(){},
      setFocusPopUp: function(){},
      setNewestMessageAtTop: function(){},
      addAppender: function(){},
      setLayout: function(){}
    };
  },
  
  setFocusPopUp: function(){},
  setNewestMessageAtTop: function(){},
  PatternLayout: function(){},
  getDefaultLogger: function(){}
};