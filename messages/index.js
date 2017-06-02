// /*-----------------------------------------------------------------------------
// This template demonstrates how to use an IntentDialog with a LuisRecognizer to add
// natural language support to a bot.
// For a complete walkthrough of creating this type of bot see the article at
// http://docs.botframework.com/builder/node/guides/understanding-natural-language/
// -----------------------------------------------------------------------------*/
// "use strict";
// var builder = require("botbuilder");
// var botbuilder_azure = require("botbuilder-azure");
// var path = require('path');

// var useEmulator = (process.env.NODE_ENV == 'development');

// var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
//     appId: process.env['MicrosoftAppId'],
//     appPassword: process.env['MicrosoftAppPassword'],
//     stateEndpoint: process.env['BotStateEndpoint'],
//     openIdMetadata: process.env['BotOpenIdMetadata']
// });

// var bot = new builder.UniversalBot(connector);
// bot.localePath(path.join(__dirname, './locale'));

// // Make sure you add code to validate these fields
// var luisAppId = process.env.LuisAppId;
// var luisAPIKey = process.env.LuisAPIKey;
// var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

// const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// // Main dialog with LUIS
// var recognizer = new builder.LuisRecognizer(LuisModelUrl);
// var intents = new builder.IntentDialog({ recognizers: [recognizer] })
// /*
// .matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
// */
// .matches('greeting', (session, args) => {
//     session.send("hii man!!");
// })
// .matches('weather', (session, args) => {
//     session.send("you asked for weather.." + JSON.stringify(args));
// })
// .onDefault((session) => {
//     session.send('Sorry, I did not understand \'%s\'.', session.message.text);
// });

// bot.dialog('/', intents);

// if (useEmulator) {
//     var restify = require('restify');
//     var server = restify.createServer();
//     server.listen(3978, function() {
//         console.log('test bot endpont at http://localhost:3978/api/messages');
//     });
//     server.post('/api/messages', connector.listen());
// } else {
//     module.exports = { default: connector.listen() }
// }

var builder = require('botbuilder');
var restify = require('restify');
var weatherClient = require('./wunderground-client');
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});
var bot = new builder.BotConnectorBot(connector);
bot.localePath(path.join(__dirname, './locale'));

var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var dialog = new builder.LuisDialog(LuisModelUrl);

bot.add('/', dialog);
// test
dialog.on('builtin.intent.weather.check_weather', [
    (session, args, next) => {
        var locationEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.weather.absolute_location');
        if (locationEntity) {
            return next({ response: locationEntity.entity });
        } else {
            builder.Prompts.text(session, 'What location?');
        }
    },
    (session, results) => {
        weatherClient.getCurrentWeather(results.response, (responseString) => {
            session.send(responseString);
        });
    }
]);

dialog.onDefault(builder.DialogAction.send("I don't understand."));

if (useEmulator) {
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}
