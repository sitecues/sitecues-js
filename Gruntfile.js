module.exports = function (grunt) {

    'use strict';

    // Project configuration.
    grunt.initConfig(
        {
            // JSONLint configuration, used for linting config files...
            jsonlint : {
                normal : {
                    // be explicit, globbing too much hurts performance...
                    src : [
                        'package.json',
                        'config/**/*.json',
                        'test/**/*.json',
                        'source/**/*.json'
                    ]
                }
            },

            // JSHint configuration, used for linting the library...
            jshint : {
                options : {
                    // Options here override JSHint defaults and are 'task local',
                    // meaning all targets in this task inherit these options...
                    bitwise   : true,       // no bitwise - helps avoid mistyped && statements
                    curly     : true,       // require curly braces when optional
                    eqeqeq    : true,       // require strict equality checks (=== vs ==)
                    es3       : true,       // adhere to EcmaScript 3 for old Internet Explorer
                    freeze    : true,       // prohibits altering the prototype of native objects
                    immed     : true,       // IIFEs must be wrapped in parentheses (function(){}())
                    indent    : 4,          // NOT enforced - intended spaces-per-tab for better error messages
                    latedef   : 'nofunc',       // variables and functions must be declared before use
                    maxdepth  : 8,          // don't allow insane nesting of blocks
                    maxlen    : 140,        // maximum number of characters on a single line
                    maxparams : 4,          // max number of parameters functions are allowed to have
                    newcap    : true,       // require capitalized constructor functions
                    noarg     : true,       // prohibits using arguments.caller or arguments.callee
                    noempty   : true,       // prohibits empty blocks of code
                    nonbsp    : true,       // prohibits no-break spaces in source code (HTML entities are fine)
                    nonew     : true,       // must assign objects from new Constructor() calls to a variable
                    plusplus  : true,       // no using ++ or --
                    quotmark  : 'single',   // must use single quotes for strings (easier to make bookmarks)
                    strict    : true,       // all functions must be inside of a 'srtict mode' scope
                    undef     : true,       // cannot use variables before they are defined
                    unused    : true,       // don't allow variables to go unused
                    // Relax, bro...
                    browser   : true,       // we will be in a browser, with a window and document, etc.
                    devel     : true        // allow console, alert, etc.
                },
                grunt : {
                    // This target is intended to isolate the linting configuration
                    // for the app's Gruntfile.js to only where it really matters...
                    options : {
                        globals : {
                            module : false
                        }
                    },
                    files : {
                        src : ['Gruntfile.js']
                    }
                },
                tests : {
                    // This target is intended to isolate the linting configuration
                    // for the app's tests to only where it really matters...
                    options : {
                        strict : false, // tests should be allowed to use non-strict APIs
                        globals : {
                            define   : false, // used by AMD modules
                            suite    : false, // used by the testing framework
                            test     : false, // used by the testing framework
                            sitecues : false  // used by the main library
                        },
                        // This tells JSHint to ignore the use of 'with' statements,
                        // which we are okay with in our testing framework...
                        '-W085' : true
                    },
                    files : {
                        src : [
                            'test/**/*.js',
                            '!test/legacy/**'
                        ]
                    }
                },
                js : {
                    // This target is the main one, and affects most of the app...
                    files : {
                        src : [
                            'source/**/*.js'
                        ]
                    }
                }
            },

            // JSCS configuration, used for enforcing code style requirements...
            jscs : {
                options : {
                    config : 'config/code-style.json'
                },
                grunt : {
                    files : {
                        src : [
                            'Gruntfile.js'
                        ]
                    }
                },
                tests : {
                    options : {
                        disallowKeywords : null // tests are allowed to use 'with'
                    },
                    files : {
                        src : [
                            'test/**/*.js'
                        ]
                    }
                },
                js : {
                    files : {
                        src : [
                            'source/**/*.js'
                        ]
                    }
                }
            },

            // JSLint configuration, used for optional advice on code style...
            jslint : {
                grunt : {
                    directives : {
                        predef : [    // list of global variables we should be able to use
                            'module'
                        ]
                    },
                    files : {
                        src : [
                            'Gruntfile.js'
                        ]
                    }
                },
                js : {
                    options : {
                        edition : 'latest' // version of JSLint to use
                    },
                    directives : {
                        browser : true,  // The library is intended for use in a browser, global variables like document are fine.
                        devel   : true,  // The library is intended to aid developers, use of APIs like the console is fine.
                        // maxlen  : 140,   // maximum number of characters on a single line
                        white   : true,  // JSLint disagrees with our whitespace conventions, tell it to quiet down
                        unparam : true,  // allow unused parameters (JSHint is more flexible with this)
                        predef  : [
                            // list of global variables we should be able to use...
                            // 'sitecues'
                        ]
                    },
                    files : {
                        src : [
                            'source/**/*.js'
                        ]
                    }
                }
            },

            // Intern configuration, used for the app's unit testing and functional testing...
            intern : {
                options : {
                    config  : 'config/intern',  // path to the default, base configuration for the testing framework
                    runType : 'runner'          // runner for remote browser control, client for unit testing
                },
                normal : {
                    // empty target because it inherits task local options
                },
                cloud : {
                    options : {
                        config : 'config/intern-cloud'
                    }
                }
            },

            // Watch configuration, used for automatically executing
            // tasks when saving app files during development...
            watch : {
                files : ['**.*'],          // files to watch for changes
                tasks : ['lint']  // tasks to trigger when watched files change
            }
        }
    );

    // Load the plugin that provides the "jsonlint" task.
    grunt.loadNpmTasks('grunt-jsonlint');
    // Load the plugin that provides the "jshint" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    // Load the plugin that provides the "jscs" task.
    grunt.loadNpmTasks('grunt-jscs');
    // Load the plugin that provides the "jslint" task.
    grunt.loadNpmTasks('grunt-jslint');
    // Load the plugin that provides the "intern" task.
    grunt.loadNpmTasks('intern');
    // Load the plugin that provides the "watch" task.
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Make a new task called 'lint'.
    grunt.registerTask('lint', ['jsonlint', 'jshint', 'jscs']);
    // Make a new task called 'opinion'.
    grunt.registerTask('opinion', ['lint', 'jslint']);
    // Make a new task called 'test'.
    grunt.registerTask('test', ['intern:cloud']);

    // Default task, will run if no task is specified.
    grunt.registerTask('default', ['lint']);

};
