const { localAuth, useAmsSql } = require('../config/env');

if (localAuth) {
  module.exports = require('./LocalUser.model');
} else if (useAmsSql) {
  module.exports = require('./AmsUser.model');
} else {
  module.exports = require('./User.model');
}
