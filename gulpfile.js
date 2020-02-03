'use strict';

const { parallel, series, task, src, watch, dest } = require('gulp');
const prefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const rigger = require('gulp-rigger');
const cssmin = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const rimraf = require('rimraf');
const browserSync = require('browser-sync');
const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const gulpPlumber = require('gulp-plumber');
const htmlmin = require('gulp-htmlmin');
const notify = require('gulp-notify');
const htmlValidator = require('gulp-w3c-html-validator');
const makeDir = require('make-dir');
const write = require('write');

task('init', cb => {
  Promise.all([
    makeDir('./src/js'),
    makeDir('./src/images'),
    makeDir('./src/fonts'),
    makeDir('./src/scss'),
    makeDir('./src/static')
  ])
    .then(paths => {
      console.log(
        `⚡️ Folder structure has been generated! To start development, run a command [ npm run dev ]`
      );
      write.sync('./src/index.html', '', { overwrite: true });
      cb();
    })
    .catch(err => console.log('Error: ', err));
});

const empty = () => {
  var through = require('through2');
  return through.obj(function(file, enc, cb) {
    cb(null, file);
  });
};

const onEmpty = (type = 'dev', fn, params) => {
  if (type === 'prod') {
    return params ? fn(params) : fn();
  }
  return empty();
};

const reload = browserSync.reload;

const plumber = () => {
  return gulpPlumber({
    errorHandler: notify.onError('<%= error.message %>')
  });
};

const path = {
  build: {
    ROOT: 'build/',
    HTML: 'build/',
    JS: 'build/js/',
    STYLE: 'build/css/',
    IMAGES: 'build/images/',
    FONTS: 'build/fonts/'
  },
  src: {
    HTML: 'src/*.html',
    JS: 'src/js/*.js',
    STYLE: 'src/scss/*.scss',
    IMAGES: 'src/images/**/*.*',
    FONTS: 'src/fonts/**/*.*'
  },
  watch: {
    HTML: 'src/**/*.html',
    JS: 'src/js/**/*.js',
    STYLE: 'src/scss/**/*.scss',
    IMAGES: 'src/images/**/*.*',
    FONTS: 'src/fonts/**/*.*'
  },
  clean: './build'
};

const config = {
  server: {
    baseDir: './build'
  },
  tunnel: true,
  host: 'localhost',
  port: 9000,
  logPrefix: 'Devserver'
};

task('webserver', () => {
  browserSync(config);
});

task('clean', cb => {
  rimraf(path.clean, cb);
});

const htmlTask = (type = 'dev') => () => {
  return src(path.src.HTML)
    .pipe(plumber())
    .pipe(rigger())
    .pipe(htmlValidator())
    .pipe(htmlValidator.reporter())
    .pipe(onEmpty(type, htmlmin, { collapseWhitespace: true }))
    .pipe(dest(path.build.HTML))
    .pipe(reload({ stream: true }));
};

task('html:dev', htmlTask('dev'));
task('html:prod', htmlTask('prod'));

const jsTask = (type = 'dev') => () => {
  const plugins = [babel(), resolve(), commonjs()];
  if (type === 'prod') plugins.push(terser());
  return src(path.src.JS)
    .pipe(plumber())
    .pipe(rigger())
    .pipe(sourcemaps.init())
    .pipe(rollup({ plugins }, 'umd'))
    .pipe(sourcemaps.write())
    .pipe(dest(path.build.JS))
    .pipe(reload({ stream: true }));
};

task('js:dev', jsTask('dev'));
task('js:prod', jsTask('prod'));

const styleTask = (type = 'dev') => () =>
  src(path.src.STYLE)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        sourceMap: true,
        errLogToConsole: true
      })
    )
    .pipe(prefixer())
    .pipe(onEmpty(type, cssmin))
    .pipe(sourcemaps.write())
    .pipe(dest(path.build.STYLE))
    .pipe(reload({ stream: true }));

task('style:dev', styleTask('dev'));
task('style:prod', styleTask('prod'));

const imagesTask = (type = 'dev') => () => {
  return src(path.src.IMAGES)
    .pipe(plumber())
    .pipe(
      onEmpty(type, imagemin, {
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [pngquant()],
        interlaced: true
      })
    )
    .pipe(dest(path.build.IMAGES))
    .pipe(reload({ stream: true }));
};

task('images:dev', imagesTask('dev'));
task('images:prod', imagesTask('prod'));

task('fonts:build', () => {
  return src(path.src.FONTS)
    .pipe(plumber())
    .pipe(dest(path.build.FONTS));
});

task('watch', cb => {
  watch([path.watch.HTML], series('html:dev'));
  watch([path.watch.STYLE], series('style:dev'));
  watch([path.watch.JS], series('js:dev'));
  watch([path.watch.IMAGES], series('images:dev'));
  watch([path.watch.FONTS], series('fonts:build'));
  cb();
});

task(
  'build:dev',
  series(
    'clean',
    parallel('html:dev', 'js:dev', 'style:dev', 'images:dev', 'fonts:build')
  )
);

task(
  'build',
  series(
    'clean',
    parallel('html:prod', 'js:prod', 'style:prod', 'images:prod', 'fonts:build')
  )
);

task('default', series('build:dev', 'watch', 'webserver'));
