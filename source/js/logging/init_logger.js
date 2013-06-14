/*
 * Sitecues: init_logger.js
 *
 * Script that start the logger.
 *
 */
    
    // Set the path for the logging server
    var ajax_logging_endpoint = "./some/path/";
    
    // Create the logger (makes new logger if name does not yet exist)
    var sitecuesLog = log4javascript.getLogger();

    // Create a popUpAppender with default options
    var popUpAppender = new log4javascript.PopUpAppender("pop-up");
    var ajaxAppender = new log4javascript.AjaxAppender( ajax_logging_endpoint );

    // Set the layout
    var layout = new log4javascript.PatternLayout("%d{yyyyMMdd_HHmmss.SS} [%-5p] %c %f %m{3}");
    
    popUpAppender.setLayout(layout);
    ajaxAppender.setLayout(layout);
    
    // Set the error level for the ajaxAppender
    ajaxAppender.setThreshold(log4javascript.Level.ERROR);

    // Change the desired configuration options
    popUpAppender.setNewestMessageAtTop(true);

    // Add the appender to the logger
    sitecuesLog.addAppender(popUpAppender);
    sitecuesLog.addAppender(ajaxAppender);

    //sitecuesLog.error("testthis");