// This module contains helper methods to be used in conjunction with the SWDDA PhantomJS client,
var phantomJsClient = {};
exports = module.exports = phantomJsClient;

// Import required modules.
var emptyPort = require('empty-port')
  , path = require('path')
  , spawn = require('child_process').spawn
  , fs = require('fs-extra')
  , extend = require('node.extend')
  ;

// See if we have been provided a root dir.
var CWD_VAR = 'phantomjs.run.cwd';
var rootDir = path.resolve(process.env[CWD_VAR] || process.cwd());
var baseDir =  path.join(rootDir, '.phantomjs');
fs.mkdirsSync(baseDir);

// ID, used to create a separate run directory for each PhantomJS instance.
var id = 0;

// Clear the data directory.
fs.removeSync(baseDir);

// The PhantomJS provider config.
var phantomJsConfig;

// Process the provider config.
phantomJsClient.init = function(providerConfig) {
  phantomJsConfig = providerConfig.config;
};

// Stop a PhantomJS instance.
var stopPhantomJs = function(session, cb) {
  if (session.phantomjs) {
    session.phantomjs.process.kill();
    fs.closeSync(session.phantomjs.out);
    delete session['phantomjs'];
  }
  cb && cb();
};

// Start a PhantomJS instance.
var startPhantomJs = function(session, cb) {
  emptyPort({ startPort: 7000, maxPort: 10000 }, function(err, port) {
    var pjs = session.phantomjs = {};
    pjs.id = id++;

    var runDir = path.join(baseDir, '' + pjs.id);
    fs.mkdirsSync(runDir);

    session.server.port = port;

    pjs.config = extend(true, {}, phantomJsConfig, {
      "localStoragePath": path.join(runDir, "storage.data"),
      "webdriver": "localhost:" + port,
      "webdriverLogfile": path.join(runDir, "webdriver.log")
    });

    var configFile = path.join(runDir, "config.json");
    fs.writeFileSync(configFile, JSON.stringify(pjs.config));

    pjs.out = fs.openSync(path.join(runDir, "out.log"), 'a');
    pjs.process = spawn('phantomjs', [ '--config=' + configFile ], { env: process.env, detached: true, stdio: [ 'ignore', pjs.out, pjs.out ] });

    process.on('exit', function() {
      stopPhantomJs(session);
    });

    // Wait for the PhantomJS instance to become available.
    // TODO: Replace with something more intelligent
    setTimeout(function() { cb(); }, 300);
  });
};

// Start a new PhantomJS instance
phantomJsClient.before = function(session, cb) {
  startPhantomJs(session, cb);
};

// Shut down the PhantomJS instance
var noop = function(){};
phantomJsClient.after = function(session, cb) {
  stopPhantomJs(session, cb);
};
