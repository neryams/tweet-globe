'use strict';
var app = require('express')(),
	https = require('https'),
	Twitter = require('node-tweet-stream'),
	OAuth2 = require('oauth').OAuth2;

var server = app.listen(5000, function() {
    console.log('Listening on port %d', server.address().port);
});

var io = require('socket.io')(server);

var rootDir = '/public';
var auth = {
	consumer_key: '8zOskEZPbBrVbEgZeJ9QCDwsf',
	consumer_secret: '83uiOlJlTEOvj4dQCnSxCv0C2byWwfarSyrIhxlEfhfbUvcwsC',
	token: '33668086-u1IwTOHVz8Oi9k8kYfo5VYzda7ZDVUkjvcQfPKwce',
	token_secret: 'i4oyaI2EpjriWaMWJh6OpceoMe6pTXE9XhO5rQCrZal6y'
};

var twitterAuth = new OAuth2(auth.consumer_key, auth.consumer_secret, 
	'https://api.twitter.com/', null, 'oauth2/token', null);

io.on('connection', function(socket) {
	console.log('Got connect!');
	var tracking;

	var t = new Twitter(auth);

	socket.on('track', function(track) {
		if(tracking === 'all') {
			console.log('untrack all');
			t.unlocate('-180,-90,180,90', false)
		}
		else if(tracking) {
			console.log('untrack ' + tracking);
			t.untrack(tracking, false);
		}
		tracking = track;

		if(track !== 'all') {
			t.track(track, true);
		}
		else {
			t.location('-180,-90,180,90', true);
		}
		console.log('tracking ' + track);

		t.on('tweet', function (tweet) {
			if(tweet.coordinates) {
				console.log(tweet.coordinates.coordinates);
				socket.emit('tweet', tweet.coordinates.coordinates);
			}
			else if(tweet.place) {
				var box = tweet.place.bounding_box.coordinates[0];
				if(box[0][0] - box[2][0] < 1.5) {
					console.log([ ( box[0][0] + box[2][0] ) / 2, ( box[0][1] + box[1][1] ) / 2]);
					socket.emit('tweet', [ ( box[0][0] + box[2][0] ) / 2, ( box[0][1] + box[1][1] ) / 2]);
				}
			}
		});
	});

	socket.on('disconnect', function() {
		if(tracking === 'all') {
			console.log('untrack all');
			t.unlocate('-180,-90,180,90', true)
		}
		else if(tracking) {
			console.log('untrack ' + tracking);
			t.untrack(tracking, true);
		}
		if(t && t.stream) {
			t.abort();
		}
		console.log('Got disconnect!');
	});
});

app.get('/oauth/:track', function(req, res) {
	twitterAuth.getOAuthAccessToken('', {
		'grant_type': 'client_credentials'
	}, function (e, access_token) {
		//console.log(access_token); //string that we can use to authenticate request

		var options = {
		    hostname: 'api.twitter.com',
		    path: '/1.1/search/tweets.json?count=100&q=' + encodeURIComponent(req.params.track),
			method: 'GET',
		    headers: {
		        Authorization: 'Bearer ' + access_token
		    }
		};

		https.get(options, function(result){
			var buffer = '';
			result.setEncoding('utf8');
			result.on('data', function(data){
				buffer += data;
			});
			result.on('end', function(){
				var tweets = JSON.parse(buffer);
				res.send(tweets); // the tweets!
			});
		});
	});
});

app.get('/', function(req, res) { 
	res.sendfile(__dirname + rootDir + '/index.html'); 
});

app.get(/^\/(.+)$/, function(req, res) { 
	res.sendfile(__dirname + rootDir + '/' + req.params[0]); 
});