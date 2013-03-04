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
      tunnel.params = null;
    } else {
      tunnel.uptime = 'n/a';
      tunnel.params = buildTunnelParamsFields(tunnel);
    }
    return tunnel;
  }
  function buildTunnelParamsFields(tunnel) {
    if (!tunnel.params) return;

    var fields = [];
    for (var name in tunnel.params) {
      var param = tunnel.params[name];
      if (param.type == 'string') {
        fields.push({'textfield': {
          'label': name,
          'name': name,
          'value': param.default,
        }})
      } else if (param.type == 'list') {
        fields.push({'select': {
          'label': name,
          'name': name,
          'options': param.array.map(function(option) {
            return {'option': option, 'selected': option == param.default }
          }),
        }})
      }
    }
    return fields;
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
    tunnelManager.enable(tunnelID, req.body.params, function() {
      res.redirect('/');
    });
  })
  app.post('/disable', function(req, res, next) {
    var tunnelID = parseInt(req.body.id, 10);
    tunnelManager.disable(tunnelID);
    res.redirect('/');
  })

}
