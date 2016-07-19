(function() {
	'use strict';

	angular.module( 'app.core', [] )
	.config(['$stateProvider', function config( $stateProvider ) {
		$stateProvider.state( 'home', {
			url: '/',
			views: {
				'': {
					controller: 'HomeCtrl',
					templateUrl: 'core/views/home.view.html'
				},
				'header': {
					templateUrl: 'core/views/header.view.html'
				}
			},
			data:{ pageTitle: 'Home' }
		});
	}]);
})();