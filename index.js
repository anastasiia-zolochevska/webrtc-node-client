var express = require('express');
var client = require('./client.js')

var app = express()

app.get('/client', function (req, res) {
  client.startTest("westEurope");
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})