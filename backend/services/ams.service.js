const { localAuth } = require('../config/env');

if (localAuth) {
  module.exports = require('./amsJson.service');
} else {
  module.exports = require('./amsSql.service');
}
