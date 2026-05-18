const { localAuth } = require('../config/env');

module.exports = localAuth ? require('./LocalUser.model') : require('./User.model');
