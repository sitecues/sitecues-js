'use strict';

var gulp = require('gulp'),
  cleanHtml = require('gulp-cleanhtml'),
  minifyCss = require('gulp-minify-css'),
  config = require('./build-config');

// CSS -- minify
function css() {
  var source = gulp.src(config.cssGlob),
    processedSource = config.isMinifying ? source.pipe(minifyCss()) : source;
  return processedSource.pipe(gulp.dest(config.resourceDir + '/css'));
}

// HTML -- minify (only plain .html files, not from html we create via templates)
function html() {
  var source = gulp.src(config.htmlGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(config.resourceDir + '/html'));
}

// Images that are SVG -- minify them
function svg() {
  var source = gulp.src(config.svgGlob),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(config.resourceDir + '/images'));
}

// Images that are not SVG -- just copy them
function raster() {
  return gulp.src(config.rasterGlob)
    .pipe(gulp.dest(config.resourceDir + '/images'));
}

// Earcons only get copied (in the future we may choose to auto-convert them to the different file types we need -- mp3 and ogg)
function earcons() {
  return gulp.src(config.earconsGlob)
    .pipe(gulp.dest(config.resourceDir + '/earcons'));
}

module.exports = {
  css: css,
  html: html,
  svg: svg,
  raster: raster,
  earcons: earcons
};