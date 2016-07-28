/*jshint -W069 */
/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
(function() {
	'use strict';

	angular.module( 'app.globe' )
	.factory('webGLGlobe', ['$window', function webGLGlobeService($window) {
		var service = {
			Globe: Globe
		};
		var THREE = $window.THREE;

		function Globe(container, opts) {
			var _this = this;
			opts = opts || {};
			
			var colorFn = opts.colorFn || function(x) {
				var c = new THREE.Color();
				c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
				return c;
			};
			var imgDir = 'assets/';

			var Shaders = {
				'earth' : {
					uniforms: {
						'texture': { type: 't', value: null }
					},
					vertexShader: [
						'varying vec3 vNormal;',
						'varying vec2 vUv;',
						'void main() {',
							'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
							'vNormal = normalize( normalMatrix * normal );',
							'vUv = uv;',
						'}'
					].join('\n'),
					fragmentShader: [
						'uniform sampler2D texture;',
						'varying vec3 vNormal;',
						'varying vec2 vUv;',
						'void main() {',
							'vec3 diffuse = texture2D( texture, vUv ).xyz;',
							'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
							'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
							'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
						'}'
					].join('\n')
				},
				'atmosphere' : {
					uniforms: {},
					vertexShader: [
						'varying vec3 vNormal;',
						'void main() {',
							'vNormal = normalize( normalMatrix * normal );',
							'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
						'}'
					].join('\n'),
					fragmentShader: [
						'varying vec3 vNormal;',
						'void main() {',
							'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
							'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
						'}'
					].join('\n')
				}
			};

			var camera, scene, renderer, w, h;
			var mesh, point;
			var dataBars = {};

			var overRenderer;

			var curZoomSpeed = 0;

			var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
			var rotation = { x: 0, y: 0 },
					target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
					targetOnDown = { x: 0, y: 0 };

			var distance = 100000, distanceTarget = 100000;
			var PI_HALF = Math.PI / 2;

			function init() {

				container.style.color = '#fff';
				container.style.font = '13px/20px Arial, sans-serif';

				var shader, uniforms, material;
				w = container.offsetWidth || window.innerWidth;
				h = container.offsetHeight || window.innerHeight;

				camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
				camera.position.z = distance;

				scene = new THREE.Scene();

				var geometry = new THREE.SphereGeometry(200, 40, 30);

				shader = Shaders['earth'];
				uniforms = THREE.UniformsUtils.clone(shader.uniforms);

				var loader = new THREE.TextureLoader();
				uniforms['texture'].value = loader.load(imgDir+'world.jpg');

				material = new THREE.ShaderMaterial({

							uniforms: uniforms,
							vertexShader: shader.vertexShader,
							fragmentShader: shader.fragmentShader

						});

				mesh = new THREE.Mesh(geometry, material);
				mesh.rotation.y = Math.PI;
				scene.add(mesh);

				shader = Shaders['atmosphere'];
				uniforms = THREE.UniformsUtils.clone(shader.uniforms);

				material = new THREE.ShaderMaterial({

							uniforms: uniforms,
							vertexShader: shader.vertexShader,
							fragmentShader: shader.fragmentShader,
							side: THREE.BackSide,
							blending: THREE.AdditiveBlending,
							transparent: true

						});

				mesh = new THREE.Mesh(geometry, material);
				mesh.scale.set( 1.1, 1.1, 1.1 );
				scene.add(mesh);

				geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
				geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));

				point = new THREE.Mesh(geometry);

				renderer = new THREE.WebGLRenderer({antialias: true});
				renderer.setSize(w, h);

				renderer.domElement.style.position = 'absolute';

				container.appendChild(renderer.domElement);

				container.addEventListener('mousedown', onMouseDown, false);

				container.addEventListener('mousewheel', onMouseWheel, false);

				document.addEventListener('keydown', onDocumentKeyDown, false);

				window.addEventListener('resize', onWindowResize, false);

				container.addEventListener('mouseover', function() {
					overRenderer = true;
				}, false);

				container.addEventListener('mouseout', function() {
					overRenderer = false;
				}, false);
			}

			function addData(data, opts) {
				var lat, lng, size, color, i, step, colorFnWrapper;

				opts.animated = opts.animated || false;
				_this.is_animated = opts.animated;
				opts.format = opts.format || 'magnitude'; // other option is 'legend'
				if (opts.format === 'magnitude') {
					step = 3;
					colorFnWrapper = function(data, i) { return colorFn(data[i+2]); };
				} else if (opts.format === 'legend') {
					step = 4;
					colorFnWrapper = function(data, i) { return colorFn(data[i+3]); };
				} else {
					throw('error: format not supported: '+opts.format);
				}

				if (opts.animated) {
					if (_this._baseGeometry === undefined) {
						_this._baseGeometry = new THREE.Geometry();
						for (i = 0; i < data.length; i += step) {
							lat = data[i];
							lng = data[i + 1];
		//				size = data[i + 2];
							color = colorFnWrapper(data,i);
							size = 0;
							createGeometry(lat, lng, size, color, _this._baseGeometry);
						}
					}
					if(_this._morphTargetId === undefined) {
						_this._morphTargetId = 0;
					} else {
						_this._morphTargetId += 1;
					}
					opts.name = opts.name || 'morphTarget'+_this._morphTargetId;
				}
				var subgeo = new THREE.Geometry();
				for (i = 0; i < data.length; i += step) {
					lat = data[i];
					lng = data[i + 1];
					color = colorFnWrapper(data,i);
					size = data[i + 2];
					size = size*200;
					createGeometry(lat, lng, size, color, subgeo);
				}
				if (opts.animated) {
					_this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
				} else {
					_this._baseGeometry = subgeo;
				}

			}

			function updateDataPointMagnitude(lat, lng, size) {
				if (_this._baseGeometry !== undefined) {
					var i, n;
					var color = colorFn(size);
					size = size * 200;

					var updatingBar = dataBars[lat + 'x' + lng];
					if(updatingBar !== undefined) {
						var newPoint = createGeometry(lat, lng, size, color);
						for(i = 0, n = newPoint.vertices.length; i < n; i++) {
							updatingBar.vertices[i].copy(newPoint.vertices[i]);
						}
						for(i = 0, n = newPoint.faces.length; i < n; i++) {
							updatingBar.faces[i].color.copy(newPoint.faces[i].color);
						}
					} else {
						createGeometry(lat, lng, size, color, _this._baseGeometry);
						_this._baseGeometry.elementsNeedUpdate = true;
					}

					_this._baseGeometry.verticesNeedUpdate = true;
				}
			}

			function createPoints() {
				if (_this._baseGeometry !== undefined) {
					if (_this.is_animated === false) {
						_this.points = new THREE.Mesh(_this._baseGeometry, new THREE.MeshBasicMaterial({
									color: 0xffffff,
									vertexColors: THREE.FaceColors,
									morphTargets: false
								}));
					} else {
						if (_this._baseGeometry.morphTargets.length < 8) {
							console.log('t l',_this._baseGeometry.morphTargets.length);
							var padding = 8-_this._baseGeometry.morphTargets.length;
							console.log('padding', padding);
							for(var i=0; i<=padding; i++) {
								console.log('padding',i);
								_this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: _this._baseGeometry.vertices});
							}
						}
						_this.points = new THREE.Mesh(_this._baseGeometry, new THREE.MeshBasicMaterial({
							color: 0xffffff,
							vertexColors: THREE.FaceColors,
							morphTargets: true
						}));
					}
					_this.points.name = "lines"; // Add _this line
					scene.add(_this.points);
				}
			}
			function removeAllPoints() {
				var lines = scene.getObjectByName("lines");
				scene.remove(lines);
			}

			function createGeometry(lat, lng, size, color, subgeo) {

				var phi = (90 - lat) * Math.PI / 180;
				var theta = (180 - lng) * Math.PI / 180;

				point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
				point.position.y = 200 * Math.cos(phi);
				point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

				point.lookAt(mesh.position);

				point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
				point.updateMatrix();

				for (var i = 0; i < point.geometry.faces.length; i++) {

					point.geometry.faces[i].color = color;

				}
				if(point.matrixAutoUpdate){
					point.updateMatrix();
				}
				if(subgeo !== undefined) {
					subgeo.merge(point.geometry, point.matrix);
					// Last 8 vertices and faces in the main geometry will be the point we just added.
					dataBars[lat + 'x' + lng] = {
            faces: subgeo.faces.slice(-point.geometry.faces.length),
            vertices: subgeo.vertices.slice(-point.geometry.vertices.length)
          };
          return true;
				} else {
					var result = point.geometry.clone();
					result.applyMatrix(point.matrix);
					
					return result;
				}
			}

			function onMouseDown(event) {
				event.preventDefault();

				container.addEventListener('mousemove', onMouseMove, false);
				container.addEventListener('mouseup', onMouseUp, false);
				container.addEventListener('mouseout', onMouseOut, false);

				mouseOnDown.x = - event.clientX;
				mouseOnDown.y = event.clientY;

				targetOnDown.x = target.x;
				targetOnDown.y = target.y;

				container.style.cursor = 'move';
			}

			function onMouseMove(event) {
				mouse.x = - event.clientX;
				mouse.y = event.clientY;

				var zoomDamp = distance/1000;

				target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
				target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

				target.y = target.y > PI_HALF ? PI_HALF : target.y;
				target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
			}

			function onMouseUp(event) {
				container.removeEventListener('mousemove', onMouseMove, false);
				container.removeEventListener('mouseup', onMouseUp, false);
				container.removeEventListener('mouseout', onMouseOut, false);
				container.style.cursor = 'auto';
			}

			function onMouseOut(event) {
				container.removeEventListener('mousemove', onMouseMove, false);
				container.removeEventListener('mouseup', onMouseUp, false);
				container.removeEventListener('mouseout', onMouseOut, false);
			}

			function onMouseWheel(event) {
				event.preventDefault();
				if (overRenderer) {
					zoom(event.wheelDeltaY * 0.3);
				}
				return false;
			}

			function onDocumentKeyDown(event) {
				switch (event.keyCode) {
					case 38:
						zoom(100);
						event.preventDefault();
						break;
					case 40:
						zoom(-100);
						event.preventDefault();
						break;
				}
			}

			function onWindowResize( event ) {
				camera.aspect = container.offsetWidth / container.offsetHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( container.offsetWidth, container.offsetHeight );
			}

			function zoom(delta) {
				distanceTarget -= delta;
				distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
				distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
			}

			function animate() {
				requestAnimationFrame(animate);
				TWEEN.update();
				render();
			}

			function render() {
				zoom(curZoomSpeed);
			  if ( _this._baseGeometry.vertices.length > 0 && !_this.points.visible ) {
			  	_this.points.visible = true;
			  }
			  else if(_this.points.visible) {
			  	_this.points.visible = false;
			  }

				rotation.x += (target.x - rotation.x) * 0.1;
				rotation.y += (target.y - rotation.y) * 0.1;
				distance += (distanceTarget - distance) * 0.3;

				camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
				camera.position.y = distance * Math.sin(rotation.y);
				camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

				camera.lookAt(mesh.position);

				renderer.render(scene, camera);
			}

			init();
			_this.animate = animate;


			_this.__defineGetter__('time', function() {
				return _this._time || 0;
			});

			_this.__defineSetter__('time', function(t) {
				var validMorphs = [];
				var morphDict = _this.points.morphTargetDictionary;
				for(var k in morphDict) {
					if(k.indexOf('morphPadding') < 0) {
						validMorphs.push(morphDict[k]);
					}
				}
				validMorphs.sort();
				var l = validMorphs.length-1;
				var scaledt = t*l+1;
				var index = Math.floor(scaledt);
				for (var i = 0; i < validMorphs.length; i++) {
					_this.points.morphTargetInfluences[validMorphs[i]] = 0;
				}
				var lastIndex = index - 1;
				var leftover = scaledt - index;
				if (lastIndex >= 0) {
					_this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
				}
				_this.points.morphTargetInfluences[index] = leftover;
				_this._time = t;
			});

			this.addData = addData;
			this.updateDataPointMagnitude = updateDataPointMagnitude;
			this.createPoints = createPoints;
			this.removeAllPoints = removeAllPoints; 
			this.renderer = renderer;
			this.scene = scene;

			return this;

		}

		return service;
	}]);
})();