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
		startStream: function(filter) {
			if(filter) {
				filter = encodeURIComponent(filter);
    			socket.emit('track', filter);

				return $http.get('/oauth/' + filter)
					.error(function() {
						console.error('Error starting stream');
					});
			}
			else {
    			socket.emit('track', 'all');

				return $http.get('/oauth/all')
					.error(function() {
						console.error('Error starting stream');
					});
			}
		}
	};
});