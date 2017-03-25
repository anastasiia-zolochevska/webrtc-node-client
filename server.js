var express = require('express');
var request = require('request')
var client = require('./client.js')

var port = process.env.PORT || 3000;

var app = express()

app.get('/getRTT', function (req, res) {
  var room = Date.now();
  var server = req.param("server");
  request(server + "?room=" + room);
  setTimeout(function () {
    client.startTest(room).then(rtt => res.send({ 'rtt': rtt }))
  }, 3000);
})

app.listen(port, function () {
  console.log('Example app listening on port 3000!')
})