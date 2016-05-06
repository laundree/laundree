var gulp = require('gulp')
var eslint = require('gulp-eslint')
var mocha = require('gulp-mocha')
var istanbul = require('gulp-istanbul')
var isparta = require('isparta')
var mongoose = require('mongoose')
var exec = require('child_process').exec
var runSequence = require('run-sequence')
var config = require('config')

gulp.task('lint', function () {
  return gulp.src(['{client,handlers,models,routes,setups,tests,utils,views}/**/*.js', '*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('test-unit', function (done) {
  gulp.src(['{handlers,models,utils,api/controllers}/**/*.js'])
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
        .on('end', () => {
          mongoose.connection.close()
          done()
        })
        .on('error', (error) => {
          mongoose.connection.close()
          done(error)
        })
    })
})

gulp.task('send-coverage', (done) => {
  if (!config.has('codeClimate.repoToken')) {
    console.log('Skipping sending coverage because of missing configuration')
    return done()
  }
  exec('./node_modules/.bin/codeclimate-test-reporter < coverage/lcov.info',
    (err, stdout, stderr) => {
      console.log(stdout)
      console.log(stderr)
      done(err)
    })
})

gulp.task('exit', (done) => {
  setTimeout(() => {
    done()
    process.exit(0)
  }, 1000)
})

gulp.task('test', (done) => {
  runSequence('lint', 'test-unit', 'send-coverage', 'exit', done)
})
