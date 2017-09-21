module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'karma-typescript'],
    files: [
      'src/**/*.ts',
      'test/**/*Spec.ts'
    ],
    exclude: ["**/*.d.ts"],
    preprocessors: {
      '**/*.ts': [ 'karma-typescript' ]
    },
    reporters: ['progress', 'karma-typescript'],

    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  })
}
