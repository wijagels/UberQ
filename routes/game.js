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
    dynamodb.getItem(params, function(err, data) {
        if(err) console.log(err);
        else {
            var params2 = {
                Key: {
                    uid: {
                        S: 'DO05q5YcqKBZBX4h+1OflcSoSekbX0xvgtOce0raOKbkkY8kYm01I7izwbQuqZEpXA5l7qrU3IMwtFmLSyCNxA=='
                    }
                },
                TableName: 'Questions'
            }
            dynamodb.getItem(params2, function(err, data2) {
                if(err) {
                    console.log(err);
                    return;
                }
                var question = data2.Item;
                var pls = data.Item.players.L;
                console.log(question);
                for(var i in pls) {
                    console.log(pls[i].M.gcm_id.S);
                    var message = {
                        'registration_id': pls[i].M.gcm_id.S,
                        'data.type': 'gcm_new_question',
                        'data.question': question.question,
                        'data.choice1': question.choices.L[1],
                        'data.choice2': question.choices.L[2],
                        'data.choice3': question.choices.L[3],
                        'data.choice4': question.choices.L[4],
                    }
                    gcm.send(message, function(err, messageId){
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Sent with message ID: ", messageId);
                        }
                    });
                }
                res.send(data);
            });
        }
    });
});

router.get('/answer', function(req, res, next) {
    var jc = req.query.joinCode;
    var gcm_id = req.query.gcm_id;
    if(answered.indexOf(gcm_id) == -1) {
        answered.push(gcm_id);
    }
    var params2 = {
        Key: {
            uid: {
                S: 'DO05q5YcqKBZBX4h+1OflcSoSekbX0xvgtOce0raOKbkkY8kYm01I7izwbQuqZEpXA5l7qrU3IMwtFmLSyCNxA=='
            }
        },
        TableName: 'Questions'
    };
    dynamodb.getItem(params2, function(err, data2) {
        if(err) {
            console.log(err);
            return;
        }
        else {
        var question = questions[Math.floor(Math.random()*questions.length)];
            console.log(question.choices[1]);
            var message = {
                'registration_id': gcm_id,
                'data.type': 'gcm_new_question',
                'data.question': question.question,
                'data.choice1': question.choices[0],
                'data.choice2': question.choices[1],
                'data.choice3': question.choices[2],
                'data.choice4': question.choices[3],
            };
            gcm.send(message, function(err, messageId){
                if (err) {
                    console.log(err);
                } else {
                    console.log("Sent with message ID: ", messageId);
                }
            });
        }
    });
});

var answered = [];
var correct = "";


var questions = [{"question":"In the 2009 romantic comedy movie \"The Proposal,\" which country\r\n     is Margaret Tate trying to avoid being deported to?","choices":["Mexico","Ireland","Germany","Canada"],"correct":"Canada"},{"question":"Which 2003 comedy film stars Queen Latifah and Steve Martin?","choices":["Maid in Manhattan","Cheaper by the Dozen","Bringing Down the House","Twins"],"correct":"Bringing Down the House"},{"question":"What is the occupation of C. D. Wales in the 1987 movie \"Roxanne\"?","choices":["Politician","Fireman","Gangster","Lawyer"],"correct":"Fireman"},{"question":"Which country music singer stars in the movie \"9 to 5\"?","choices":["Reba McEntire","Dolly Parton","Patty Loveless","Wynonna Judd"],"correct":"Dolly Parton"},{"question":"What character does Goldie Hawn play in the movie \"Private Benjamin\"?","choices":["Sandy","Judy","Mary Lou","Doreen"],"correct":"Judy"},{"question":"In what year was the award winning movie \"Life of Pi\" released?","choices":["2002","2008","1998","2012"],"correct":"2012"},{"question":"What is the name of the planet in the movie \"Avatar\"?","choices":["Pluto","Arrakis","Pandora","Panem"],"correct":"Pandora"},{"question":"In the 1984 movie Terminator, the cyborg is sent back from what year?","choices":["2066","2083","2048","2029"],"correct":"2029"},{"question":"Which movie is about a ship called the Andrea Gail?","choices":["Crimson Tide","Waterworld","The Perfect Storm","White Squall"],"correct":"The Perfect Storm"},{"question":"Select the Tom Cruise movie that was released BEFORE the others.","choices":["The Colour of Money","Born on the Fourth of July","Rain Man","Cocktail"],"correct":"The Colour of Money"},{"question":"Cathy Tyson plays Simone and Bob Hoskins plays George. Name the film.","choices":["The Wicked West","Performance","Mona Lisa","Blow Up"],"correct":"Mona Lisa"},{"question":"What kind of shop is owned by Hugh Grant's character in Notting Hill?","choices":["Chemist","Clothes Shop","Butchers","Bookshop"],"correct":"Bookshop"},{"question":"Who plays the role of Sir Lancelot in the 1975 British comedy film, \"Monty Python and The Holy Grail\"?","choices":["Eric Idle","Terry Gilliam","Terry Jones","John Cleese"],"correct":"John Cleese"},{"question":"Name the 2015 movie that depicts a futuristic mechanized police force that patrols the streets and deals with lawbreakers.","choices":["No Escape","Chappie","Sicario","Run All Night"],"correct":"Chappie"},{"question":"Which of the following movies from 2014 was based on a 2009 James Dashner novel?","choices":["The Maze Runner","The Theory of Everything","The Equalizer","Divergent"],"correct":"The Maze Runner"}];



module.exports = router;
