/**
 * This is a build step used to compile all of the html files we used
 * For each template (listed in sources), we need a version for each language.
 *
 * Example:
 * tips-template.hbs (handlebars template) + tips-de.json (template data) -> tips-de.html
 */

'use strict';

var config = require('./build-config'),
  mkdirp = require('mkdirp'),
  handlebars = require('handlebars'),
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
        targetFileName = targetDir + templateName + '/' + langFileName.split('.')[0] + '.html',
        templatedHtml = template(data),
        cleanedHtml = htmlClean(templatedHtml);

      console.log('Created html: ' + targetFileName);

      fs.writeFile(targetFileName, cleanedHtml, function (err) {
        if (err) {
          throw err;
        }
      });
    }

    mkdirp(targetDir + templateName, {}, function() {
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

  var files = fs.readdirSync('source/html/' + name);

  return files.filter(isLanguageFile);
}

function getLanguageData(templateName, langFileName) {
  var requireDir =  '../source/html/' + templateName + '/',
    COUNTRY_REGEX = /^(.*-[a-z][a-z])(?:-[a-z][a-z]\.json$)/,
    langCountrySplitter =  langFileName.match(COUNTRY_REGEX);

  var langData = require(requireDir + langFileName);

  if (langCountrySplitter) {
    // Is country-specific file:
    // Extend the language data with the country data
    langData = getCountryData(langData, requireDir, langCountrySplitter[1] + '.json');
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
        obj[key] = fs.readFileSync('task/' + requireDir + value.substring(2), 'utf8');
      }
    });
  }
  convertIncludes(langData);

  return langData;
}

function getCountryData(countryData, requireDir, baseLangFileName) {
  var baseLangData = require(requireDir + baseLangFileName),
    newData = Object.create(baseLangData);

  function copyInto(dest, source) {
    Object.keys(source).forEach(function(key) {
      var value = source[key],
        valueType = typeof value;

      if (valueType === 'string') {
        dest[key] = value;
      }
      else if (valueType === 'object') {
        copyInto(dest[key], value);
      }
      else {
        throw new Error('Only strings and objects allowed in ' + baseLangFileName);
      }
    });
  }

  copyInto(newData, countryData);

  return newData;
}

function begin(callback) {
  targetDir = config.resourceDir + '/html/';
  sources.forEach(readTemplate);
  callback();
}

module.exports = begin;
