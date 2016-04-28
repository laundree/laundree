var gulp = require('gulp')
var eslint = require('gulp-eslint')
var mocha = require('gulp-mocha')
var istanbul = require('gulp-istanbul')
var isparta = require('isparta')
var mongoose = require('mongoose')

gulp.task('lint', function () {
  return gulp.src(['{client,handlers,models,routes,setups,tests,utils,views}/**/*.js', '*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('test-unit', function () {
  gulp.src(['{handlers,models,utils}/**/*.js'])
    .pipe(istanbul({ // Covering files
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      return gulp.src('tests/**/*.spec.js', {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .pipe(istanbul.writeReports({
          dir: 'coverage',
          reportOpts: {dir: 'coverage'},
          reporters: ['text', 'text-summary', 'lcov']
        }))
        .on('end', () => mongoose.connection.close())
        .on('error', () => mongoose.connection.close())
    })
})

gulp.task('test', ['lint', 'test-unit'], (done) => done())
