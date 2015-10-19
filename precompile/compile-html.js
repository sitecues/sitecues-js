var handlebars = require('handlebars'),
  targetDir = process.argv[2] + '/',
  fs = require('fs'),
  minify = require('html-minifier').minify,
  sources = ['settings', 'tips']; // TODO 'help'

sources.forEach(readTemplate);

function readTemplate(templateName) {

  console.log('Compiling template: ' + templateName);
  var sourceFileName = 'source/html/' + templateName + '/' + templateName + '-template.hbs';
  fs.readFile(sourceFileName, compileTemplate);

  function compileTemplate(err, templateBuffer) {

    if (err) {
      console.log('Error reading template: ' + err);
    }

    function compileTemplateForLang(langFileName) {
      var data = getLanguageData(templateName, langFileName),
        targetFileName = targetDir + templateName + '/' + langFileName.split('.')[0] + '.html',
        templatedHtml = template(data),
        cleanedHtml = clean(templatedHtml);

      console.log('Created html: ' + targetFileName);

      fs.writeFile(targetFileName, cleanedHtml);
    }

    var template = handlebars.compile(templateBuffer.toString()),
      langFileNames = getLangsForTemplate(templateName);

    fs.mkdirSync(targetDir + templateName);

    langFileNames.forEach(compileTemplateForLang);
  }
}

function clean(html) {
  return minify(html, {
    removeComments: true,
    removeAttributeQuotes: true,
    collapseWhitespace: true
  });
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
    langCountrySplitter =  langFileName.match(COUNTRY_REGEX),
    langData = require(requireDir + langFileName);

  if (langCountrySplitter) {
    // Is country-specific file:
    // Extend the language data with the country data
    return getCountryData(langData, requireDir, langCountrySplitter[1] + '.json');
  }

  return langData;
}

function getCountryData(countryData, requireDir, baseLangFileName) {
  var baseLangData = require(requireDir + baseLangFileName),
    newData = JSON.parse(JSON.stringify(baseLangData));

  function copyInto(dest, source) {
    Object.keys(source).forEach(function(key) {
      var value = source[key];

      if (typeof value === 'string') {
        dest[key] = value;
      }
      else if (typeof value === 'object') {
        copyInto(dest[key], value);
      }
      else {
        throw('Only strings and objects allowed in ' + countryFileName);
      }
    });
  }

  copyInto(newData, countryData);

  return newData;
}