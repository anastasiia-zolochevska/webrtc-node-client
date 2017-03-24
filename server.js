var express = require('express');
var client = require('./client.js')

var port = process.env.PORT || 3000;

var app = express()

app.get('/client', function (req, res) {
  client.startTest("westEurope");
})

app.listen(port, function () {
  console.log('Example app listening on port 3000!')
})