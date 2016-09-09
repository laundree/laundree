require('babel-register')
process.env.NODE_ENV = 'test'
const gulp = require('gulp')
const babel = require('gulp-babel')
const eslint = require('gulp-eslint')
const mocha = require('gulp-mocha')
const istanbul = require('gulp-babel-istanbul')
const isparta = require('isparta')
const exec = require('child_process').exec
const runSequence = require('run-sequence')
const browserify = require('browserify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const uglify = require('gulp-uglify')
const buffer = require('vinyl-buffer')

gulp.task('lint', function () {
  return gulp.src(['{api,bin,client,email-templates,handlers,models,public,react,redux,routes,tests,utils,views}/**/*.{js,jsx}', '*.js'])
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

gulp.task('test:api-users', function () {
  return gulp.src('tests/api/controllers/users.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:api-bookings', function () {
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
  const config = require('config')
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

gulp.task('build', function () {
  process.env.NODE_ENV = 'production'
  return browserify({
    entries: './client/index.js',
    transform: [ babelify ]
  })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/javascripts'))
})
