'use strict';

var config = require('../config'),
		elasticsearch = require('elasticsearch'),
		_ = require('lodash');

var TwitterElastic = function TwitterElastic(type) {
	this.type = type;
};

TwitterElastic.connect = connect;
TwitterElastic.newMapping = newMapping;
TwitterElastic.prototype.addTweet = function(tweetId, data) {
	return addTweet(tweetId, this.type, data);
};

var client,
		mappingParams = { 
			index: config.elasticIndex,
			body: {
			  properties: {
			  	user_id:  { type: 'string', index: 'not_analyzed' },
			    created:  { type: 'date' },
			    location: { type: 'geo_point' },
			    message:  { type: 'string' }
			  }
			}
		};

function connect() {
	client = new elasticsearch.Client({
	  host: 'localhost:9200',
	  log: 'trace'
	});

	return client.indices.exists({index: config.elasticIndex}).then(function(exists) {
		console.log('index exists?', exists);
		if(!exists) {
			return client.indices.create({ index: config.elasticIndex });
		}

		return exists;
	});
}

function newMapping(type) {
	return createMap(type).then(function() {
		return new TwitterElastic(type);
	});
}

function createMap(track) {
	if(!client) {
		return connect().then(function() { return createMap(track); });
	}
	var mappingParamsTrack = _.assign({ type: track }, mappingParams);
	console.log(mappingParamsTrack);

	return client.indices.getMapping({ index: config.elasticIndex, type: track }).then(function(result) {
		console.log('mapping result:', JSON.stringify(result));
		if(_.isEmpty(result)) {
			return client.indices.putMapping(mappingParamsTrack).then(function() {
				console.log('Added mapping to elasticsearch: ', JSON.stringify(mappingParamsTrack));
			});
		} else {
			return result;
		}
	});
}

function addTweet(tweetId, type, data) { 
	if(!client) {
		return connect().then(function() { return addTweet(tweetId, type, data); });
	}
	return client.create({
	  index: config.elasticIndex,
	  type: type,
	  id: tweetId,
	  body: data
	}).then(function(response) {
		return response;
	}, function (error) {
	  console.error('Could not save to elasticsearch: ', error);
	});
}

module.exports = TwitterElastic;