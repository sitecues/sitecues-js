'use strict';

var gulp = require('gulp'),
  cleanHtml = require('gulp-cleanhtml'),
  minifyCss = require('gulp-minify-css'),
  config = require('./build-config'),
  yaml = require('node-yaml'),
  path = require('path'),
  fs = require('fs'),
  got = require('got'),
  mkdirp = require('mkdirp');

// CSS -- minify
function css() {
  var source = gulp.src(config.cssGlob),
    processedSource = config.isMinifying ? source.pipe(minifyCss()) : source;
  return processedSource.pipe(gulp.dest(global.buildDir + '/css'));
}

// HTML -- minify (only plain .html files, not from html we create via templates)
function html() {
  var source = gulp.src(config.htmlGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(global.buildDir + '/html'));
}

// Images that are SVG -- minify them
function svg() {
  var source = gulp.src(config.svgGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(path.join(global.buildDir, 'images')));
}

// Images that are not SVG -- just copy them
function raster() {
  return gulp.src(config.rasterGlob)
    .pipe(gulp.dest(path.join(global.buildDir, 'images')));
}

// Earcons only get copied (in the future we may choose to auto-convert them to the different file types we need -- mp3 and ogg)
function earcons() {
  return gulp.src(config.earconsGlob)
    .pipe(gulp.dest(path.join(global.buildDir, 'earcons')));
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
    outputFolder = path.join(global.buildDir, 'cue', lang);

  return new Promise((resolve) => {
    // Wait longer and long with each request
    // This bypasses the rate limit implemented on the backend
    // If we don't do this we get 500 errors
    convertToAudioFile.waitMs = convertToAudioFile.waitMs ? convertToAudioFile.waitMs + 100 : 1;
    setTimeout(() => {
      mkdirp(outputFolder, {}, () => {
        got.stream(ttsUrl, { retries : 20 }) // High amount of retries because of rate limiting
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
    }, convertToAudioFile.waitMs);
  });
}

function copyCueTextFile(cueFilePath, outputFolder) {
  return new Promise((resolve) => {
    gulp.src(cueFilePath)
      .pipe(gulp.dest(outputFolder))
      .on('error', (err) => {
        throw err;
      })
      .on('finish', resolve);
  });
}

// Return the date of a file or 0 if it doesn't exist
function getFileDate(path) {
  try {
    return fs.statSync(path).mtime;
  }
  catch(ex) {
  }
  return 0;
}

function cues() {
  if (!config.audioCueDir) {
    // No cues to compute
    return Promise.resolve();
  }

  const copyPreviouslyComputedCues = () => {
    // First copy over previously computed cues
    return new Promise((resolve) => {
      gulp.src('latest-build/cue/**/*')
        .pipe(gulp.dest(path.join(global.buildDir, 'cue')))
        // Then recompute changed cues
        .on('end', resolve);
    });
  };

  const fetchChangedCues = () => {
    // Fetch cues from server only if their cue JSON file has changed since the last cues were fetched
    const allCuesDir = config.audioCueDir,
      jsonCueFiles = fs.readdirSync(allCuesDir),
      cueDataSaved = [];
    for (let cueFile of jsonCueFiles) {
      const lang = cueFile.split('.')[0],
        cueFilePath = path.join(config.audioCueDir, cueFile),
        sourceDate = getFileDate(cueFilePath),
        outputFolder = path.join(global.buildDir, 'cue', lang),
        sampleDestOutputFilePath = path.join(outputFolder, 'verbalCueSpeechOn.ogg'),
        destDate = getFileDate(sampleDestOutputFilePath);  // Get date for one output cue

      // If source is newer than dest, or if dest doesn't exist (destDate is 0), will fetch cues
      if (sourceDate > destDate) {
        console.log('Fetching cues for ' + lang);
        const allCuesForLang = require('..' + '/' + cueFilePath);
        for (let cue of Object.keys(allCuesForLang)) {
          cueDataSaved.push(convertToAudioFile(lang, cue, allCuesForLang[cue], 'ogg'));
          cueDataSaved.push(convertToAudioFile(lang, cue, allCuesForLang[cue], 'mp3'));
        }
      }
      else {
        console.log('Keeping cues for ' + lang);
      }

      cueDataSaved.push(copyCueTextFile(cueFilePath, outputFolder));
    }

    return Promise.all(cueDataSaved);
  };

  return copyPreviouslyComputedCues()
    .then(fetchChangedCues);
}

function metadata() {
  if (config.metaDataGlob) {
    return gulp.src(config.metaDataGlob)
      .pipe(gulp.dest(global.buildDir));
  }
  else {
    return Promise.resolve();
  }
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
    const outputFileName = path.join(global.buildDir, 'version-map.bsv');
    fs.writeFile(outputFileName, stringBuilder, (err) => {
      if (err) {
        throw err;
      }
      resolve();
    });
  });
}

function versionMap() {
  if (config.isBuildingVersionMap) {
    return yaml.read(path.join('..', 'version-map.yml'))
      .then(writeSimplifiedVersionMap);
  }
  else {
    return Promise.resolve();
  }
}

module.exports = {
  css,
  html,
  svg,
  raster,
  earcons,
  cues,
  metadata,
  versionMap
};