var gulp = require('gulp'),
  cleanHtml = require('gulp-cleanhtml'),
  minifyCss = require('gulp-minify-css'),
  config = require('./build-config');

// CSS -- minify
function css() {
  var source = gulp.src(config.CSS_GLOB + '*.css'),
    processedSource = config.isMinifying ? source.pipe(minifyCss()) : source;
  return processedSource.pipe(gulp.dest(config.resourceDir + '/css'));
}

// HTML -- minify (only plain .html files, not from html we create via templates)
function html() {
  var source = gulp.src(config.HTML_PLAIN_GLOB),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(config.resourceDir + '/html'));
}

// Images that are SVG -- minify them
function svg() {
  var source = gulp.src(config.SVG_GLOB),
    processedSource = config.isMinifying ? source.pipe(cleanHtml()) : source;
  return processedSource
    .pipe(gulp.dest(config.resourceDir + '/images'));
}

// Images that are not SVG -- just copy them
function raster() {
  return gulp.src(config.RASTER_GLOB)
    .pipe(gulp.dest(config.resourceDir + '/images'));
}

// Earcons only get copied (in the future we may choose to auto-convert them to the different file types we need -- mp3 and ogg)
function earcons() {
  return gulp.src(config.EARCONS_GLOB)
    .pipe(gulp.dest(config.resourceDir + '/earcons'));
}

module.exports = {
  css: css,
  html: html,
  svg: svg,
  raster: raster,
  earcons: earcons
};