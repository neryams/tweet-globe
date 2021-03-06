'use strict';

var config = require('./config'),
		Twitter = require('node-tweet-stream'),
		moment = require('moment'),
		elasticDbConnection = require('./models/elasticDb.model');

elasticDbConnection.connect();

exports.init = function(server) {
	var io = require('socket.io')(server),
			elasticTweets;

	io.on('connection', function(socket) {
		console.log('Connecting');
		var tracking;

		var t = new Twitter(config.OAuth2);

		socket.on('track', function(track) {
			untrack();

			elasticDbConnection.newMapping(track).then(function(elasticTweetHandler) {
				elasticTweets = elasticTweetHandler;
				if(track !== 'all') {
					t.track(track, true);
				}
				else {
					t.location('-180,-90,180,90', true);
				}
				console.log('Tracking ' + track);
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
					elasticTweets.addTweet(tweet.id + '', {
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

		socket.on('stoptracking', function() {
			untrack();

			if(t && t.stream) {
				t.abort();
			}
		});

		socket.on('disconnect', function() {
			untrack();

			if(t && t.stream) {
				t.abort();
			}
			console.log('Disconnecting');
		});

		function untrack() {
			if(tracking === 'all') {
				console.log('Untracking all');
				t.unlocate('-180,-90,180,90', true);
			}
			else if(tracking) {
				console.log('Untracking ' + tracking);
				t.untrack(tracking, true);
			}
		}
	});
};