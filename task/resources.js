'use strict';

var gulp = require('gulp'),
  cleanHtml = require('gulp-cleanhtml'),
  minifyCss = require('gulp-minify-css'),
  config = require('./build-config'),
  yaml = require('node-yaml'),
  path = require('path'),
  fs = require('fs'),
  got = require('got'),
  mkdirp = require('mkdirp'),
  requireDir = require('require-dir');

// CSS -- minify
function css() {
  var source = gulp.src(config.cssGlob),
    processedSource = config.isMinifying ? source.pipe(minifyCss()) : source;
  return processedSource.pipe(gulp.dest(global.build.path + '/css'));
}

// HTML -- minify (only plain .html files, not from html we create via templates)
function html() {
  var source = gulp.src(config.htmlGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(global.build.path + '/html'));
}

// Images that are SVG -- minify them
function svg() {
  var source = gulp.src(config.svgGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(path.join(global.build.path, 'images')));
}

// Images that are not SVG -- just copy them
function raster() {
  return gulp.src(config.rasterGlob)
    .pipe(gulp.dest(path.join(global.build.path, 'images')));
}

// Earcons only get copied (in the future we may choose to auto-convert them to the different file types we need -- mp3 and ogg)
function earcons() {
  return gulp.src(config.earconsGlob)
    .pipe(gulp.dest(path.join(global.build.path, 'earcons')));
}

function convertToAudioFile(lang, cueName, cueText, type) {
  // Puts in delimiters on both sides of the parameter -- ? before and & after
  // locale is a required parameter
  function getLocaleParameter(locale) {
    return '?l=' + locale + '&';
  }

  // URL string for API calls
  function getApiUrl(restOfUrl) {
    return 'https://ws.sitecues.com/sitecues/api/' + restOfUrl;
  }

  function getTTSUrl(text, locale, type) {
    const SITE_ID = 's-00000005',
      restOfUrl = 'tts/site/' + SITE_ID + '/tts.' + type + getLocaleParameter(locale) + 't=' + encodeURIComponent(text);
    return getApiUrl(restOfUrl);
  }

  const ttsUrl = getTTSUrl(cueText, lang, type),
    outputFolder = path.join(global.build.path, 'cue', lang);
  return new Promise((resolve) => {
    mkdirp(outputFolder, {}, () => {
      return got.stream(ttsUrl)
        .on('error', (err) => {
          console.log(err);
          console.log(ttsUrl);
          throw err;
        })
        .pipe(fs.createWriteStream(path.join(outputFolder, cueName + '.' + type)))
        .on('error', (err) => {
          console.log(err);
          console.log(ttsUrl);
          throw err;
        })
        .on('finish', () => {
          resolve();
        });
    });
  });
}

function cues() {
  if (!config.audioCueDir) {
    return Promise.resolve();
  }

  const allCueLangs = requireDir(path.join('..', config.audioCueDir)),
    conversionPromises = [];

  for (let lang of Object.keys(allCueLangs)) {
    const allCuesForLang = allCueLangs[lang];
    console.log('Fetching cues for lang: ' + lang);
    for (let cue of Object.keys(allCuesForLang)) {
      conversionPromises.push(convertToAudioFile(lang, cue, allCuesForLang[cue], 'ogg'));
      conversionPromises.push(convertToAudioFile(lang, cue, allCuesForLang[cue], 'mp3'));
    }
  }
  return Promise.all(conversionPromises);
}

function writeSimplifiedVersionMap(sourceVersionMap) {
  function checkVersion(version) {
    const VERSION_REGEX = /^\d{1,2}\.\d{1,3}\.\d{1,3}$/;
    if (version !== 'latest' && !version.match(VERSION_REGEX)) {
      throw new Error('Invalid version ' + version + ' in version map');
    }
  }

  function getFinalVersion(version) {
    return version === 'latest' ? config.version.replace('-RELEASE', '') : version;
  }

  function checkSiteId(siteId) {
    const SITEID_REGEX = /^s-[a-f\d]{8}$/;
    if (!siteId.match(SITEID_REGEX)) {
      throw new Error('Invalid site id ' + siteId + ' in version map');
    }
  }

  return new Promise(function(resolve) {
    checkVersion(sourceVersionMap.DefaultVersion);
    let stringBuilder = 'default|' + getFinalVersion(sourceVersionMap.DefaultVersion),
      allSiteIds = new Set();

    for (let version of Object.keys(sourceVersionMap.MappedVersions)) {
      checkVersion(version);
      const siteIdTable = sourceVersionMap.MappedVersions[version];
      for (let siteId of Object.keys(siteIdTable)) {
        if (allSiteIds.has(siteId)) {
          throw new Error('Duplicate site id in version map');
        }
        checkSiteId(siteId);
        allSiteIds.add(siteId);
        // siteId|version|friendlyName
        const friendlyName = siteIdTable[siteId];
        stringBuilder += '\n' + siteId + '|' + getFinalVersion(version) + '|' + friendlyName;
      }
    }
    const outputFileName = path.join(global.build.path, 'version-map.bsv');
    fs.writeFile(outputFileName, stringBuilder, (err) => {
      if (err) {
        throw err;
      }
      resolve();
    });
  });
}

function versionMap() {
  return yaml.read(path.join('..', 'version-map.yml'))
    .then(writeSimplifiedVersionMap);
}

module.exports = {
  css,
  html,
  svg,
  raster,
  earcons,
  cues,
  versionMap
};