var express = require('express');
var axios = require("axios");
var bodyParser = require('body-parser');
var uuidv4 = require('uuid/v4');
var fs = require('fs');
var os = require('os');
var winston = require('winston');
var dateFormat = require('dateformat');

var app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

var logMessages = { }

var port = 5006;

var url = "https://api.cai.tools.sap/build/v1/dialog";

var botId = "Token 48d19a71de8f9a3f1081531b77a9aa18"

var header = { 
    "Content-Type" : "application/json",
    "Authorization" : "Token " + botId
}
app.post("/message", (req, res) => {
    var message = req.body.message;
    
    var sapRequest = 
    { 
        "conversation_id" : uuidv4(),
        "message" : { "type" : "text", "content": message }
    }

    axios.post(url, sapRequest, {
        headers: {
            Authorization: botId // this token will determine what bot will handle the input
        }
    })
    .then(function (response) {
        processResponse(response);
        res.send(response.data);
    })
    .catch(function (error) {
        console.log(error)
    })

    // res.send("message received");
});

function processResponse(res) {
    var intents =res.data.results.nlp.intents ;
    for(i=0; i<intents.length; i++)
    {
        console.log("Intent: " + intents[i].slug);
    }
}

function processMessage(message, resFile) {
    
    var sapRequest = 
    { 
        "conversation_id" : uuidv4(),
        "message" : { "type" : "text", "content": message }
    }

    axios.post(url, sapRequest, {
        headers: {
            Authorization: botId // this token will determine what bot will handle the input
        }
    })
    .then(function (response) {
        var toLog = { 
                "message": sapRequest.message.content,
                "response": response.data.results
        }
        logMessages[sapRequest.conversation_id] = toLog;
        
        // log(JSON.stringify(toLog, null, 2) , resFile);
       
        //res.send(response.data);
    })
    .catch(function (error) {
        console.log(error)
    })
   
}

function log(message, filename)
{
    fs.writeFileSync(filename, message + os.EOL, { flag : "a"});
}

app.post("/messageFile", (req, res) => {
    var filePath = req.body.filepath;
    var outFile = req.body.testrun + dateFormat(Date.now(), "yyyymmddhhMMss");

    fs.readFile(filePath, "latin1",  function(err, data) {
        var messages = data.split(os.EOL);
        for(i=0; i<messages.length;i++)
        {
            processMessage(messages[i], outFile);
        }
        console.log(data);
        
        setTimeout(function() {
            log(JSON.stringify(logMessages, null, 2), outFile);
            logMessages = {}; 
            } 
            , 3000);
        res.send("done");
    })
    
})

app.listen(port, () => console.log("messagetest listening on port " + port.toString()));