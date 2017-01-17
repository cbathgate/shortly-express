var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  urls: function() {
    return this.hasMany(Link);    
  },
  /*
  initialize: function () {
    console.log('Initializing new User');
    this.on('creating', function(model, attrs, options) {
      //console.log('About to create hash with bcrypt');
      //console.log('model.get(password ========> ', model.get('password'));
      
      bcrypt.hash(model.get('password'), 10).then(function(hash) {
      // Store hash in your password DB. 
        model.set('password', hash);
      }).catch(function(err) {
        console.log(err);
      });
      
    });    
  }
  */
});

module.exports = User;