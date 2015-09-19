var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var Uber = require('node-uber');

AWS.config.update({region: 'us-east-1'});
var dynamodb = new AWS.DynamoDB();


router.get('/join', function(req, res, next) {
    var jc = req.query.joincode;

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
            dynamodb.updateItem(params2, function(err, data) {
                if(err) {
                    console.log(err);
                    res.status(500).send();
                }
                else {
                    res.send();
                }
            });
        }
        else {
            res.status(404).send();
        }
    });
});


module.exports = router;
