var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var Uber = require('node-uber');
var request = require('request');

var uber = new Uber({
  client_id: process.env.UBER_CID,
  client_secret: process.env.UBER_CS,
  server_token: process.env.UBER_ST,
  redirect_uri: 'http://localhost:3000/oauth',
  base_url: 'https://sandbox-api.uber.com/', //SANDBOX MODE!!!
  name: 'ÜberQ'
});
var default_product = "b8e5c464-5de2-4539-a35a-986d6e58f186" //UberX
var default_latitude=40.7492643
var default_longitude=-73.9891284

AWS.config.update({region: 'us-east-1'});
var dynamodb = new AWS.DynamoDB();
console.log(uber.defaults.name);

uber.get({'url': 'products', 'params': {'latitude': default_latitude, 'longitude': default_longitude}}, function(err, data) {
    console.log(data);
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
            var randjc = randomCode();
            var params2 = {
                Item: {
                    JoinCode: {
                        S: randjc
                    },
                    players: {
                        L: [
                            {
                                S: req.query.gcm_id
                            }
                        ]
                    },
                },
                TableName: 'CurrentGames',
            }
            dynamodb.putItem(params2, function(err, data) {
                if(err) {
                    console.log(err);
                }
                else {
                    res.send({
                        "result": true,
                        "joinCode": randjc
                    });
                }
            });
        }
        else {
            res.send({"result": false,
                     "joinCode": "0000"});
        }
    });
});

router.get('/uberauth', function(req, res, next) {
    console.log(req.query.authorization_code);
    uber.authorization({authorization_code: req.query.authorization_code}, function(err, access_token, refresh_token) {
        if(err) {
            res.status(err.statusCode).send(err);
        }
        else {
            console.log(access_token);
            console.log(refresh_token);
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
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    res.send({"message": "success"});
                }
            });
        }
    });
});

router.post('/uber', function(req, res, next) {
    console.log(req.query);
});

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}
var rString = randomString(32, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');

function randomCode() {
    return randomString(4, rString);
}

module.exports = router;
