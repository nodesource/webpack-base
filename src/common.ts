import { optimize, EnvironmentPlugin, Configuration } from 'webpack'
import * as HtmlWebpackPlugin from 'html-webpack-plugin'

import { Paths } from './annotations'

/**
 * Cross environment common configurations. The development or production configs
 * will be merged with these base configs using `webpack-merge`
 * @param {Object} paths Configured paths for environment build
 * @return {Object} Build configurations common to all environments
 */
export default function common({
  appEntry,
  appSrc,
  babelLoaderInclude,
  htmlTemplate,
  nodeModules,
  outputFilename,
  outputPath,
  publicPath
}: Paths): Configuration {
  return {
    entry: {
      app: appEntry
    },

    output: {
      path: outputPath,
      // Entry chunks are emitted by name
      filename: outputFilename,
      // The public URL of the output directory when referenced in a browser
      // (The value of the option is prefixed to every URL created by the runtime or loaders)
      // Value: Serve all resources from /assets/, eg: /assets/app.js
      publicPath
    },

    // These options change how modules are resolved.
    // https://webpack.js.org/configuration/resolve/
    resolve: {
      // Allow resolving ts and tsx files
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      // Tell webpack what directories should be searched when resolving modules.
      // Including `appSrc` allows for importing modules relative to /src directory!
      modules: [nodeModules, appSrc],
      // Alias can be used to point imports to specific modules
      alias: {}
    },

    // Module
    // ---------------------------------------------------------------------------
    module: {
      rules: [
        // JS loader runs everything through eslint then Babel
        {
          test: /\.jsx?$/,
          // Only use loader with explicitly included files
          include: babelLoaderInclude,
          /**
         * ## Using Eslint Loader
         * The `eslint-loader` will run imported modules through eslint first and
         * surface errors/warnings in the webpack build (These are also picked up by
         * the webpack-dev-server).
         *
         * **DEPENDENCIES**: This package only includes the eslint-loader package,
         * `eslint` and any packages required to run the eslint rules for a project
         * must be included by that project. This allows projects to handle
         * specifying and configuring eslint explicitly as required.
         */
          use: [{ loader: 'babel-loader' }, { loader: 'eslint-loader' }]
        },
        // Basic image loader setup to use file-loader, configured to include hash
        // in filenames
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          use: [{ loader: 'file-loader?name=[name].[hash:8].[ext]' }]
        }
      ]
    },

    // Plugins
    // ---------------------------------------------------------------------------
    plugins: [
      // Replace all `process.env.<VARIABLE>` instances with their values
      // Replacing NODE_ENV allows Babili to strip dead code based on env
      new EnvironmentPlugin(['NODE_ENV']),

      // Generates index.html with injected script/style resources paths
      new HtmlWebpackPlugin({
        inject: true,
        template: htmlTemplate
      }),

      // Pull node_modules into vendor.js file using CommonsChunk, minChunks handles
      // checking if module is from node_modules and is a js/json file see
      // https://survivejs.com/webpack/building/bundle-splitting/
      // #loading-dependencies-to-a-vendor-bundle-automatically
      new optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: ({ resource }) =>
          resource &&
          resource.indexOf('node_modules') >= 0 &&
          resource.match(/\.(js|json)$/)
      }),

      // Extract manifest into separate chunk so that changes to the app src don't
      // invalidate the vendor bundle
      // https://survivejs.com/webpack/optimizing/separating-manifest/#extracting-a-manifest
      new optimize.CommonsChunkPlugin({
        name: 'manifest',
        minChunks: Infinity
      })
    ]
  } as Configuration
}
