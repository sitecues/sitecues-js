'use strict';

var gulp = require('gulp'),
  cleanHtml = require('gulp-cleanhtml'),
  minifyCss = require('gulp-minify-css'),
  config = require('./build-config'),
  yaml = require('node-yaml'),
  path = require('path'),
  fs = require('fs');

// CSS -- minify
function css() {
  var source = gulp.src(config.cssGlob),
    processedSource = config.isMinifying ? source.pipe(minifyCss()) : source;
  return processedSource.pipe(gulp.dest(config.buildDir + '/css'));
}

// HTML -- minify (only plain .html files, not from html we create via templates)
function html() {
  var source = gulp.src(config.htmlGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(config.buildDir + '/html'));
}

// Images that are SVG -- minify them
function svg() {
  var source = gulp.src(config.svgGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(config.buildDir + '/images'));
}

// Images that are not SVG -- just copy them
function raster() {
  return gulp.src(config.rasterGlob)
    .pipe(gulp.dest(config.buildDir + '/images'));
}

// Earcons only get copied (in the future we may choose to auto-convert them to the different file types we need -- mp3 and ogg)
function earcons() {
  return gulp.src(config.earconsGlob)
    .pipe(gulp.dest(config.buildDir + '/earcons'));
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
    const outputFileName = path.join(config.buildDir, 'version-map.bsv');
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
  css: css,
  html: html,
  svg: svg,
  raster: raster,
  earcons: earcons,
  versionMap: versionMap
};