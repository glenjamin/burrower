var Duration = require('duration');

module.exports = function(app, tunnelManager) {

  function merge(dest, src) {
    for (var key in src) {
      dest[key] = src[key];
    }
  }

  var tunnelViewStates = {
    'active': {
      statusText: 'Active',
      statusClass: 'success',

      toggle: '/disable',
      toggleText: 'Disable',
      toggleClass: 'warning'
    },
    'broken': {
      statusText: 'Broken',
      statusClass: 'error',

      toggle: '/enable',
      toggleText: 'Enable',
      toggleClass: 'success'
    },
    'disabled': {
      statusText: 'Disabled',
      statusClass: 'warning',

      toggle: '/enable',
      toggleText: 'Enable',
      toggleClass: 'success'
    }
  }
  function processTunnelViewData(tunnel) {
    tunnel = Object.create(tunnel);
    merge(tunnel, tunnelViewStates[tunnel.state]);
    if (tunnel.started) {
      tunnel.uptime = new Duration(tunnel.started, new Date).toString(1);
    } else {
      tunnel.uptime = 'n/a';
    }
    return tunnel;
  }

  app.get('/', function(req, res, next) {
    tunnelManager.getData(function(err, data) {
      if (err) return next(err);
      data = data.map(processTunnelViewData)
      res.render('index', {tunnels: data});
    })
  })

  app.post('/enable', function(req, res, next) {
    var tunnelID = parseInt(req.body.id, 10);
    tunnelManager.enable(tunnelID);
    res.redirect('/');
  })
  app.post('/disable', function(req, res, next) {
    var tunnelID = parseInt(req.body.id, 10);
    tunnelManager.disable(tunnelID);
    res.redirect('/');
  })

}
