var gulp = require('gulp')
var rename = require('gulp-rename');
var uglify = require('gulp-uglify')
var babel = require('gulp-babel')
const { series, src } = require('gulp');
const clean = require('gulp-clean') //清除目录或者文件
const notify = require('gulp-notify') //通知
const browserify = require('browserify')
const source = require('vinyl-source-stream')
var gzip = require('gulp-gzip');


function del() {
  return src('monitor.min.js', { allowEmpty: true })
    .pipe(clean())
    .pipe(notify({ message: 'monitor.min.js文件清除完成' }))
}

function ug() {
  return src('src/monitor.js')
    .pipe(babel({
      presets: ['es2015'] // es5检查机制
    }))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(''))
    // .pipe(notify({ message: 'monitor.min.js文件压缩完成' }))
}

function browser() {
  var b = browserify({
    entries: 'monitor.min.js'
  })
  return b.bundle().pipe(source('monitor.min.js')).pipe(gulp.dest(''))
}

function ug2() {
  return src('monitor.min.js')
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest(''))
    .pipe(notify({ message: 'monitor.min.js文件压缩完成' }))
}

gulp.task('default', series(del, ug, browser, ug2))






