var express = require('express');
var router = express.Router();

var aws = require('aws-sdk');
var Uber = require('node-uber');

var uber = new Uber({
  client_id: process.env.UBER_CID,
  client_secret: process.env.UBER_CS,
  server_token: process.env.UBER_ST,
  redirect_uri: 'http://localhost:3000/oauth',
  name: 'ÜberQ'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/check', function(req, res, next) {
    res.send('hey');
});

router.get('/uberauth', function(req, res, next) {
    console.log(req.query.authorization_code);
    uber.authorization({authorization_code: req.query.authorization_code}, function(err, access_token, refresh_token) {
        if(err) {
            console.error(err);
            res.send(err);
        }
        else {
            console.log(access_token);
            console.log(refresh_token);
            res.send({
                'access_token': access_token,
                'refresh_token': refresh_token
            });
        }
    });
});

module.exports = router;
