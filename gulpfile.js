require('babel-register')
process.env.NODE_ENV = 'test'
const gulp = require('gulp')
const babel = require('gulp-babel')
const eslint = require('gulp-eslint')
const mocha = require('gulp-mocha')
const exec = require('child_process').exec
const runSequence = require('run-sequence')
const browserify = require('browserify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const uglify = require('gulp-uglify')
const buffer = require('vinyl-buffer')
const selenium = require('selenium-standalone')
const sauceConnectLauncher = require('sauce-connect-launcher')
const nightwatch = require('nightwatch')

gulp.task('lint', function () {
  return gulp.src(['{api,bin,client,email-templates,handlers,models,public,react,redux,routes,tests,utils,views}/**/*.{js,jsx}', '*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('coverage:send', (done) => {
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

// CLEAN

gulp.task('db:clean', () => {
  const dbUtils = require('./tests/db_utils')
  return dbUtils.clearDb()
})

// SERVER

let serverProcess

gulp.task('server:start', done => {
  serverProcess = require('./server').then(start => {
    serverProcess = start()
    serverProcess.on('listening', done)
  })
})

gulp.task('server:stop', () => {
  if (!serverProcess) throw new Error('Server is not started')
  serverProcess.close()
})

// SELENIUM

gulp.task('selenium:install', done => selenium.install({}, done))

let seleniumChild

gulp.task('selenium:start', done => selenium.start({}, (err, child) => {
  seleniumChild = child
  done(err)
}))

gulp.task('selenium:stop', done => {
  if (!seleniumChild) return done(new Error('Selenium not started'))
  seleniumChild.kill()
  done()
})

// SAUCE

let sauceProcess

gulp.task('sauce:connect', done => {
  const config = require('config')
  sauceConnectLauncher({
    username: config.get('sauceLabs.username'),
    accessKey: config.get('sauceLabs.accessKey')
  }, (err, sp) => {
    sauceProcess = sp
    done(err)
  })
})

gulp.task('sauce:disconnect', done => {
  if (!sauceProcess) return done(new Error('Sauce is not started'))
  sauceProcess.close(done)
})

// NIGHTWATCH

gulp.task('nightwatch:run', done => {
  nightwatch.runner({
    config: 'nightwatch.conf.js',
    env: 'default'
  }, passed => done(passed ? undefined : new Error('E2E test failed')))
})

gulp.task('nightwatch:run-local', done => {
  nightwatch.runner({
    config: 'nightwatch.conf.js',
    env: 'local'
  }, passed => done(passed ? undefined : new Error('E2E test failed')))
})

// TESTS

gulp.task('test:api', function () {
  return gulp.src('tests/unit/api/**/*.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:api-users', function () {
  return gulp.src('tests/unit/api/controllers/users.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:api-bookings', function () {
  return gulp.src('tests/unit/api/controllers/bookings.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('test:unit', function () {
  return gulp.src('tests/unit/**/*.spec.js')
    .pipe(babel())
    .pipe(mocha({reporter: 'spec'}))
})
gulp.task('test:api-coverage', function (done) {
  runSequence('coverage:instrument', 'test:api', 'coverage:report', done)
})

gulp.task('test:unit-coverage', function (done) {
  runSequence('coverage:instrument', 'test:unit', 'coverage:report', done)
})

gulp.task('test:e2e', done => {
  runSequence(
    'db:clean',
    'server:start',
    'sauce:connect',
    'nightwatch:run',
    'sauce:disconnect',
    'server:stop',
    done)
})

gulp.task('test:e2e-local', done => {
  runSequence(
    'db:clean',
    'selenium:install',
    'selenium:start',
    'server:start',
    'nightwatch:run-local',
    'server:stop',
    'selenium:stop',
    done)
})

gulp.task('test:e2e-docker', done => {
  runSequence(
    'db:clean',
    'nightwatch:run-local',
    done)
})

gulp.task('test:e2e-local-coverage', done => {
  runSequence(
    'coverage:instrument',
    'db:clean',
    'selenium:install',
    'selenium:start',
    'server:start',
    'nightwatch:run-local',
    'server:stop',
    'selenium:stop',
    'coverage:report',
    done)
})

gulp.task('test', (done) => runSequence('lint', 'test:unit', 'test:e2e', exit(done)))

gulp.task('test:no-cov', (done) => runSequence('lint', 'test:unit', 'test:e2e', exit(done)))

gulp.task('test:docker', (done) => runSequence('lint', 'test:unit', 'test:e2e-docker', exit(done)))

function exit (cb) {
  return err => setTimeout(() => {
    cb(err)
    process.exit(0)
  }, 1000)
}

gulp.task('build', function () {
  process.env.NODE_ENV = 'production'
  return browserify({
    entries: './client/index.js',
    transform: [babelify]
  })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/javascripts'))
})
