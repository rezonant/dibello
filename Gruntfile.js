module.exports = function(grunt) {

  // Project configuration.
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

    watch: {
    	main: {
			files: [
				'Gruntfile.js',
				'**/*.js'
			],
			tasks: ['default'],
			options: {
				reload: true
			}
		}
    },

	bump: {
		options: {
			files: ["package.json", "bower.json", "README.md", "dist/skate.js", "dist/skate.min.js"],
			updateConfigs: ["pkg"],
			//commitFiles: ['package.json', 'bower.json', 'README.md'],
			commitFiles: false,
			commitMessage: ['Release v%VERSION%'],
			createTag: false,
			tagName: 'v%VERSION%',
			tagMessage: 'Version %VERSION%',
			push: false,
			pushTo: 'origin',
			gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
		}
	},

	karma: {
	  unit: {
        configFile: 'karma.conf.js',
		singleRun: true
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

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify']);
  grunt.registerTask('test', ['karma']);

  grunt.registerTask('tag-patch', ['default', 'test', 'bump:patch']);
  grunt.registerTask('tag-minor', ['default', 'test', 'bump:minor']);
  grunt.registerTask('tag-major', ['default', 'test', 'bump:major']);
  grunt.registerTask('tag-git', ['default', 'test', 'bump:git']);
  grunt.registerTask('tag-prepatch', ['default', 'test', 'bump:prepatch']);
  grunt.registerTask('tag-prerelease', ['default', 'test', 'bump:prerelease']);
 
};
