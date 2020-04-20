'use strict';

const { parallel, series, task, src, watch, dest } = require('gulp');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const rigger = require('gulp-rigger');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const rimraf = require('rimraf');
const browserSync = require('browser-sync');
const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const plumber = require('gulp-plumber');
const htmlmin = require('gulp-htmlmin');
const notify = require('gulp-notify');
const htmlValidator = require('gulp-w3c-html-validator');
const builtins = require('rollup-plugin-node-builtins');
const json = require('@rollup/plugin-json');

const emptyPipe = () => {
  var through = require('through2');
  return through.obj(function (file, enc, cb) {
    cb(null, file);
  });
};

const prodPipe = (type, fn, params) => {
  if (type === 'prod') {
    return params ? fn(params) : fn();
  }
  return emptyPipe();
};

const reload = browserSync.reload;

const onPlumber = () =>
  plumber({
    errorHandler: (err) => {
      notify.onError({
        title: err.plugin,
        message: err.message,
      })(err);
    },
  });

const path = {
  build: {
    ROOT: 'build/',
    HTML: 'build/',
    JS: 'build/js/',
    STYLE: 'build/css/',
    IMAGES: 'build/images/',
    FONTS: 'build/fonts/',
    PUBLIC: 'build/',
  },
  src: {
    HTML: ['src/**/!(_*).html', '!src/templates/**/*'],
    JS: 'src/js/*.js',
    STYLE: 'src/css/!(_*).*',
    IMAGES: 'src/images/**/*.*',
    FONTS: 'src/fonts/**/*.*',
    PUBLIC: 'src/public/**/*.*',
  },
  watch: {
    HTML: 'src/**/*.html',
    JS: 'src/js/**/*.js',
    STYLE: 'src/css/**/*.*',
    IMAGES: 'src/images/**/*.*',
    FONTS: 'src/fonts/**/*.*',
    PUBLIC: 'src/public/**/*.*',
  },
  clean: './build',
};

const config = {
  server: {
    baseDir: './build',
  },
  tunnel: false,
  host: 'localhost',
  port: 9000,
  logPrefix: 'Devserver',
};

task('webserver', () => {
  browserSync(config);
});

task('clean', (cb) => {
  rimraf(path.clean, cb);
});

const htmlTask = (type) => () => {
  return src(path.src.HTML)
    .pipe(onPlumber())
    .pipe(rigger())
    .pipe(prodPipe(type, htmlmin, { collapseWhitespace: true }))
    .pipe(plumber.stop())
    .pipe(dest(path.build.HTML))
    .pipe(reload({ stream: true }));
};

task('html:dev', htmlTask('dev'));
task('html:prod', htmlTask('prod'));

task('html:validator', () => {
  return src(path.src.HTML)
    .pipe(onPlumber())
    .pipe(rigger())
    .pipe(htmlValidator())
    .pipe(plumber.stop())
    .pipe(dest(path.build.HTML))
    .pipe(reload({ stream: true }));
});

task('validate', () => {
  return src(path.src.HTML)
    .pipe(onPlumber())
    .pipe(rigger())
    .pipe(htmlValidator())
    .pipe(plumber.stop());
});

const jsTask = (type) => () => {
  const plugins = [json(), resolve({ browser: true }), commonjs(), builtins(), babel()];
  if (type === 'prod') plugins.push(terser());
  return src(path.src.JS)
    .pipe(onPlumber())
    .pipe(sourcemaps.init())
    .pipe(rollup({ plugins }, 'iife'))
    .pipe(sourcemaps.write())
    .pipe(dest(path.build.JS))
    .pipe(reload({ stream: true }));
};

task('js:dev', jsTask('dev'));
task('js:prod', jsTask('prod'));

const styleTask = (type) => () => {
  const plugins = [autoprefixer(), cssnano()];
  return src(path.src.STYLE)
    .pipe(onPlumber())
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        sourceMap: true,
        errLogToConsole: true,
      })
    )
    .pipe(prodPipe(type, postcss, plugins))
    .pipe(sourcemaps.write())
    .pipe(dest(path.build.STYLE))
    .pipe(reload({ stream: true }));
};

task('style:dev', styleTask('dev'));
task('style:prod', styleTask('prod'));

const imagesTask = (type) => () => {
  return src(path.src.IMAGES)
    .pipe(onPlumber())
    .pipe(
      prodPipe(type, imagemin, {
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [pngquant()],
        interlaced: true,
      })
    )
    .pipe(dest(path.build.IMAGES))
    .pipe(reload({ stream: true }));
};

task('images:dev', imagesTask('dev'));
task('images:prod', imagesTask('prod'));

task('fonts:build', () => {
  return src(path.src.FONTS).pipe(onPlumber()).pipe(dest(path.build.FONTS));
});

task('public:build', () => {
  return src(path.src.PUBLIC).pipe(onPlumber()).pipe(dest(path.build.PUBLIC));
});

task('watch', (cb) => {
  watch([path.watch.HTML], series('html:dev'));
  watch([path.watch.STYLE], series('style:dev'));
  watch([path.watch.JS], series('js:dev'));
  watch([path.watch.IMAGES], series('images:dev'));
  watch([path.watch.FONTS], series('fonts:build'));
  watch([path.watch.PUBLIC], series('public:build'));
  cb();
});

task('watch:validator', (cb) => {
  watch([path.watch.HTML], series('html:validator'));
  watch([path.watch.STYLE], series('style:dev'));
  watch([path.watch.JS], series('js:dev'));
  watch([path.watch.IMAGES], series('images:dev'));
  watch([path.watch.FONTS], series('fonts:build'));
  watch([path.watch.PUBLIC], series('public:build'));
  cb();
});

task(
  'build:dev',
  series(
    'clean',
    parallel(
      'html:dev',
      'js:dev',
      'style:dev',
      'images:dev',
      'fonts:build',
      'public:build'
    )
  )
);

// Build for Production
task(
  'build',
  series(
    'clean',
    parallel(
      'html:prod',
      'js:prod',
      'style:prod',
      'images:prod',
      'fonts:build',
      'public:build'
    )
  )
);

// Develop
task('default', series('build:dev', 'watch', 'webserver'));

// Develop with HTML Validator
task('dev', series('build:dev', 'watch:validator', 'webserver'));
