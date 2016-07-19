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
      dev: ['./dev'],
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
            selector:  'script.lib',
            attribute: 'src',
            writeto:   'bowerComponents',
            isPath:    true
          },
          remove: ['script.lib'],
          append: [
            {selector:'head', html:'<link href="main.css" rel="stylesheet">'},
            {selector:'body', html:'<script src="lib.js"></script>'}
          ]
        },
        src: './source/index.html',
        dest: './dev/index.html'
      },
    },

    concat: {
      dev: {
        src: '<%= dom_munger.data.bowerComponents %>',
        dest: './dev/lib.js',
      },
    },

    copy: {
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
        tasks: ['sass']
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

  grunt.registerTask('build', ['jshint', 'clean:dist', 'sass:dist', 'copy:html', 'dom_munger:dist', 'concat']);
  grunt.registerTask('dev', ['jshint', 'clean', 'sass', 'copy', 'dom_munger:dev', 'concurrent:dev']);
}