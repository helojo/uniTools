var gulp = require('gulp');
var runSequence = require('run-sequence');
var bump = require('gulp-bump');
var gutil = require('gulp-util');
var git = require('gulp-git');
var fs = require('fs');
var stripDebug = require('gulp-strip-debug'); // 仅用于本例做演示
var del = require('del');
var vinylPaths = require('vinyl-paths');


// 我们在这里定义一些常量以供使用
var SRC = 'publish/**/*';
var DEST = 'published';

gulp.task('clean:publish',function(cb){
  del([
    DEST
    ],cb);
});

gulp.task('publish:version', function () {
// 注意：这里我硬编码了更新类型为 'patch'，但是更好的做法是用
//      minimist (https://www.npmjs.com/package/minimist) 通过检测一个命令行参数来判断你正在做的更新是
//      一个 'major'， 'minor' 还是一个 'patch'。
  return gulp.src(SRC)
    .pipe()
    .pipe(gulp.dest(DEST));
});

// gulp.task('clean:tmp', function () {
//   return gulp.src('published/*')
//     .pipe(stripDebug())
//     .pipe(gulp.dest('dist'))
//     .pipe(vinylPaths(del));
// });

gulp.task('bump-version', function () {
// 注意：这里我硬编码了更新类型为 'patch'，但是更好的做法是用
//      minimist (https://www.npmjs.com/package/minimist) 通过检测一个命令行参数来判断你正在做的更新是
//      一个 'major'， 'minor' 还是一个 'patch'。
  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({type: "patch"}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
  return gulp.src('.')
    .pipe(git.commit('[Prerelease] Bumped version number', {args: '-a'}));
});

gulp.task('push-changes', function (cb) {
  git.push('origin', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {
  var version = getPackageJsonVersion();
  git.tag(version, 'Created Tag for version: ' + version, function (error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', {args: '--tags'}, cb);
  });

  function getPackageJsonVersion () {
    // 这里我们直接解析 json 文件而不是使用 require，这是因为 require 会缓存多次调用，这会导致版本号不会被更新掉
    return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  };
});

gulp.task('release', function (callback) {
  runSequence(
    'bump-version',
    'commit-changes',
    'push-changes',
    'create-new-tag',
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY');
      }
      callback(error);
    });
});



gulp.task('default', ['clean:publish','publish:version']);