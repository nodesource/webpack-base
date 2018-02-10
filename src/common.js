const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineChunkManifestHtmlWebpackPlugin = require('inline-chunk-manifest-html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const SVGSymbolSpritePlugin = require('svg-symbol-sprite-loader/src/plugin')
const WebpackManifestPlugin = require('webpack-manifest-plugin')
const chalk = require('chalk')
const path = require('path')
const { optimize, DefinePlugin, EnvironmentPlugin } = require('webpack')

/**
 * The common configurations are used across environments.
 * @param {Object} configs
 * @return {Object} Build configurations common to all environments
 */
module.exports = ({
  appEntry,
  appPublic,
  appSrc,
  context: projectContext,
  define,
  htmlTemplate,
  iconsSpriteLoader,
  nodeModules,
  outputFilename,
  outputPath,
  publicPath,
  svgSprites,
}) => ({
  // Explicitly set the build context for resolving entry points and loaders
  // See: https://webpack.js.org/configuration/entry-context/#context
  context: projectContext,

  entry: {
    app: appEntry,
  },

  output: {
    path: outputPath,
    // Entry chunks are emitted by name
    filename: outputFilename,
    // The public URL of the output directory when referenced in a browser
    // (The value of the option is prefixed to every URL created by the runtime or loaders)
    // Value: Serve all resources from /assets/, eg: /assets/app.js
    publicPath,
  },

  // These options change how modules are resolved.
  // https://webpack.js.org/configuration/resolve/
  resolve: {
    // Allow resolving js and jsx files
    extensions: ['.js', '.jsx', '.json'],
    // Tell webpack what directories should be searched when resolving modules.
    // Including `appSrc` allows for importing modules relative to /src directory!
    modules: [nodeModules, appSrc],
    // Alias can be used to point imports to specific modules
    alias: {},
  },

  // Common Loader Definitions
  // ---------------------------------------------------------------------------
  module: {
    rules: [
      // ========================================================
      // 🔮 Markdown Loader
      // ========================================================
      {
        test: /\.md$/,
        use: [
          // Transpiles JSX to JS
          { loader: 'babel-loader' },
          // Import those svgs!
          ...svgSprites,
          // Convert markdown to a component with content as JSX
          { loader: path.resolve(__dirname, 'magic-markdown-loader/loader.js') },
        ],
      },

      // ========================================================
      // SVG Icons Loader
      // ========================================================

      // Create an svg sprite with any icons in the include paths
      {
        test: /\.svg$/,
        include: iconsSpriteLoader,
        use: [{ loader: 'svg-symbol-sprite-loader' }],
      },

      // ========================================================
      // Images Loader
      // ========================================================

      // Basic image loader setup with file name hashing
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        // Make sure that we don't try to use file-loader with icons for svg sprite
        exclude: iconsSpriteLoader,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash:8].[ext]',
              outputPath: 'static/media/',
            },
          },
        ],
      },

      // ========================================================
      // Text files Loader
      // ========================================================

      // If you want to import a text file you can ¯\_(ツ)_/¯
      {
        test: /\.txt$/,
        use: [{ loader: 'raw-loader' }],
      },
    ],
  },

  // Common Plugin Definitions
  // ---------------------------------------------------------------------------
  plugins: [
    // ========================================================
    // Stats
    // ========================================================

    // Visual compile indicator with progress bar
    new ProgressBarPlugin({
      callback() {
        console.log(`\n  🎉  ${chalk.bold('BINGO')} 🎉\n`)
      },
      clear: false, // Don't clear the bar on completion
      format: `  Hacking time... [:bar] ${chalk.green.bold(
        ':percent'
      )} (:elapsed seconds) :msg`,
    }),

    // ========================================================
    // Variable injections
    // ========================================================

    // Define environment variables in build.
    new EnvironmentPlugin({
      // ℹ️ Values passed to EnvironmentPlugin are defaults
      NODE_ENV: 'development', // strip dead code in prod builds
      DEBUG: false, // detailed logging level option
      PUBLIC_PATH: publicPath, // useful for routing and media from /public dir
    }),
    new DefinePlugin(define),

    // ========================================================
    // Asset extractions
    // ========================================================

    // Plugin for SVG symbol sprite extracts imported SVGs into a file
    // ⚠️ Plugin order matters! This plugin and the WebpackManifestPlugin/
    // InlineChunkManifestHtmlWebpackPlugin hook into the compiler 'emit' event.
    // This plugin must run first so that the generated sprite can be added to the
    // build chunks before the manifest plugin checks what chunks are in the build!
    new SVGSymbolSpritePlugin({
      filename: 'static/media/icon-sprite.[hash:8].svg',
    }),

    // ========================================================
    // File copying
    // ========================================================

    // Copy public directory to build directory, this is an escape hatch for assets
    // needed that are not imported into build
    new CopyWebpackPlugin([{ from: appPublic }]),

    // ========================================================
    // HTML index generator
    // ========================================================

    // Extracts the webpack asset manifest into a JSON file, this is useful for
    // knowing final asset ids after hashing, eg the SVG icon system uses the
    // manifest to look up the current sprite asset id.
    new WebpackManifestPlugin({
      // Don't include sourcemaps in manifest, they ugly
      filter: ({ name }) => !name.includes('.map'),
    }),

    // Inlines the chunk manifest in head, allowing reference to manifest without
    // having to fetch it first
    new InlineChunkManifestHtmlWebpackPlugin(),

    // Generates index.html with injected script/style resources paths
    new HtmlWebpackPlugin({
      favicon: `${appPublic}/favicon.ico`,
      minify: false,
      template: htmlTemplate,
    }),

    // ========================================================
    // Chunks
    // ========================================================

    // Pull node_modules into vendor.js file using CommonsChunk, minChunks handles
    // checking if module is from node_modules and is a js/json file see
    // https://survivejs.com/webpack/building/bundle-splitting/
    // #loading-dependencies-to-a-vendor-bundle-automatically
    new optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({ context }) => context && context.includes('node_modules'),
    }),

    // Extract manifest into separate chunk so that changes to the app src don't
    // invalidate the vendor bundle
    // https://survivejs.com/webpack/optimizing/separating-manifest/#extracting-a-manifest
    new optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    }),
  ],
})