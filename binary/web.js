#!/usr/bin/env node

// helpers
var TRUE_VALUES = ['yes', 'on', 'true'];
function strToBool(str) {
	return (TRUE_VALUES.indexOf(str && str.toLowerCase()) >=0);
}

// initialize express application
var fs, app, root, path, mime, port, https, hogan, express;

// dependencies
fs = require('fs-extra');
path = require('path');
mime = require('mime');
https = require('https');
hogan = require('hogan.js');
express = require('express');
app = express();

// We may run this as root to bind to ports 80/443,
// so determine who the owner of this script is, and
// chown all created dirs and files to that owner.
var uid, gid;
(function(){
  var rootStat = fs.statSync(__filename);
  uid = rootStat.uid;
  gid = rootStat.gid;
})();

function mkdirs(dir) {
  // Find the first existing dir.
  dir = path.resolve(dir);
  var firstExisting = '' + dir;
  while (!fs.existsSync(firstExisting)) {
    firstExisting = path.dirname(firstExisting);
  }

  fs.mkdirsSync(dir);

  while (dir != firstExisting) {
    fs.chownSync(dir, uid, gid);
    dir = path.dirname(dir);
  }
}

// process cmd line args
var useHttps = strToBool(process.argv[3]),
	prodMode = strToBool(process.argv[4]),
  portFile = null;

if (process.argv.length > 5) {
  var portFileComps = process.argv[5].split('/');
  portFileComps.unshift(process.cwd());
  portFile = path.resolve(path.join.apply(path, portFileComps));
  console.log("PORTSFILE: " + portFile);
  mkdirs(path.dirname(portFile));
}

app.on('listen', function(e){
  console.log('LISTEN: ' + JSON.stringify(e));
});

// handle relative paths properly
root = path.dirname(module.filename);

// use express logger to show info
// about all incoming requests
app.use(express.logger());

// setup paths to serve static files from
// use relative path from binary to provide
// robust way for finding files
if (!prodMode) {
	app.use(express.static(path.join(root, '../source')));
}
app.use(express.static(path.join(root, '../target/compile')));
app.use(express.static(path.join(root, '../target/etc')));

// Process the inline JS file templates.

// The previous include template.
var INLINE_V1_JS_FILE = path.resolve(path.join(root, '../tests/views/inlineV1.html'));
function createInlineV1JsTemplate() {
	try {
		var templateContent = fs.readFileSync(INLINE_V1_JS_FILE, { encoding: 'UTF-8' });
		return hogan.compile(templateContent);
	} catch (t) {
		console.log("Unable to create inline JavaScript template (" + t.message + ")");
		return null;
	}
}
var getInlineV1JsTemplate = createInlineV1JsTemplate;

// The current include template.
var INLINE_V2_JS_FILE = path.resolve(path.join(root, '../tests/views/inlineV2.html'));
function createInlineV2JsTemplate() {
  try {
    var templateContent = fs.readFileSync(INLINE_V2_JS_FILE, { encoding: 'UTF-8' });
    return hogan.compile(templateContent);
  } catch (t) {
    console.log("Unable to create inline JavaScript template (" + t.message + ")");
    return null;
  }
}
var getInlineV2JsTemplate = createInlineV2JsTemplate;

if (prodMode) {
	(function(){
		var INLINE_V1_JS_FILE_TEMPLATE = createInlineV1JsTemplate();
		getInlineV1JsTemplate = function() {
			return INLINE_V1_JS_FILE_TEMPLATE;
		};
    var INLINE_V2_JS_FILE_TEMPLATE = createInlineV2JsTemplate();
    getInlineV2JsTemplate = function() {
      return INLINE_V2_JS_FILE_TEMPLATE;
    };
	})();
}

// Return the data regarding inserting the library JS into files.
function getInlineJSData(req) {
	var data = null;
	// Is a URL is provided, then insert the
	if (req.query.scjsurl) {
    var scisv = req.query.scisv || 2;
    var scuimode = req.query.scuimode;
    var templateFunction = ( scisv == 1 ? getInlineV1JsTemplate : getInlineV2JsTemplate);
    var siteConfigProps = '';

    if (scuimode) {
      siteConfigProps += ', ui_mode: "' + scuimode + '"'
    }

		data = {
			markup: templateFunction().render({
				scjsurl:	req.query.scjsurl,
				scwsid:		req.query.scwsid || 's-00000001',
        siteConfigProps: siteConfigProps
			})
		}
	}
	return data;
}

// Allow serving of HTML/JS tools from the /tools/site/ directory
app.use('/tools',express.static(path.join(root, '../tools/site')));

// allow dynamic insertion of the JavaScript library in the site files
var SITE_CONTEXT_PATH = '/site';
var SITE_ROOT = path.resolve(path.join(root, '../tests/pages'));
app.get(SITE_CONTEXT_PATH + '/*', function (req, res, next) {
	var exists = false,
		filepath = path.normalize(path.join(SITE_ROOT, '/', req.params[0]));

	if (filepath.length < SITE_ROOT.length) {
		res.send(403, 'Forbidden');
	} else {
		if (fs.existsSync(filepath)) {
			var stats = fs.statSync(filepath);
			exists = true;

			if (stats.isDirectory()) {
				filepath = path.normalize(path.join(filepath, '/index.html'));
				exists = fs.existsSync(filepath);
			}
		}

		if (exists) {
			var inlineJsData = getInlineJSData(req);

			if (inlineJsData) {
				var content = fs.readFileSync(filepath, { encoding: 'UTF-8' });

				// Insert the markup.
				content = content.replace(/(<head[^>]*>)/i, function(match, headStart) {
					return headStart + inlineJsData.markup;
				});

				res.writeHead(200, {"Content-Type": mime.lookup(filepath)});
				res.write(content);
				res.end();
			} else {
				res.sendfile(filepath);
			}
		} else {
			res.send(404, 'File not found: ' + SITE_CONTEXT_PATH + filepath.substr(SITE_ROOT.length));
		}
	}
});

// start http server (express app) on specified port
// detect what port number use for server
port = process.env.PORT || process.argv[2] || 8000;
app.listen(port, function() {
	console.log('Listening at "http://localhost:' + port + '/"');
});

if (portFile) {
  fs.writeFileSync(portFile, '-Dswdda.testSite.httpPort=' + port + ' -Dswdda.sitecuesUrl.httpPort=' + port, {flag:'w'});
  fs.chownSync(portFile, uid, gid);
}

// if https option passed to script
if (useHttps){
  if (portFile) {
    fs.writeFileSync(portFile, ' -Dswdda.testSite.httpsPort=443 -Dswdda.sitecuesUrl.httpsPort=443', {flag:'a'});
  }

	// create https server and start it on 443 port
	https.createServer({
		key:	fs.readFileSync('binary/cert/localhost.key'),
		cert:	fs.readFileSync('binary/cert/localhost.cert')
	}, app).listen(443, function(){
		console.log('Listening at "https://localhost:443/"');

	});
}
