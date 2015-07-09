'use strict';

angular.module( 'app.core' )

.controller( 'HomeCtrl', function HomeController( $scope, twitterSocket ) {
	/*$scope.$on('authenticated', function() {
        $scope.twitter.get('/1.1/search/tweets.json?q=fifa&count=100&geocode=0,0,3000mi').done(function(data) {
            $scope.data = data;
        });
	});*/
	$scope.coordinates = [];
	$scope.active = false;

	$scope.beginStream = function(filter) {
		$scope.coordinates = [];
		var stream = twitterSocket.getStream();

		twitterSocket.startStream(filter).success(function(data) {
			var tweets = data.statuses;
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

			$scope.coordinates = coords;
		});

		stream.on('tweet', function(data) {
			$scope.coordinates.push(data);
		});
		$scope.active = true;
	};
})

;