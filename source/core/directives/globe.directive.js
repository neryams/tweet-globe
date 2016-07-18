(function() {
	'use strict';

	angular.module( 'app.core' )
	.directive('globe', ['webGLGlobe', function GlobeDirective(webGLGlobe) {
		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			templateUrl: 'core/directives/templates/globe.html',
			link: function(scope, element) {
				var points,
						max = 10,
						map = {};

				var container = element.children()[0];

				// Make the globe
				var globe = new webGLGlobe.Globe( container );

				var canvas = element.find('canvas')[0],
						ctx = canvas.getContext('webgl');
				ctx.webkitImageSmoothingEnabled = false;
				ctx.mozImageSmoothingEnabled = false;
				ctx.imageSmoothingEnabled = false; /// future

				scope.$watch('data.length', function(dataLength, dataLengthPrev) {
					var data = scope.data,
							key;

					for(var i = dataLengthPrev; i < dataLength; i++) {
						key = Math.floor(data[i][0]) + ',' + Math.floor(data[i][1]);
						if(!map[key]) {
							map[key] = 0;
						}
						map[key]++;

						if(max < map[key]) {
							max = map[key];
						}
					}
					var newPoints = [], coords;

					for(key in map) {
						coords = key.split(',');
						newPoints.push(coords[1], coords[0], map[key] / max);
					}

					if(!points || newPoints.length > points.length) {
						if(points) {
							globe.removeAllPoints();
						}

					  globe.addData( newPoints, {format: 'magnitude', name: 'sample', animated: false} );
						globe.createPoints();

						if(!points) {
							globe.animate();
						}

						points = newPoints;
					}
				}, true);
			}
		};
	}]);
})();