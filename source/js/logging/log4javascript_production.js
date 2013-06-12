var log4javascript = {

  consoleLog: false,

  getLogger: function(){
    
    var log = function(){};
    
    // Redirect to JavaScript Console
    log.prototype.cl = function(r){
      if (this.parent.consoleLog) {
        console.log(r);
      }
    };

    log.prototype.parent = this;
    log.prototype.toggleConsoleLog = function(){
      if (this.parent.consoleLog) {
        this.parent.consoleLog = false;
        return "Off"
      } else {
        this.parent.consoleLog = true;
        return "On"
      }
    };

    log.prototype.trace = function(r){ this.cl(r); };
    log.prototype.debug = function(r){ this.cl(r); };
    log.prototype.info = function(r){ this.cl(r); };
    log.prototype.warn = function(r){ this.cl(r); };
    log.prototype.error = function(r){ this.cl(r); };
    log.prototype.fatal = function(r){ this.cl(r); };
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