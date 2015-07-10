'use strict';

angular.module( 'app.core' )

.factory('twitterSocket', function ($http, $location, socketFactory) {
	var socket = socketFactory({
		ioSocket: io.connect('http://' + $location.host() + ':' + $location.port())
	});

	return {
		getStream: function() {
			return socket;
		},
		beginStream: function(filter) {
			if(filter) {
				filter = encodeURIComponent(filter);
    			socket.emit('track', filter);

				return $http.get('/oauth/' + filter)
					.then(function(data) {
						var tweets = data.data.statuses;
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
					}, function(err) {
						console.error('Error getting previous tweets');
					});
			}
			else {
    			socket.emit('track', 'all');

				return $http.get('/oauth/all')
					.then(function(data) {
						return [];
					});
			}
		}
	};
});