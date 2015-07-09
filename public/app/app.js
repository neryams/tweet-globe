'use strict';

angular.module( 'app', [
	'app.core',
	'ui.router',
	'btford.socket-io',/*,
	'LocalForageModule'*/
	])

.config( function AppConfig ( $stateProvider, $urlRouterProvider ) {
	$urlRouterProvider.otherwise( '/' );
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
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
})

;