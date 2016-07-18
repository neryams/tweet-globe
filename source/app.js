(function() {
	'use strict';

	angular.module( 'app', [
		'ui.router',
		'btford.socket-io',
		'app.core'
	])

	.config(['$stateProvider', '$urlRouterProvider', function AppConfig( $stateProvider, $urlRouterProvider ) {
		$urlRouterProvider.otherwise( '/' );
	}])

	.controller( 'AppCtrl', ['$scope', function AppCtrl( $scope ) {
		$scope.allContacts = [];
		$scope.allContactsMap = {};

		/*OAuth.initialize('2ljfydBW2TGvLYCKRoYyAyj2JhE');
		OAuth.popup('twitter').done(function(result) {
			$scope.twitter = result;
			$scope.$broadcast('authenticated');
			// do some stuff with result
		});*/

		$scope.$on('$stateChangeSuccess', function(event, toState/*, toParams, fromState, fromParams*/){
			if ( angular.isDefined( toState.data.pageTitle ) ) {
				$scope.pageTitle = toState.data.pageTitle;
			}
		});
	}]);

})();