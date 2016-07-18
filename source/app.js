(function() {
	'use strict';

	angular.module( 'app', [
		'ui.router',
		'btford.socket-io',
		'app.core',
		'app.twitter',
		'app.globe'
	])

	.config(['$stateProvider', '$urlRouterProvider', function AppConfig( $stateProvider, $urlRouterProvider ) {
		$urlRouterProvider.otherwise( '/' );
	}])

	.controller( 'AppCtrl', ['$scope', function AppCtrl( $scope ) {
		$scope.allContacts = [];
		$scope.allContactsMap = {};

		$scope.$on('$stateChangeSuccess', function(event, toState/*, toParams, fromState, fromParams*/){
			if ( angular.isDefined( toState.data.pageTitle ) ) {
				$scope.pageTitle = toState.data.pageTitle;
			}
		});
	}]);

})();