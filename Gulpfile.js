var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('styles', function() {
     gulp.src('./src/**/*.scss', { base: "./" })
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('.'))
});

//Watch task
gulp.task('default',function() {
    gulp.watch('./src/**/*.scss',['styles']);
});