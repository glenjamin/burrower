var spawn = require('child_process').spawn;

var MAX_RETRIES = 10;
var RETRY_DELAY = 500; //ms
var STABLE_AFTER = 5000; //ms

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
    tunnel.state = 'active';
    tunnel.started = new Date();
    
    // Process established and stable
    var stableTimer = setTimeout(function() {
      tunnel.retries = 0;
    }, STABLE_AFTER);
    
    tunnel.ssh.on('exit', function(code, signal) {
      // Don't mark the process as stable
      clearTimeout(stableTimer);
      delete tunnel.started;
      
      // Attempt to restart up to MAX_RETRIES times 
      if (tunnel.retries < MAX_RETRIES) {
        tunnel.retries += 1;
        setTimeout(function() {
          exports.enable(tunnelID)
        }, RETRY_DELAY)
        return;
      }
      // No Retries left. mark as broken
      tunnel.state = 'broken';
      tunnel.retries = 0;
    })
    
  })
}

exports.disable = function(tunnelID) {
  exports.getTunnel(tunnelID, function(tunnel) {
    tunnel.ssh.removeAllListeners('exit');
    tunnel.ssh.kill('SIGINT');
    tunnel.state = 'disabled';
  })
}