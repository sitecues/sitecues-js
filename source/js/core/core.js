define(
  [
    'core/conf/site',
    'core/conf/urls',
    'core/run',
    'core/constants',
    'core/events'
  ],
  function (
    site,
    urls,
    run,
    constants,
    events
  ) {
  'use strict';

  if (!SC_EXTENSION) {
    if (document.documentElement.hasAttribute('data-sitecues-everywhere')) {
      // Don't run if the extension has planted its flag.
      // (The sitecues.exists field is not accessible here if it's set in an extension context.)
      logToConsole('Sitecues Everywhere prioritized over Sitecues from webpage.');
      return;
    }
    // Extension script: is extension allowed on this page?
    if (window.localStorage.getItem('sitecues-disabled') === 'true') {
      logToConsole('Sitecues has been disabled on this page.');
      return;
    }
  }

  // Enums for sitecues loading state
  var state = constants.READY_STATE;

  function logToConsole(text) {
    console.log('**** '+text+' ****');
  }

  if (SC_DEV) {
    logToConsole('SITECUES MODE: SC_DEV');
    logToConsole('SITECUES VERSION: ' + sitecues.version);
  }

  // This function is called when we are sure that no other library already exists in the page. Otherwise,
  // we risk overwriting the methods of the live library.
  function exportPublicFields() {
    // Events
    //Currently used on Chicago Lighthouse, we should discourage customer use of public event API
    //in preparation for changing it in the future
    sitecues.on   = events.on;     // Start listening for an event.
    sitecues.emit = events.emit;   // Tell listeners about an event.
    sitecues.off  = events.off;    // Stop listening for an event.

    // Get info about the currently running sitecues client
    sitecues.status = getStatus;
    sitecues.getVersion = getVersion;
    sitecues.isOn = run.isOn;

    // Control BP expansion
    sitecues.expandPanel = expandPanel;
    sitecues.shrinkPanel = shrinkPanel;

    // Sitecues reset
    sitecues.reset = function() {};  // noop unless page module is loaded (if not loaded, there is nothing to reset)

    //Loading state enumerations
    sitecues.readyStates = state;

    // 'Plant our flag' on this page.
    sitecues.exists = true;
  }

  function expandPanel() {
    require(['core/bp/controller/expand-controller'], function(expandController) {
      expandController.expandPanel();
    });
  }

  function shrinkPanel() {
    require(['bp-expanded/controller/shrink-controller'], function(shrinkController) {
      shrinkController.shrinkPanel();
    });
  }


  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Getters
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  function getVersion() {
    return sitecues.version;
  }

  function getStatus() {
    var args = arguments;
    require(['status/status'], function(statusFn) {
      statusFn.apply(this, args);
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Basic Site Configuration
  //    This section process the basic site configuration, whose absence will
  //    prevent the library from loading.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  var validateConfiguration = function() {

    //Initialize configuration module
    site.init();
    // Initialize API and services URLs
    urls.init();

    if (!sitecues.config) {
      console.error('The ' + sitecues.config + ' object was not provided.');
      return;
    }

    if (typeof sitecues.config !== 'object') {
      console.error('The ' + sitecues.config + ' is not an object.');
      return;
    }

    // Underscore parameters deprecated
    var everywhereConfig = site.getEverywhereConfig();

    // siteId is required and must be a string
    var siteId = everywhereConfig.siteId || sitecues.config.siteId || sitecues.config.site_id;
    if (typeof siteId !== 'string') {
      console.error('The siteId parameter is not provided or not a string.');
      return;
    }

    // Library URL must be a valid URL
    if (!urls.isValidLibraryUrl()) {
      console.error('Unable to get valid Sitecues script url. Library can not initialize.');
      return;
    }

    // Continue loading sitecues
    return true;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Library Initialization
  //    This section is responsible for the initialization of the sitecues library.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // If the sitecues global object does not exist, then there is no basic site configuration
  if (!sitecues || typeof sitecues !== 'object') {
    logToConsole('The base ' + window.sitecues + ' namespace was not found. The sitecues library will not load.');
    return;
  }

  // As we have now 'planted our flag', export the public fields.
  exportPublicFields();

  // Process the basic configuration needed for library initialization.
  if (!validateConfiguration()) {
    console.error('Unable to load basic site configuration. Library can not initialize.');
  } else if (window !== window.top && !sitecues.config.iframe) {
    // Stop sitecues from initializing if:
    // 1) sitecues is running in an IFRAME
    // 2) sitecues.config.iframe = falsey
    logToConsole('Developer note (Sitecues): the following iframe attempted to load Sitecues, which does not currently support iframes: '+window.location +
      ' ... email support@sitecues.com for more information.');
  }
  else {
    // Do not allow the sitecues object to be wiped out or changed to something else,
    // but allow properties to be added to it, e.g. sitecues.$ = Zepto
    Object.defineProperty(window, 'sitecues', { writable: false });
    Object.defineProperty(sitecues, 'config', { writable: false }); // Do not allow reassignment, e.g. sitecues.config = {};
    Object.freeze(sitecues.config); // Do not allow properties of sitecues.config to be changed, e.g. sitecues.config.siteId = 's-xxxx';

    //Set sitecues state flag to initializing
    sitecues.readyState = state.INITIALIZING;

    // Run sitecues
    run.init();
  }
});
