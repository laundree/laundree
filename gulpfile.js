var gulp = require('gulp')
var eslint = require('gulp-eslint')
var mocha = require('gulp-mocha')
var env = require('gulp-env')

gulp.task('lint', function () {
  return gulp.src(['**/*.js', 'gulpfile.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('test-unit-no-exit', function () {
  env({vars: {MONGO_URL: 'mongodb://localhost/testdb'}})
  return gulp.src('tests/unit/**/*.test.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}))
})

gulp.task('test-unit', function () {
  env({vars: {MONGO_URL: 'mongodb://localhost/testdb'}})
  return gulp.src('tests/unit/**/*.test.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}))
    .once('error', () => process.exit(1))
    .once('end', () => process.exit())
})

gulp.task('test-unit-docker', function () {
  return gulp.src('tests/unit/**/*.test.js', {read: false})
    .pipe(mocha({reporter: 'spec'}))
    .once('error', () => process.exit(1))
    .once('end', () => process.exit())
})

gulp.task('watch-test-unit', function () {
  gulp.watch('./tests/unit/*.test.js', ['test-unit-no-exit'])
  gulp.watch('./!(node_modules)/**/*.js', ['test-unit-no-exit'])
  gulp.watch('./*.js', ['test-unit'])
})

gulp.task('test', ['lint', 'test-unit'])
