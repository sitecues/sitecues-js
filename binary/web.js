#!/usr/bin/env node

'use strict';

// Dependencies
const
    fs      = require('fs-extra'),
    mime    = require('mime'),
    path    = require('path'),
    https   = require('https'),
    hogan   = require('hogan.js'),
    express = require('express'),
    pkgDir  = require('pkg-dir');

// Boolean deserialization helper function.
function strToBool(str) {
    const trueValues = ['yes', 'on', 'true'];
    return trueValues.indexOf(str && str.toLowerCase()) >= 0;
}

// Path join helper function that takes both strings and arrays.
function pathJoin() {

    const len = arguments.length;

    if (!len) {
        return;
    }

    const pathComps = [];
    for (let i = 0; i < len; i += 1) {
        const arg = arguments[i];

        if (arg instanceof Array) {
            pathComps = pathComps.concat(arg);
        } else if (typeof arg === 'string') {
            pathComps.push(arg);
        } else {
            return;
        }
    }

    return path.join.apply(path, pathComps);
};

// Determine the project root, so that paths may be correctly resolved.
const projectRoot = pkgDir.sync(__dirname);

// We may run this as root to bind to ports 80/443, so determine who the owner of this script is, and chown all
// created dirs and files to that owner.
function chown(file) {
    const
        fileStat = fs.statSync(__filename),
        uid      = fileStat.uid,
        gid      = fileStat.gid;

    fs.chownSync(file, uid, gid);
}

// Helper method for making directories, while also chown'ing the new directories to the proper user.
function mkdirs(dir) {
    // Find the first existing dir.
    dir = path.resolve(dir);
    let firstExisting = '' + dir;
    while (!fs.existsSync(firstExisting)) {
        firstExisting = path.dirname(firstExisting);
    }

    fs.mkdirsSync(dir);

    while (dir != firstExisting) {
        chown(dir);
        dir = path.dirname(dir);
    }
}


// Initialize the express application
const app = express();

// Set custom MIME types
express.static.mime.define({
    // MicroSoft cursor files.
    'image/vnd.microsoft.icon' : [ 'cur' ],
    // JavaScript 'map' files.
    'application/javascript': [ 'map' ]
});

// Process the command line args.
var useHttps = strToBool(process.argv[3]),
    portFile = null;

// The fifth argument is the port file destination.
if (process.argv.length > 5) {
    const portFileComps = process.argv[5].split('/');
    portFileComps.unshift(process.cwd());
    portFile = path.resolve(pathJoin(portFileComps));
    console.log("PORTSFILE: " + portFile);
    mkdirs(path.dirname(portFile));
}

// Use the express logger to show info about all incoming requests.
app.use(express.logger());

// Log listen events.
app.on('listen', function (e) {
    console.log('LISTEN: ' + JSON.stringify(e));
});

// CORS -- allow settings-[locale].html and tips-[locale].html to be loaded via xhr
app.all(/\/html\/|\/images\/cursors\//, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
    return next();
});

// Set up the handling of the per-siteID URLs of the format /l/s;id=s-XXXXXXXX/*
(function(){
    // Creates a build data instance
    function createBuildData(buildName) {
        const
            buildData = {
                name: buildName,
                searchPath: []
            };

        // Needed for source maps.
        buildData.searchPath.push({
            urlPrefix : 'js/source/',
            pathRoot  : pathJoin(projectRoot, 'source')
        });

        // Needed for source maps.
        buildData.searchPath.push({
            urlPrefix : 'js/target/' + buildName + '/',
            pathRoot  : pathJoin(projectRoot, 'target', buildName)
        });

        buildData.searchPath.push({
            pathRoot : pathJoin(projectRoot, 'target', buildName)
        });

        return buildData;
    };

    // The 'common' build data.
    var commonBuildData = createBuildData('common');

    // Process the custom build site ID map.
    var siteIdToBuildDataMap = {};
    var siteIdMapFilePath = pathJoin(projectRoot, 'custom-config', 'site-id-map.json');
    if (fs.existsSync(siteIdMapFilePath)) {
        var fileMap = fs.readJsonSync(siteIdMapFilePath);
        for (var buildName in fileMap) {
            if (fileMap.hasOwnProperty(buildName)) {
                // Create the build data.
                var buildData = createBuildData(buildName);

                // Add this build data as the value for each site ID key
                var siteIdArray = fileMap[buildName];
                var len = siteIdArray.length;
                for (var i = 0; i < len; i++) {
                    siteIdToBuildDataMap[siteIdArray[i]] = buildData;
                }
            }
        }
    }

    // Set a listener for the per-site-ID libraries.
    app.get('/l/s;id=:siteId/*', function (req, res, next) {
        var siteId     = req.params.siteId,
            buildData  = siteIdToBuildDataMap[siteId] || commonBuildData,
            searchPath = buildData.searchPath,
            assetPath  = req.params[0],
            filePath   = null,
            found      = false;

        // Quick test to see if the requestor is trying to access files outside of the scope of this server
        // by using '..' notation.
        const testPath = path.normalize(pathJoin(projectRoot, req.params[0].split('/')));
        if ((testPath.length < projectRoot.length) || (testPath.substr(0, projectRoot.length) != projectRoot)) {
            res.send(403, 'Forbidden: ' + req.path);
        }
        else {
            // Look in each path for this build to see if the file is found.
            for (var i = 0; i < searchPath.length; i++) {
                var pathData = searchPath[i], assetPathComps = null;

                // If the path data has a URL prefix, the asset must have the same prefix in order to be a candidate...
                if (pathData.urlPrefix) {
                    if ((assetPath.length >= pathData.urlPrefix.length) &&
                        (assetPath.substr(0, pathData.urlPrefix.length) == pathData.urlPrefix)) {

                        assetPathComps = assetPath.substr(pathData.urlPrefix.length).split('/');
                    }
                // otherwise, this path is always a possible candidate.
                }
                else {
                    assetPathComps = assetPath.split('/');
                }

                // If path components exist, then this path is a candidate. Prefix the path with the project root,
                // and see if the requested file exists.
                if (assetPathComps) {
                    assetPathComps.unshift(pathData.pathRoot);
                    filePath = pathJoin(assetPathComps);

                    if (fs.existsSync(filePath)) {
                        found = true;
                        break;
                    }
                }
            }

            // If found, return the file. Otherwise, we have exhausted the paths, and have a 404.
            if (found) {
                res.sendfile(filePath);
            }
            else {
                res.send(404, 'File not found: ' + req.path);
            }
        }
    });
})();

