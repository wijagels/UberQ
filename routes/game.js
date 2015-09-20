var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var Uber = require('node-uber');
var GCM = require('gcm').GCM;
var unmarshalJson = require('dynamodb-marshaler/unmarshalJson').unmarshalItem;

AWS.config.update({region: 'us-east-1'});
var dynamodb = new AWS.DynamoDB();

var gcm = new GCM(process.env.GCM_KEY);

router.get('/join', function(req, res, next) {
    var jc = req.query.joinCode;
    var venmo = req.query.venmoUser;
    var gcm_id = req.query.gcm_id;

    var params = {
        Key: { /* required */
            JoinCode: { /* AttributeValue */
                S: jc
            }
        },
        TableName: 'CurrentGames'
    };

    dynamodb.getItem(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        if(Object.keys(data).length != 0) {
            var params2 = {
                Key: {
                    JoinCode: {
                        S: jc
                    }
                },
                TableName: 'CurrentGames',
                UpdateExpression: "SET players[10] = :val1",
                "ExpressionAttributeValues": {
                    ":val1": {"S": req.query.gcm_id},
                },
                "ReturnValues": "ALL_NEW"
            }
            dynamodb.updateItem(params2, function(err, data2) {
                if(err) {
                    console.log(err);
                    res.send({
                        'result': false
                    });
                }
                else {
                    console.log(data2.Attributes.players.L);
                    var message = {
                        'registration_id': gcm_id,
                        'collapse_key': 'Dank may mays',
                        'data.type': 'gcm_join_game',
                        'data.message': 'dank may mays'
                    }
                    gcm.send(message, function(err, messageId){
                        if (err) {
                            console.log("Something has gone wrong!");
                        } else {
                            console.log("Sent with message ID: ", messageId);
                        }
                    });
                    res.send({
                        'result': true
                    });
                }
            });
        }
        else {
            res.send({
                'result': false
            });
        }
    });
});

router.get('/start', function(req, res, next) {
    var jc = req.query.joinCode;
    var gcm_id = req.query.gcm_id;
    var params = {
        Key: {
            JoinCode: {
                S: jc
            }
        },
        TableName: 'CurrentGames'
    }
    console.log('hi');
    dynamodb.getItem(params, function(err, data) {
        if(err) console.log(err);
        else {
            res.send(data);
        }
    });
});

router.get('/answer', function(req, res, next) {
    var jc = req.query.joinCode;
    var gcm_id = req.query.gcm_id;
    var params = {
        Key: {
            JoinCode: {
                S: jc
            }
        },
        TableName: 'CurrentGames'
    }
    dynamodb.getItem(params, function(err,data) {
        if(err) {
            console.log(err);
        }
        else {
            
        }
    });
});

var answered = {}



module.exports = router;
