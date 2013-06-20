/*
 * Sitecues: init_logger_dev.js
 *
 * This setup script triggers the logger's popUpAppender to show when the dev
 * flag has been used with make build. (IE: You will only see the popUpAppender
 * when runing the code from your local machine.)
 *
 */

(function(){

  sitecues.logger.appenders.popup.show();

})();