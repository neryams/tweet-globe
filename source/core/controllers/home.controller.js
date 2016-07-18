(function() {
	'use strict';

	angular.module( 'app.core' )
	.controller('HomeCtrl', ['$scope', 'twitterSocket', function HomeController( $scope, twitterSocket ) {
		/*$scope.$on('authenticated', function() {
	        $scope.twitter.get('/1.1/search/tweets.json?q=fifa&count=100&geocode=0,0,3000mi').done(function(data) {
	            $scope.data = data;
	        });
		});*/
		$scope.coordinates = [];
		$scope.active = '';

		var duplicatesCheck;
		var addTweet = function(data) {
			if(duplicatesCheck[data.id] === undefined && data.tracking === $scope.active) {
				$scope.coordinates.push(data.coordinates);
				duplicatesCheck[data.id] = true;
			}
		};

		$scope.beginStream = function(filter) {
			duplicatesCheck = {};
			var stream = twitterSocket.getStream();

			twitterSocket.beginStream(filter).then(function(data) {
				if(data.length > 0) {
					Array.prototype.push.apply($scope.coordinates, data);
				}
			});

			if($scope.active) {
				stream.removeListener('tweet-' + $scope.active);
			}

			if(filter) {
				stream.on('tweet-'+filter, addTweet);
				$scope.active = filter;
			}
			else {
				stream.on('tweet-all', addTweet);
				$scope.active = 'all';
			}
		};
	}]);
})();