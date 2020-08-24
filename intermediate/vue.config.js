const webpack = require('webpack');
const dotenv = require('dotenv');

// Load common configuration
const commonDotEnv = dotenv.config({ path: __dirname + '/./../common.env' });

// Load app-specific configuration
const appDotEnv = dotenv.config({ path: __dirname + '/./../intermediate.env' });


if (!commonDotEnv || !appDotEnv || !commonDotEnv.parsed || !appDotEnv.parsed) throw new Error('.env files could not be parsed');

const configuration = { ...commonDotEnv.parsed, ...appDotEnv.parsed };

module.exports = {
  // Change based on the directory needs
  publicPath: process.env.NODE_ENV === 'production' ?
    '/intermediate/' : '/intermediate/',
  devServer: {
    progress: false
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(configuration),
    }),
    ]
  }
}