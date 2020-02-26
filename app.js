var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//import template from './email.html';
var fs = require('fs');
var template = fs.readFileSync('./email.html',{encoding:'utf-8'});


const Handlebars = require("handlebars");
const handlebarsTemplate = Handlebars.compile(template);
//const MessagingResponse = require('twilio').twiml.MessagingResponse;

// Load configuration information from system environment variables.
var TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER,
    MY_PHONE_NUMBER = process.env.MY_PHONE_NUMBER;

// Create an authenticated client to access the Twilio REST API
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

//!!!TESTING Sending a text that the server is running
// client.messages.create({
//   to: MY_PHONE_NUMBER,
//   from: TWILIO_PHONE_NUMBER,
//   body: 'The server is up and running!'
// })
// .then((message) => console.log(message.sid));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// render our home page
app.get('/', function(req, res, next) {
  res.render('index');
});

// handle a POST request to send a text message. 
// This is sent via ajax on our home page
app.post('/message', function(req, res, next) {
  // Use the REST client to send a text message
  client.messages.create({
    to: req.body.to,
    from: TWILIO_PHONE_NUMBER,
    body: 'Justan Other Twilio-Bot says "sup"!'
  }).then(function(message) {
    // When we get a response from Twilio, respond to the HTTP POST request
    res.send('Message is inbound!');
  });
});

//handle an incoming text message
app.post('/sms', (req, res) => {
  //const twiml = new MessagingRespone();
  const twiml = new twilio.twiml.MessagingResponse();
  console.log('req.body is : ' + JSON.stringify(req.body))
  twiml.message('Please click the confirm button in the confirmation email sent to ' + JSON.stringify(req.body.Body));
  //console.log('twiml is : ' + twiml.toString())
  //Send email to address
  const msg = {
    to: req.body.Body,
    from: 'test@example.com',
    subject: 'Sending with Twilio SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js' + JSON.stringify(req.body.Body),
    //html: '<strong>and easy to do anywhere, even with Node.js ' + JSON.stringify(req.body.Body) +'</strong>',
    html: handlebarsTemplate({ 
      From: req.body.From,
      ToCountry: req.body.ToCountry, 
      ToStateSmsMessageSid: req.body.ToStateSmsMessageSid,
      SmsMessageSid: req.body.SmsMessageSid,
      ToCity: req.body.ToCity, 
      FromZip: req.body.FromZip,
      SmsSid: req.body.SmsSid,
      FromState: req.body.FromState, 
      ToState: req.body.ToState, 
      SmsStatus: req.body.SmsStatus,  
      FromCity: req.body.FromCity,
      Body: req.body.Body, 
      To: req.body.To,
      MessageSid: req.body.MessageSid,
      ApiVersion: req.body.ApiVersion
    })
  };
  sgMail.send(msg);
  res.set('Content-Type','text/xml');
  res.end(twiml.toString());
})

// handle a POST request to make an outbound call.
// This is sent via ajax on our home page
app.post('/call', function(req, res, next) {
  // Use the REST client to send a text message
  client.calls.create({
    to: req.body.to,
    from: TWILIO_PHONE_NUMBER,
    url: 'http://demo.twilio.com/docs/voice.xml'
  }).then(function(message) {
    // When we get a response from Twilio, respond to the HTTP POST request
    res.send('Call incoming!');
  });
});

// Create a TwiML document to provide instructions for an outbound call
app.post('/hello', function(req, res, next) {
  // Create a TwiML generator
  var twiml = new twilio.twiml.VoiceResponse();
  // var twiml = new twilio.TwimlResponse();
  twiml.say('Hello there! You have successfully configured a web hook.');
  twiml.say('Good luck on your Twilio quest!', { 
      voice:'woman' 
  });

  // Return an XML response to this request
  res.set('Content-Type','text/xml');
  res.send(twiml.toString());
});

//respond to email confirmation button
app.get('/confirm*', function(req, res){
  console.log("request is " + JSON.stringify(req.headers.from))
  res.send('thank you')
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
