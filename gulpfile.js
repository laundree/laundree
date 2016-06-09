require('babel-register')
process.env.NODE_ENV = 'test'
var gulp = require('gulp')
var babel = require('gulp-babel')
var eslint = require('gulp-eslint')
var mocha = require('gulp-mocha')
var istanbul = require('gulp-babel-istanbul')
var isparta = require('isparta')
var exec = require('child_process').exec
var runSequence = require('run-sequence')

gulp.task('lint', function () {
  return gulp.src(['{client,handlers,models,routes,setups,tests,utils,views}/**/*.{js,jsx}', '*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('coverage:instrument', () => {
  return gulp.src(['{handlers,models,utils,api/controllers}/**/*.js'])
    .pipe(istanbul({ // Covering files
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire())
})
gulp.task('coverage:report', () => {
  return gulp.src(['{handlers,models,utils,api/controllers}/**/*.js'])
    .pipe(istanbul.writeReports({
      dir: 'coverage',
      reportOpts: {dir: 'coverage'},
      reporters: ['text', 'text-summary', 'lcov']
    }))
    .pipe(istanbul.enforceThresholds({thresholds: {global: 90}}))
})

gulp.task('test:api', function () {
  return gulp.src('tests/api/**/*.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:api-booking', function () {
  return gulp.src('tests/api/controllers/bookings.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:unit', function () {
  return gulp.src('tests/**/*.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:api-coverage', function (done) {
  runSequence('coverage:instrument', 'test:api', 'coverage:report', done)
})
gulp.task('test:unit-coverage', function (done) {
  runSequence('coverage:instrument', 'test:unit', 'coverage:report', done)
})

gulp.task('send-coverage', (done) => {
  var config = require('config')
  if (!config.has('codeClimate.repoToken')) {
    console.log('Skipping sending coverage because of missing configuration')
    return done()
  }
  exec('./node_modules/.bin/codeclimate-test-reporter < coverage/lcov.info',
    (err, stdout, stderr) => {
      console.log(stdout)
      console.log(stderr)
      console.log(err)
      done()
    })
})

gulp.task('exit', (done) => {
  setTimeout(() => {
    done()
    process.exit(0)
  }, 1000)
})

gulp.task('test', (done) => {
  runSequence('lint', 'test:unit-coverage', 'send-coverage', 'exit', done)
})
