'use strict'

const http = require('http')
const https = require('https')

module.exports = function getHTML(url) {

  return new Promise(function (resolve, reject) {
    (/^https/i.test(url) ? https : http).get(url, function (res) {
      var html = ''

      res.on('data', function (chunk) {
        // chunk is a Buffer instance, use the method toString to get the string
        html += chunk
      })

      res.on('end', function () {
        resolve(html)
      })
    }).on('error', function () {
      reject()
    })
  })
}
