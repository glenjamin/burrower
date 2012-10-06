var spawn = require('child_process').spawn;

var MAX_RETRIES = 10;
var RETRY_DELAY = 500; //ms

// TODO: proper persistence?
//  - sqlite
//  - file format for easier import/export
//
// Current format:
// {
//   id: 1,
//   name: 'WLP Staging MySQL',
//   sshHost: 'staging.wlp',
//   sshLocalForward: '3307:localhost:3306'
// }
var tunnelData = require('./data');

// Default state on startup is off
tunnelData.forEach(function(tunnel) {
  tunnel.state = 'disabled';
  tunnel.retries = 0;
})

exports.getTunnel = function(tunnelID, callback) {
  tunnelData.some(function(tunnel) {
    if (tunnel.id == tunnelID) {
      callback(tunnel);
      return true;
    }
  })
}
exports.getData = function(callback) {
  callback(null, tunnelData);
}

exports.enable = function(tunnelID) {
  exports.getTunnel(tunnelID, function(tunnel) {
    tunnel.ssh = spawn('ssh', [
      tunnel.sshHost,
      '-Nv',
      '-L', tunnel.sshLocalForward
    ])
    tunnel.ssh.on('exit', function(code, signal) {
      // No Retries left? mark as broken
      if (tunnel.retries > MAX_RETRIES) {
        tunnel.state = 'broken';
        return;
      }
      // Otherwise, keep trying
      tunnel.retries += 1;
      setTimeout(function() {
        exports.enable(tunnelID)
      }, RETRY_DELAY)
    })
    tunnel.state = 'active';
  })
}

exports.disable = function(tunnelID) {
  exports.getTunnel(tunnelID, function(tunnel) {
    tunnel.ssh.removeAllListeners('exit');
    tunnel.ssh.kill('SIGINT');
    tunnel.state = 'disabled';
  })
}