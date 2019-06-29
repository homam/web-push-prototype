const { resolve } = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require("path");
const envfile = require("envfile");
const env = envfile.parseFileSync(path.resolve("", ".env"));
const keys = envfile.parseFileSync(path.resolve("../", ".env"));

const publicPath = env.publicPath || ''

const urlModule = {
  test: /\.(pdf|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/,
  use: [
    {
      loader: 'url-loader',
      options: {
        limit: 12000,
        name: `dist/files/[hash].[ext]`,
      }
    },
  ]
}

const tsModule = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [path.resolve('src')],
  // exclude: /node_modules\/(?![module1|module2])/
  // https://github.com/babel/babel-loader/issues/171
  exclude: /node_modules/, 
  loader: 'babel-loader'
}

const definePlugin = new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'API_ROOT': JSON.stringify(env.API_ROOT),
    'PUBLIC_VAPID_KEY': JSON.stringify(keys.PUBLIC_VAPID_KEY)
  }
})


module.exports = {
  mode: 'production',
  entry: {
    "service-worker": resolve('src/service-worker.js'),
    "push": resolve('src/push.js')
  },
  externals: {},
  output: {
    filename: `[name].js`,
    path: resolve('dist'),
    publicPath: publicPath + '/',
  },
  resolve: {
    alias: {
    },
    modules: [
      'node_modules',
      'bower_components'
    ],
    symlinks: false,
    extensions: ['.ts', '.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      tsModule,
      urlModule,
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true
    })]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.WatchIgnorePlugin([
      /styl\.d\.ts$/,
      /css\.d\.ts$/
    ]),
    definePlugin,
  ].filter((v) => v !== null),
}
