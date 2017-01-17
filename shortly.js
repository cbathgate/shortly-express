var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var bcrypt = require('bcrypt-nodejs');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
/////////////////////////
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 120000
  }
}));
/////////////////////////
app.use(express.static(__dirname + '/public'));



app.get('/', checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', checkUser, 
function(req, res) {
  res.render('index');
});

app.get('/links', checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login'); 
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.where('username', username).fetch() // fetch user from database
  .then(function(user) { // we've checked database for user
    if (user) { // user exists
      var hash = user.get('password');
      bcrypt.compare(password, hash, function(err, matches) {
        if (err) {
          console.log(err); 
        } else if (matches) { // password matches hash, successful login
          req.session.regenerate(function(err) {
            req.session.user = username;
            res.redirect('/');
          });
        } else { // unsuccessful login
          res.redirect('/login');
        }
      });
    } else { // user record does not exist in database
      res.redirect('/login');
    }
  }).catch(function(err) { // database error
    console.error(err);
    res.end();
  });
});

app.get('/signup', function(req, res) {
  res.render('signup');
}); 

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log('Line 132: signup');
  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      res.redirect('/login');
    } else {
      Users.create({
        username: username,
        password: password
      })
      .then(function(err) {
        req.session.regenerate(function(err) {
          req.session.user = username;
          res.redirect('/');
        }); 
      });
    }
  });
});

app.get('/logout', function(req, res) {
  if (req.session) {
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/login');
      }
    });  
  } else {
    res.redirect('/login');    
  }
});

function checkUser(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
