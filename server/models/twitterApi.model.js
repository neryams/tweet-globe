'use strict';

var config = require('../config'),
		https = require('https'),
		OAuth2 = require('oauth').OAuth2;

var Twitter = function (OAuthCredentials) {
	this.credentials = OAuthCredentials;
};

Twitter.search = function search(keyword) { 
  return new Promise(function (resolve, reject) {
		var twitterAuth = new OAuth2(config.OAuth2.consumer_key, config.OAuth2.consumer_secret, 
			'https://api.twitter.com/', null, 'oauth2/token', null);

		twitterAuth.getOAuthAccessToken('', {
			'grant_type': 'client_credentials'
		}, function (e, access_token) {
			if(e) {
				return reject(e);
			}

			var options = {
			    hostname: 'api.twitter.com',
			    path: '/1.1/search/tweets.json?count=100&geocode=0,0,12500mi&q=' + encodeURIComponent(keyword),
					method: 'GET',
			    headers: {
			        Authorization: 'Bearer ' + access_token
			    }
			};

			var req = https.get(options, function(result) {
				var buffer = '';
				result.setEncoding('utf8');
				result.on('data', function(data){
					buffer += data;
				});
				result.on('end', function(){
					var tweets = JSON.parse(buffer);
					return resolve(tweets); // the tweets!
				});
			});

			req.on('error', function(e) {
			  console.error(e);
			});
		});
	});
};

module.exports = Twitter;