/**
 * This is a build step used to compile all of the html files we used
 * For each template (listed in sources), we need a version for each language.
 *
 * Example:
 * tips-template.hbs (handlebars template) + tips-de.json (template data) -> tips-de.html
 */

// TODO convert to promises so that async completion is signaled
'use strict';

var config = require('./build-config'),
  mkdirp = require('mkdirp'),
  handlebars = require('handlebars'),
  extend = require('extend'),
  targetDir ,
  fs         = require('fs'),
  path       = require('path'),
  htmlClean  = require('htmlclean'), // Non-gulp version, since this module has not been converted to using streams
  sources    = ['settings', 'tips', 'help' ];

function readTemplate(templateName) {

  function compileTemplate(err, templateBuffer) {

    if (err) {
      err.message = 'Error reading template:' + err.message;
      throw err;
    }

    var template = handlebars.compile(templateBuffer.toString()),
      langFileNames = getLangsForTemplate(templateName);

    function compileTemplateForLang(langFileName) {
      var data = getLanguageData(templateName, langFileName),
        targetFileName = path.join(targetDir, templateName, langFileName.split('.')[0] + '.html'),
        templatedHtml = template(data),
        cleanedHtml = htmlClean(templatedHtml);

      console.log('Created html: ' + targetFileName);

      fs.writeFile(targetFileName, cleanedHtml, function (err) {
        if (err) {
          throw err;
        }
      });
    }

    mkdirp(path.join(targetDir,templateName), {}, function() {
      langFileNames.forEach(compileTemplateForLang);
    });
  }

  var sourceFileName = path.join('source', 'html', templateName, templateName + '-template.hbs');
  console.log('Compiling template: ' + templateName);
  fs.readFile(sourceFileName, compileTemplate);
}

function getLangsForTemplate(name) {

  function isLanguageFile(name) {
    return !!name.match(/.*\.json$/);
  }

  var files = fs.readdirSync(path.join(config.librarySourceDir, 'html', name));

  return files.filter(isLanguageFile);
}

function getRawLanguageData(fileName) {
  var buffer = fs.readFileSync(fileName),
    json = buffer.toString();

  return JSON.parse(json);
}

function getLanguageData(templateName, langFileName) {
  var langDataDir = path.join(config.librarySourceDir, 'html', templateName),
    COUNTRY_REGEX = /^(.*-[a-z][a-z])(?:-[a-z][a-z]\.json$)/,
    langCountrySplitter =  langFileName.match(COUNTRY_REGEX);


  var langData = getRawLanguageData(path.join(langDataDir, langFileName));

  if (langCountrySplitter) {
    // Is country-specific file:
    // Extend the language data with the country data
    langData = getCountryData(langData, langDataDir, langCountrySplitter[1] + '.json');
  }

  // Convert @@includedFileName to the text from that file
  function convertIncludes(obj) {
    Object.keys(obj).forEach(function(key) {
      var value = obj[key];
      if (typeof value === 'object') {
        convertIncludes(value);
      }
      else if (value.substring(0,2) === '@@') {
        // Include content from another file
        obj[key] = fs.readFileSync(path.join(langDataDir, value.substring(2)), 'utf8');
      }
    });
  }
  convertIncludes(langData);

  return langData;
}

function getCountryData(countryData, dir, baseLangFileName) {
  var baseLangData = getRawLanguageData(path.join(dir, baseLangFileName));

  return extend(true, {}, baseLangData, countryData);
}

function begin(callback) {
  targetDir = path.join(global.build.path, 'html');
  sources.forEach(readTemplate);
  callback();
}

module.exports = begin;
