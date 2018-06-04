'use strict';
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const flatten = require('lodash.flatten');
const config = require('./config');
const logger = require('../bunyan-log-provider').getLogger(bunyanLogProviderOptions(config));


module.exports.handler = (event, context, done) => {

    const showSelectionsRepository = require('../show-selections-repository')(selectedShowRepositoryOptions(config), logger);
    const notificationService = require('../notification-service')(notificationServiceOptions(config), logger);
    const episodesRepository = require('../episodes-repository')(episodesRepositoryOptions(config), logger);
    
    findNewlyAvailableEpisodes(showSelectionsRepository, episodesRepository)
        .then((episodes) => {
            return notifyOfNewlyAvailableEpisodes(notificationService, episodes);
        })
        .then(() => {
            done();
        })
        .catch((err) => {
            done(err);
        });
}

function findNewlyAvailableEpisodes(showSelectionsRepository, episodesRepository){
    // retrieve selected shows from show-selections db
    // retrieve available episodes for each selected show
    // retrieve episodes in episode cache index for each selected show
    // subtract episodes in cache index from available episodes
    // return resulting episode list
    return showSelectionsRepository.retrieveDistinctShowSlugsOfSelectedShows()
        .then((selectedShows) => {
            return Promise.map(selectedShows, (selectedShow) => {
                return episodesRepository.retrieveAvailableEpisodesOfShow(selectedShow);
            });
        });
}

function notifyOfNewlyAvailableEpisodes(notificationService, episodes) {
    // for each episode, send a notification of its availability
    logger.debug('available episodes', episodes);
    return Promise.map(flatten(episodes), (episode) => {
        return notificationService.notifyOfEpisodeAvailability(episode);
    });
}

function bunyanLogProviderOptions(config) {
    return {
        logLevel: config.logLevel,
        name: config.appName
    };
}

function selectedShowRepositoryOptions(config) {
    return {
        region: config.region,
        tableName: config.dynamodb.showSelectionsTableName,
        endpoint: config.dynamodb.endpoint
    }
}

function episodesRepositoryOptions(config) {
    return {
        region: config.region,
        tableName: config.dynamodb.episodesTableName,
        episodesByShowSlugIndexName: config.dynamodb.episodesByShowSlugIndexName
    }
}

function notificationServiceOptions(config) {
    return {
        episodeAvailabilityEventsTopicArn: config.sns.episodeAvailabilityEventsTopicArn,
        region: config.region,
        endpoint: config.sns.endpoint
    };
}
