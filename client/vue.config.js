// This is needed so vue can server the SPA at a particular end point
// E.g. setting the url to /client/ means that the SPA would be 
// served on localhost/client/#/
module.exports = {
  // Change based on the directory needs
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/production-end-point/'
    : '/client'
}