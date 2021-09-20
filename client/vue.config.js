const webpack = require('webpack');
const dotenv = require('dotenv');

// Load common configuration
const commonDotEnv = dotenv.config({ path: __dirname + '/./../common.env' });

if (!commonDotEnv ||  !commonDotEnv.parsed) throw new Error('.env files could not be parsed');

const configuration = commonDotEnv.parsed;

/** App-specific configuration can be added if required in the future  
// Load app-specific configuration
const appDotEnv = dotenv.config({ path: __dirname + '/./../<appName e.g. client / admin / intermediate>.env' });

if(!appDotEnv || !appDotEnv.parsed) throw new Error('.env files could not be parsed')
const configuration = { ...commonDotEnv.parsed, ...appDotEnv.parsed };
*/

module.exports = {
  // Change based on the directory needs
  publicPath: '/client/',
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "@/sass/partials/_variables.scss";`
      }
    }
  },
  devServer: {
    progress: false,
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(configuration),
      }),
    ]
  }
}