// Allow serving of HTML/JS tools from the /tools/site/ directory
app.use('/tools', express.static(pathJoin(projectRoot, 'tools', 'site')));

// Allow dynamic insertion of the JavaScript library in the site files
(function(){
    // The previous include template.
    var inlineJsV1File = path.resolve(pathJoin(projectRoot, 'tests', 'views', 'inlineV1.html')),
        inlineJsV2File = path.resolve(pathJoin(projectRoot, 'tests', 'views', 'inlineV2.html'));

    function createInlineV1JsTemplate() {
        try {
            var templateContent = fs.readFileSync(inlineJsV1File, { encoding: 'UTF-8' });
            return hogan.compile(templateContent);
        }
        catch (t) {
            console.log("Unable to create inline JavaScript template (" + t.message + ")");
            return null;
        }
    }

    // The current include template.
    function createInlineV2JsTemplate() {
        try {
            var templateContent = fs.readFileSync(inlineJsV2File, { encoding: 'UTF-8' });
            return hogan.compile(templateContent);
        }
        catch (t) {
            console.log("Unable to create inline JavaScript template (" + t.message + ")");
            return null;
        }
    }

    var getInlineV1JsTemplate = createInlineV1JsTemplate;
    var getInlineV2JsTemplate = createInlineV2JsTemplate;

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
                    scjsurl:  req.query.scjsurl,
                    scwsid:   req.query.scwsid || 's-00000001',
                    siteConfigProps: siteConfigProps
                })
            }
        }
        return data;
    };

    // Set the root listener.
    var siteRoot = path.normalize(pathJoin(projectRoot, 'tests', 'pages'));
    app.get('/site/*', function (req, res, next) {
        var exists = false, filePath = path.normalize(pathJoin(siteRoot, req.params[0].split('/')));

        // See if the user is trying to access files outside of the site directory by using '..' notation.
        if ((filePath.length < siteRoot.length) || (filePath.substr(0, siteRoot.length) != siteRoot)) {
            res.send(403, 'Forbidden: ' + req.path);
        }
        else {
            if (fs.existsSync(filePath)) {
                var stats = fs.statSync(filePath);
                exists = true;

                if (stats.isDirectory()) {
                    filePath = path.normalize(pathJoin(filePath, 'index.html'));
                    exists = fs.existsSync(filePath);
                }
            }

            if (exists) {
                var inlineJsData = getInlineJSData(req);

                if (inlineJsData) {
                    let content = fs.readFileSync(filePath, { encoding: 'UTF-8' });

                    // Insert the markup.
                    content = content.replace(/(<head[^>]*>)/i, function (match, headStart) {
                        return headStart + inlineJsData.markup;
                    });

                    res.writeHead(200, {"Content-Type": mime.lookup(filePath)});
                    res.write(content);
                    res.end();
                }
                else {
                    res.sendfile(filePath);
                }
            }
            else {
                res.send(404, 'File not found: ' + req.path);
            }
        }
    });
})();

// Set listeners for all default (/) search paths.
app.use('/js/source', express.static(pathJoin(projectRoot, 'source')));
app.use('/js/target', express.static(pathJoin(projectRoot, 'target')));

// The common assets,
app.use(express.static(pathJoin(projectRoot, 'target', 'common')));


// Start the HTTP listener
const port = process.env.PORT || process.argv[2] || 8000;
app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log('Listening at "http://localhost:' + port + '/"');
});

// If needed, create the ports file with the proper ports
if (portFile) {
    fs.writeFileSync(portFile, '-Dswdda.testSite.httpPort=' + port + ' -Dswdda.sitecuesUrl.httpPort=' + port, {flag:'w'});
    chown(portFile);
}

// Enable HTTPS if needed.
if (useHttps){
    // Update the ports file.
    if (portFile) {
        fs.writeFileSync(portFile, ' -Dswdda.testSite.httpsPort=443 -Dswdda.sitecuesUrl.httpsPort=443', {flag:'a'});
    }

    // Start the HTTPS server on port 443.
    https.createServer({
        key  : fs.readFileSync('binary/cert/localhost.key'),
        cert : fs.readFileSync('binary/cert/localhost.cert')
    }, app).listen(443, function (err) {
        if (err) {
            throw err;
        }
        console.log('Listening at "https://localhost:443/"');
    });
}
