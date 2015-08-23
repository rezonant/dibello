module.exports = function(grunt) {
 
  // Configuration

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
 
    browserify: {
		app: {
			src: [
				'src/skate.js'
			],

			dest: 'dist/skate.js'
		}
    },

	concurrent: {
		dev: {
			tasks: ['watch', 'karma:start'],
			options: {
				logConcurrentOutput: true
			}
		}
	},

    watch: {
   		gruntfile: {
			files: ['Gruntfile.js'],
			tasks: [],
			options: {
				reload: true
			} 
		},

		docs: {
			files: [
				'jsdoc.conf.json',
				//'doc/template/template/tmpl/*.tmpl',
				'src/**/*.js',
				'test/**/*.js',
				'README.md'
			],
			tasks: ['jsdoc', 'shell:docPerms']
		}
    },

	bump: {
		options: {
			files: ["package.json", "bower.json"],
			updateConfigs: ["pkg"],
			commitFiles: ['package.json', 'bower.json', 'dist/skate.js', 'dist/skate.min.js'],
			commitMessage: 'Release v%VERSION%',
			createTag: true,
			tagName: 'v%VERSION%',
			tagMessage: 'Version %VERSION%',
			push: true,
			pushTo: 'origin',
			gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
		}
	},

	karma: {
	  unit: {
        configFile: 'karma.conf.js',
		singleRun: true
      },
	  start: {
		configFile: 'karma.conf.js',
		singleRun: false
	  }
	},

	jsdoc: {
        dist: {
			src: [],
            dest: 'doc', 
			options: { 
				configure: 'jsdoc.conf.json',
				verbose: true
			}
        }
    },

	shell: { 
		docPerms: {
			command: 'chmod a+rX doc/ -Rf'
		}
	},
	
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        compress: false,
        mangle: false,
        beautify: false
      },

      dist: {
        src: [
            'dist/skate.js',
        ],
        dest: 'dist/skate.min.js'
      }
    }
  });

  // Plugins

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-shell');

  // Tasks

  grunt.registerTask('default', ['dist', 'test']);
  grunt.registerTask('dist', ['browserify', 'uglify']);
  grunt.registerTask('test', ['karma']);
  grunt.registerTask('dev', ['concurrent:dev']);
  // Release tasks

  grunt.registerTask('tag-patch', ['default', 'test', 'bump:patch']);
  grunt.registerTask('tag-minor', ['default', 'test', 'bump:minor']);
  grunt.registerTask('tag-major', ['default', 'test', 'bump:major']);
  grunt.registerTask('tag-git', ['default', 'test', 'bump:git']);
  grunt.registerTask('tag-prepatch', ['default', 'test', 'bump:prepatch']);
  grunt.registerTask('tag-prerelease', ['default', 'test', 'bump:prerelease']);
 
};
