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
  }
}
