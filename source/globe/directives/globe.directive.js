/* jshint debug: true */
(function() {
	'use strict';

	angular.module( 'app.globe' )
	.directive('globe', ['webGLGlobe', function GlobeDirective(webGLGlobe) {

		var settime = function(globe, t, length) {
			return function() {
				var tween = new TWEEN.Tween(globe);
				tween.to({ time: t/length }, 100).easing(TWEEN.Easing.Cubic.Out);
				tween.start();
			};
		};

		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			templateUrl: 'globe/directives/templates/globe.html',
			link: function(scope, element) {
				var initialized = false,
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
							key, coords,
							oldMax = max,
							changedPoints = {};

					if(dataLengthPrev > dataLength) {
						dataLengthPrev = 0;
						map = {};
					}

					for(var i = dataLengthPrev; i < dataLength; i++) {
						key = Math.floor(data[i][0]) + ',' + Math.floor(data[i][1]);
						if(!map[key]) {
							map[key] = 0;
						}
						map[key]++;
						changedPoints[key] = map[key];

						while(max < map[key]) {
							max += Math.ceil(max / 10);
						}
					}


					if(!initialized || dataLengthPrev === 0) {
						var newPoints = [];
						for(key in map) {
							coords = key.split(',');
							newPoints.push(coords[1], coords[0], map[key] / max);
						}
						if(initialized) {
							globe.removeAllPoints();
						}

						globe.addData( newPoints, {format: 'magnitude', name: 'tweets' + dataLength, animated: false} );
						globe.createPoints();

						if(!initialized) {
							globe.animate();
							initialized = true;
						}
					}
					else if(oldMax !== max) {
						for(key in map) {
							coords = key.split(',');
							globe.updateDataPointMagnitude(coords[1], coords[0], map[key] / max);
						}
					}
					else if(changedPoints) {
						for(key in changedPoints) {
							coords = key.split(',');
							globe.updateDataPointMagnitude(coords[1], coords[0], changedPoints[key] / max);
						}
					}
				}, true);
			}
		};
	}]);
})();