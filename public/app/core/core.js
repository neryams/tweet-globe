'use strict';

angular.module( 'app.core', [
	'ui.router'
])

.config(function config( $stateProvider ) {
	$stateProvider.state( 'home', {
		url: '/',
		views: {
			'': {
				controller: 'HomeCtrl',
				templateUrl: 'app/core/views/home.view.html'
			},		
			'header': {
				templateUrl: 'app/core/views/header.view.html'
			}
		},
		data:{ pageTitle: 'Home' }
	});
})

;