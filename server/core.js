'use strict';

var config = require('./config'),
		Twitter = require('node-tweet-stream'),
		moment = require('moment'),
		elasticDbConnection = require('./models/elasticDb.model');

exports.init = function(server) {
	var io = require('socket.io')(server),
			elasticTweets = new elasticDbConnection();

	io.on('connection', function(socket) {
		console.log('Got connect!');
		var tracking;

		var t = new Twitter(config.OAuth2);

		socket.on('track', function(track) {
			untrack();

			elasticTweets.createMap(track).then(function() {
				if(track !== 'all') {
					t.track(track, true);
				}
				else {
					t.location('-180,-90,180,90', true);
				}
				console.log('tracking ' + track);
			});

			t.on('tweet', function (tweet) {
				var coordinates;
				if(tweet.coordinates) {
					if(tweet.coordinates.type === 'Point') {
						coordinates = tweet.coordinates.coordinates;
					}
				}
				else if(tweet.place) {
					var box = tweet.place.bounding_box.coordinates[0];
					if(box[0][0] - box[2][0] < 1.5) {
						coordinates = [ ( box[0][0] + box[2][0] ) / 2, ( box[0][1] + box[1][1] ) / 2];
					}
				}

				if(coordinates) {
					console.log(coordinates);
					elasticTweets.addTweet(tweet.id + '', track, {
		      	user_id:  tweet.user.id + '',
		        created:  moment(tweet.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').format(),
		        location: coordinates,
		        message:  tweet.text
				  });
					socket.emit('tweet-' + tracking, { tracking: tracking, id: tweet.id, coordinates: coordinates });
				}
			});

			tracking = track;
		});

		socket.on('disconnect', function() {
			untrack();

			if(t && t.stream) {
				t.abort();
			}
			console.log('Got disconnect!');
		});

		function untrack() {
			if(tracking === 'all') {
				console.log('untrack all');
				t.unlocate('-180,-90,180,90', true);
			}
			else if(tracking) {
				console.log('untrack ' + tracking);
				t.untrack(tracking, true);
			}
		}
	});
};