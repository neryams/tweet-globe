'use strict';

angular.module( 'app.core' )

.controller( 'HomeCtrl', function HomeController( $scope, twitterSocket ) {
	/*$scope.$on('authenticated', function() {
        $scope.twitter.get('/1.1/search/tweets.json?q=fifa&count=100&geocode=0,0,3000mi').done(function(data) {
            $scope.data = data;
        });
	});*/
	$scope.coordinates = [];
	$scope.active = '';

	$scope.beginStream = function(filter) {
		$scope.coordinates = [];
		var stream = twitterSocket.getStream();

		twitterSocket.beginStream(filter).then(function(data) {
			$scope.coordinates = data;
		});

		if($scope.active) {
			stream.removeListener('tweet-' + $scope.active);
		}

		if(filter) {
			stream.on('tweet-'+filter, function(data) {
				$scope.coordinates.push(data);
			});
		}
		else {
			stream.on('tweet-all', function(data) {
				$scope.coordinates.push(data);
			});
		}
		$scope.active = filter;
	};
})

;