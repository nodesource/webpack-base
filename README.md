# InspireScript Webpack Configs
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

This package creates the base Webpack configuration for InspireScript projects. The
exported function expects an options object with the build environment. An optional
paths object can be used to customize build behavior.

## Installation
```bash
npm i -D @inspire-script/webpack-configs
```

## Usage:
```javascript
// webpack.config.js
const { resolve } = require('path')
const configs = require('@inspire-script/webpack-configs')

module.exports = env =>
  configs({
    env,
    paths: {
      context: resolve(__dirname)
    }
  })
```

The environment variable should be declared in the webpack build script with `--env`:
```bash
NODE_ENV=production webpack --env=production --progress --profile --colors
```

## Project structure
Build defaults use the following directory structure:
```
project
├─  public
│  ├─  index.html
│  └─  favicon.ico
├─  src
│  └─  index.jsx
├─  .babelrc
└─  webpack.config.js
```

## Default paths
Package uses the following default paths:

```javascript
{
  appIndexJs: '/src/index.jsx',
  appPackageJson: '/package.json',
  appPublic: '/public',
  appSrc: '/src',
  babelLoaderInclude: '/src',
  htmlTemplate: '/public/index.html',
  iconsSpriteLoader: 'src/media/icons',
  nodeModules: '/node_modules',
  outputPath: '/build',
  publicPath: '/',
  yarnLockFile: '/yarn.lock',
}
```

Build paths can be overriden by passing configuration paths in the configs options
object:

```javascript
const configs = require('@inspire-script/webpack-configs');

// Override appIndexJs to use src/main.js instead of src/index.js
module.exports = env =>
  configs({
    env,
    paths: {
      publicPath: env === 'production' ? 'https://cdn.project/' : '/'
    }
  });
```

## Webpack resolution
The build configures the following module resolutions for convenient shorthand
imports of common project directories.

Module | Usage
--- | ---
`/src` | Allows relative imports from the src directory, useful for shared utilities
`/src/styles` | Allows importing style variables directly from any SASS partial

## Environment variables
The following environment variables are set by build:

Constant | Usage
--- | ---
`process.env.BABEL_ENV` | Set to match `NODE_ENV` for configuring Babel by environment
`process.env.PUBLIC_PATH` | Set to `publicPath` configuration, useful for importing media and configuring CDN paths

## Styles
The configurations are intended for using Sass with the following patterns:
- Allow easy import of a base set of library styles from Node modules using the
  `~library/path/to/styles` syntax.
- Handle running styles through autoprefixer default configuration.
- Allow `.scss` files to be required into component files. Using the `.scss`
  extension is required.
- Allow component level namespacing of styles using a single top level local style
  class. The class `.component` is the standard class name to use for any component
  styles. This makes importing the localized class name into a component file
  consistent:
  ```scss
  // style.scss
  :local(.component) {
    .title {}
    .feature {}
    // etc..
  }
  ```
  ```javascript
  // component.jsx
  import { component } from './style.scss';
  // Importing component is standard and requires only a single import
  ```
  Having a single, standard import removes cognitive overhead for modular CSS for
  components.
