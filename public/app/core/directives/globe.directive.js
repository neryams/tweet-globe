'use strict';

angular.module( 'app.core' )

.directive('globe', function() {
	return {
		restrict: 'E',
		scope: {
			data: '='
		},
		templateUrl: '/app/core/directives/templates/globe.html',
		link: function(scope, element) {
			var pointsAdded = false;
			var container = element.find('div')[0];

			// Make the globe
			var globe = new DAT.Globe( container, {
				imgDir: '/custom/globe/'
			});

			scope.$watch('data', function(data) {
				var key,
					max = 1,
					map = {};

				for(var i = 0; i < data.length; i++) {
					key = Math.floor(data[i][0]) + ',' + Math.floor(data[i][1]);
					if(!map[key]) {
						map[key] = 0;
					}
					map[key] += 0.1;

					if(max < map[key]) {
						max = map[key];
					}
				}
				var points = [],
					coords;

				for(key in map) {
					coords = key.split(',');
					points.push(coords[1], coords[0], map[key] / max);
				}

				if(pointsAdded) {
					globe.removeAllPoints();
				}

			    globe.addData( points, 
			    	{format: 'magnitude', name: 'sample', animated: false} );

				globe.createPoints();
				
				if(!pointsAdded) {
					globe.animate();
				}

				pointsAdded = true;
			}, true);
		}
	};
});