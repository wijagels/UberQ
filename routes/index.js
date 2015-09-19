var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var Uber = require('node-uber');

var uber = new Uber({
  client_id: process.env.UBER_CID,
  client_secret: process.env.UBER_CS,
  server_token: process.env.UBER_ST,
  redirect_uri: 'http://localhost:3000/oauth',
  name: 'ÜberQ'
});

AWS.config.update({region: 'us-east-1'});
var dynamodb = new AWS.DynamoDB();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/check', function(req, res, next) {
    var params = {
        Key: { /* required */
            gcm_id: { /* AttributeValue */
                S: req.query.gcm_id
            }
        },
        TableName: 'Users'
    };
    dynamodb.getItem(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        if(Object.keys(data).length != 0) {
            console.log(data);
            res.send({"result": true});
        }
        else {
            res.send({"result": false});
        }
    });
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
                'gcm_id': req.query.gcm_id,
                'access_token': access_token,
                'refresh_token': refresh_token
            });
            var params = {
                Item: {
                    gcm_id: {
                        S: req.query.gcm_id
                    },
                    uber_access: {
                        S: access_token
                    },
                    uber_refresh: {
                        S: refresh_token
                    },
                },
                TableName: 'Users'
            };
            dynamodb.putItem(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            }); }
    });
});

module.exports = router;
