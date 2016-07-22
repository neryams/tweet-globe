(function() {
	'use strict';

	angular.module( 'app.twitter' )
	.factory('twitterSocket', ['$http', '$location', '$window', 'socketFactory', function TwitterSocketService($http, $location, $window, socketFactory) {
		var service = {
			getStream: getStream,
			beginStream: beginStream,
			stopStream: stopStream,
			getPreviousTweets: getPreviousTweets
		};

		var socket = socketFactory({
			ioSocket: $window.io.connect('http://' + $location.host() + ':' + $location.port())
		});

		function getStream() {
				return socket;
		}
		
		function beginStream(filter) {
			if(filter) {
				filter = encodeURIComponent(filter);
			}
			else {
				filter = 'all';
			}
			socket.emit('track', filter);

			return $http.get('/oauth/' + filter)
				.then(function(result) {
					return getTweetCoordinates(result.data.statuses);
				}, function(err) {
					console.error('Error getting tweets');
				});
		}

		function stopStream() {
			socket.emit('stoptracking', 'all');
		}

		function getTweetCoordinates(tweets) {
			var coords = [];

			for(var i = 0; i < tweets.length; i++) {
				var tweet = tweets[i];

				if(tweet.location) {
					coords.push(tweet.location);
				}
				if(tweet.coordinates) {
					coords.push(tweet.coordinates.coordinates);
				}
				else if(tweet.place) {
					var box = tweet.place.bounding_box.coordinates[0];
					if(box[0][0] - box[2][0] < 1.5) {
						coords.push([ ( box[0][0] + box[2][0] ) / 2, ( box[0][1] + box[1][1] ) / 2]);
					}
				}
			}

			return coords;
		}

		function getPreviousTweets(type, filter) {
			var url;
			if(filter) {
				url = '/query/' + type + '/' + filter;
			}
			else {
				url = '/query/' + type;
			}

			return $http.get(url)
				.then(function(result) {
					return getTweetCoordinates(_.map(result.data.hits, '_source'));
				}, function(err) {
					console.error('Error getting previous tweets');
				});
		}

		return service;
	}]);
})();