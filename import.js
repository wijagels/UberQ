var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var dynamodb = new AWS.DynamoDB();
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('import.json', 'utf8'));
var crypto = require('crypto');

var toadd = [];

obj.forEach(function(data) {
    for(var obj in data.questions) {
        var uid = hash(data.questions[obj].question);
        //toadd.push({'uid': uid, 'question': data.questions[obj]});
        toadd.push({'uid': uid, 'question': data.questions[obj]});
    }
});

for(var i in toadd) {
    console.log(toadd[i]);
    var params = {
        Item: {
            "uid": {
                "S": toadd[i].uid
            },
            "question": {
                "S": toadd[i].question.question
            },
            "choices": {
                "L": [
                    {
                        "S": toadd[i].question.choices[0]
                    },
                    {
                        "S": toadd[i].question.choices[1]
                    },
                    {
                        "S": toadd[i].question.choices[2]
                    },
                    {
                        "S": toadd[i].question.choices[3]
                    }
                ]
            },
            "correct": {
                "S": toadd[i].question.correct
            }
        },
        TableName: 'Questions'
    }
    dynamodb.putItem(params, function(err, data) {
        if(err) {
            console.log(err);
        }
        else {
            console.log(data);
        }
    });
}


function hash(pwd) {
    return crypto.createHash('sha512').update(pwd).digest('base64');
}
