var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  urls: function() {
    return this.hasMany(Link);    
  },
  
  initialize: function () {
    console.log('Initializing new User');
    this.on('creating', function(model, attrs, options) {
      console.log('About to create hash with bcrypt');
      console.log('model.get(password ========> ', model.get('password'));
 
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(model.get('password'), salt);
      console.log('hash =========> ', hash);
      model.set('password', hash);     

      /*
      bcrypt.genSalt(10, function(err, salt) {
        if (err) {
          console.log(err);
        } else {
          bcrypt.hash(model.get('password'), salt, null, function(err, hash) {
            if (err) {
              console.log(err);
            } else {
              // Store hash in your password DB. 
              console.log('hash =========> ', hash);
              model.set('password', hash);
              // model.set('salt', salt);
            }
          });
        }
      });
      */      
    });    
  }  
});

module.exports = User;