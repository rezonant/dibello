import * as karma from 'karma';
import * as path from 'path';

export = function (config: karma.Config) {
  config.set(<karma.ConfigOptions & { webpack }>{
    basePath: '',
    files: [
      { pattern: 'src/**/*.test.ts' }
    ],
    browsers: ['Chrome'],
    preprocessors: {
      'src/**/*.test.ts': ['webpack']
    },
    plugins: [
      'karma-webpack',
      'karma-material-reporter',
      'karma-sourcemap-loader',
      'karma-chrome-launcher'
    ],
    webpack: {
      devtool: 'inline-source-map',
      externals: {
        fs: 'undefined'
      }, 
      module: {
        rules: [
          {
            test: /\.ts$/,
            include: path.join(__dirname, 'src'),
            use: [
              {
                loader: 'ts-loader',
                options: {
                  compilerOptions: {
                    module: "ES2015",
                    target: "ES2015",
                    moduleResolution: "node"
                  }
                }
              }
            ]
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.js'],
      },
    },
    
    reporters: [
      'progress',
      //'material'
    ],
    
    webpackMiddleware: {
      stats: 'errors-only',
    }
  })
}
