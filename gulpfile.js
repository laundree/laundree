var gulp = require('gulp')
var eslint = require('gulp-eslint')
var fs = require('fs')
var browserify = require('browserify')
var babelify = require('babelify')

gulp.task('lint', function () {
  return gulp.src(['**/*.js', 'gulpfile.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('build', function () {
  return browserify('./client/index.js')
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(fs.createWriteStream('resources/bundle.js'))
})

gulp.task('test', ['lint'])
