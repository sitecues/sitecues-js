//  Note: "make build dev=false" removes all code inside if(UNIT) from the build
//
//     if(UNIT){
//        exports.something="Chikun";
//      }

UNIT = true; // Chikun says this OK :)

// Override/mock sitecues object.
var blankFunction = function() {},

    /**
     * Check if it the existing module and hence is not expected to be loaded.
     * For now we only care about jquery.
     * Potentially, there might be more modules we do not want to load from 'data' folder.
     * @param {type} name
     * @returns {Boolean} true if there is a module with this name; false if this is a path.
     */
    isExistingModule = function(name) {
        return name.toString() === 'jquery';
    },

    // Define the expected behavior when necessary.
    // The sitecues.def mock :
    //     arguments[1] is the callback whose parameters are dependencies
    // NOTE : The actual definition of def is found in core.js in the source directory.
    def = function() {

        return arguments[1]({}, function() {}, {
            'info': function() {}
        });

    },

    use = function() {

        var args = [],
            index = 0,
            callback;

        // Look over the parameters. For ex., 'jquery', 'conf', 'cursor/style' etc.
        while (index < arguments.length - 1) {

            // Add the module if it is already loaded.
            if (isExistingModule(arguments[index])) {
                args.push(jquery);
            } else {

                // Otherwise, load the module from /data folder and execute it.
                args.push(require('../data/modules/' + arguments[index]));
            }
            index++;
        }

        // The last parameter is callback.
        callback = arguments[arguments.length - 1];
        return callback.apply(this, args);
    };

// Initialize. This helps to use 'exports' object only under nodejs.
sitecues = {

    'def': blankFunction,

    'use': blankFunction,

    'on': blankFunction,

    'off': blankFunction,

    'emit': blankFunction,

    'ui': {
        'sliders': []
    },

    'getLibraryConfig': function() {
        return {
            'hosts': {
                'up': 'abc',
                'ws': 'def'
            }
        };
    },

    'getLibraryUrl': function() {
        return {
            'raw': true
        };
    },

    'getVersion': function() {
        return '0.0.0-UNIT';
    },

};


// Now stub the functions we need.
sinon.stub(sitecues, 'def', def);
sinon.stub(sitecues, 'use', use);