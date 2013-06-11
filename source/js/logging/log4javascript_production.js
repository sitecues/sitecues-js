var log4javascript = {

  getDefaultLogger: function(){

    var log = function(){};
    log.prototype.trace = function(){};
    log.prototype.debug = function(){};
    log.prototype.info = function(){};
    log.prototype.warn = function(){};
    log.prototype.error = function(){};
    log.prototype.fatal = function(){};

    return new log()
  }

};