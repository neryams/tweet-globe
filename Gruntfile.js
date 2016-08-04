/* jshint node: true, strict: false */
module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      options: {
        loadPath: './bower_components/foundation-sites/scss'
      },
      dev: {
        options: {
          sourcemap: 'auto',
          style: 'nested'
        },
        files: {
          './dev/main.css': './source/app.scss'
        }
      },
      dist: {
        options: {
          sourcemap: 'none',
          style: 'compressed'
        },
        files: {
          './dist/main.min.css': './source/app.scss'
        }
      }
    },

    jshint: {
      main: {
        options: {
          jshintrc: './source/.jshintrc'
        },
        src: ['./source/*.js', './source/**/*.js']
      }
    },

    clean: {
      dev: ['<%= grunt.config.get("directory") %>*'],
      dist: ['./dist/*'],
      dist_post: ['./tmp/']
    },

    dom_munger: {
      dev: {
        options: {
          append: [
            {selector:'head', html:'<link href="main.css" rel="stylesheet">'}
          ]
        },
        src: './dev/index.html'
      },
      dist: {
        options: {
          read: {
            selector:  'script',
            attribute: 'src',
            writeto:   'bowerComponents',
            isPath:    true
          },
          remove: ['script'],
          append: [
            {selector:'head', html:'<link href="main.min.css" rel="stylesheet">'},
            {selector:'body', html:'<script src="main.min.js"></script>'}
          ]
        },
        src: './source/index.html',
        dest: './dist/index.html'
      },
    },

    concat: {
      dist: {
        src: '<%= dom_munger.data.bowerComponents %>',
        dest: './tmp/main.js',
      }
    },

    uglify: {
      options: {
        compress: {
          drop_console: true
        },
        mangle: true
      },
      dist: {
        files: {
          'dist/main.min.js': ['./tmp/main.js']
        }
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd:    './source',
          src:    [ './**/*.html' ],
          dest:   './dist'
        },{
          src:    './bower_components/webgl-globe/globe/world.jpg',
          dest:   './dist/assets/world.jpg'
        }]
      },
      html: {
        files: [{
          expand: true,
          cwd:    './source',
          src:    [ './**/*.html' ],
          dest:   './dev'
        },{
          src:    './bower_components/webgl-globe/globe/world.jpg',
          dest:   './dev/assets/world.jpg'
        }]
      },
      js: {
        files: [{
          expand: true,
          cwd:    './source',
          src:    [ './**/*.js' ],
          dest:   './dev'
        }]
      }
    },

    nodemon: {
      dev: {
        script: 'app.js'
      }
    },

    watch: {
      grunt: { files: ['Gruntfile.js'] },

      sass: {
        files: './source/**/*.scss',
        tasks: ['sass:dev']
      },

      copyHtml: {
        files: ['./source/**/*.html'],
        tasks: ['copy:html', 'dom_munger:dev']
      },

      copyJs: {
        files: ['./source/**/*.js'],
        tasks: ['jshint', 'copy:js']
      }
    },

    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.registerTask('build', ['jshint', 'clean:dist', 'sass:dist', 'copy:dist', 'dom_munger:dist', 'concat', 'uglify', 'clean:dist_post']);
  grunt.registerTask('dev', ['jshint', 'clean:dev', 'sass:dev', 'copy:html', 'copy:js', 'dom_munger:dev', 'concurrent']);
};