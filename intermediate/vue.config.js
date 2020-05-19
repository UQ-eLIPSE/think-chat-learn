module.exports = {
  // Change based on the directory needs
  publicPath: process.env.NODE_ENV === 'production' ?
    '/intermediate/' : '/intermediate/',
  devServer: {
    progress: false
  }
}