
var webrtc = require('wrtc');
var appInsights = require("applicationinsights");
var socketClient = require('socket.io-client');


var RTCPeerConnection = webrtc.RTCPeerConnection;
var RTCSessionDescription = webrtc.RTCSessionDescription;
var RTCIceCandidate = webrtc.RTCIceCandidate;

var pcConfig = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
};

var peerConnection, socket, room;


appInsights.setup().setAutoCollectExceptions(true).start();
var appInsightsClient = appInsights.getClient();


function onSocketReceivedMessage(message) {
  if (message.type === 'answer') {
    setRemoteDescription(message)
  } else if (message.type === 'candidate') {
    peerConnection.addIceCandidate(message.candidate);
  }
};

function sendMessage(message) {
  log('Client sending message: ', message);
  socket.emit('message', message, room);
}


function onIceCandidate(event) {
  if (!event.candidate) return;
  log('onicecandidate');
  sendMessage({
    type: 'candidate',
    candidate: event.candidate
  });
}

function handleError(error) {
  appInsightsClient.trackException(error);
  throw error;
}

function log(message, data) {
  if (!data) { data = '' }
  console.log(message, data);
  appInsightsClient.trackTrace(message + data);
}

function createOffer() {
  log('Client: create offer');
  peerConnection.createOffer(setLocalDescription, handleError);
}

function setLocalDescription(desc) {
  log('Client: set local description', desc);
  peerConnection.setLocalDescription(
    new RTCSessionDescription(desc),
    sendMessage.bind(undefined, desc),
    handleError
  );
}

function setRemoteDescription(desc) {
  log('Client: set remote description', desc);
  peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
}
function sendMessageThroughDataChannel() {
  dataChannel.send(JSON.stringify({ "sentTs": Date.now() }));
}

function startTest(params) {
  room = params;
  socket = socketClient('http://3dstreamingsignalingserver.azurewebsites.net:80');
  socket.emit('join', room);
  socket.on('message', onSocketReceivedMessage);

  peerConnection = new RTCPeerConnection(pcConfig);
  peerConnection.onicecandidate = onIceCandidate;

  var dataChannel = peerConnection.createDataChannel(room);

  dataChannel.onopen = function () {
    dataChannel.send(JSON.stringify({ "sentTs": Date.now() }));
  }

  createOffer();

  var checks = 0;
  var expected = 5;
  var rttSum = 0;

  return new Promise(function (resolve, reject) {
    dataChannel.onmessage = function (event) {

      log("client received ", event.data)

      var data = JSON.parse(event.data);
      if (data.receivedTs) {
        rttSum += Date.now() - data.sentTs;
      }

      if (++checks >= expected) {
        dataChannel.send("close");
        done();
        resolve(rttSum / expected);
      } else {
        dataChannel.send(JSON.stringify({ "sentTs": Date.now() }));
      }
    };

  });
}

function done() {
  peerConnection.close();
  socket.emit('bye', room);
}

module.exports = {
  startTest: startTest
}
