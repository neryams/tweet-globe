(function() {
	'use strict';

	angular.module( 'app.twitter' )
	.factory('twitterSocket', ['$http', '$location', '$window', 'socketFactory', function TwitterSocketService($http, $location, $window, socketFactory) {
		var service = {
			getStream: getStream,
			beginStream: beginStream,
			stopStream: stopStream
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
					socket.emit('track', filter);

				return $http.get('/oauth/' + filter)
					.then(function(data) {
						return getTweetCoordinates(data.data.statuses);
					}, function(err) {
						console.error('Error getting previous tweets');
					});
			}
			else {
				socket.emit('track', 'all');

				return $http.get('/oauth/all')
					.then(function(data) {
						return getTweetCoordinates(data.data.statuses);
					});
			}
		}

		function stopStream() {
			socket.emit('stoptracking', 'all');
		}

		function getTweetCoordinates(tweets) {
			var coords = [];

			for(var i = 0; i < tweets.length; i++) {
				var tweet = tweets[i];

				if(tweet.coordinates) {
					coords.push('tweet', tweet.coordinates.coordinates);
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

		return service;
	}]);
})();