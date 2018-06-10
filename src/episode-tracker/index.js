'use strict';
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const lodashMap = require('lodash.map');
const lodashFlatten = require('lodash.flatten');
const lodashDiff = require('lodash.differencewith');
const config = require('./config');
const logger = require('../bunyan-log-provider').getLogger(bunyanLogProviderOptions(config));


module.exports.handler = (event, context, done) => {

    const showSelectionsRepository = require('./show-selections-repository')(selectedShowRepositoryOptions(config), logger);
    const notificationService = require('../notification-service')(notificationServiceOptions(config), logger);
    const episodesRepository = require('./episodes-repository')(episodesRepositoryOptions(config), logger);
    const episodeCacheIndexer = require('../episode-cache-indexer')(episodeCacheIndexerOptions(config), logger);
    
    findNewlyAvailableEpisodes(showSelectionsRepository, episodesRepository, episodeCacheIndexer)
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

function findNewlyAvailableEpisodes(showSelectionsRepository, episodesRepository, episodeCacheIndexer){
    // retrieve selected shows from show-selections db
    // retrieve available episodes for each selected show
    // retrieve episodes in episode cache index for each selected show
    // subtract episodes in cache index from available episodes
    // return resulting episode list
    return showSelectionsRepository.retrieveDistinctShowSlugsOfSelectedShows()
        .then((selectedShows) => {
            return retrieveAvailableEpisodesOfSelectedShows(selectedShows, episodesRepository);
        })
        .then((availableEpisodes) => {
            
            const selectedShowSlugs = extractDistinctShowSlugsFrom(availableEpisodes);

            logger.debug('availableEpisodes', JSON.stringify(availableEpisodes));
            logger.debug('selectedShowSlugs', JSON.stringify(selectedShowSlugs));

            return retrieveEpisodeCacheIndexesOfSelectedShows(selectedShowSlugs, episodeCacheIndexer)
                .then((episodeIndexes) => {

                    logger.debug('episodeIndexes', JSON.stringify(episodeIndexes));

                    return lodashDiff(availableEpisodes, episodeIndexes, (ep, idx) => {
                        return ep.id === idx.episodeId
                    })
                });
        });
}

function retrieveAvailableEpisodesOfSelectedShows(selectedShowSlugs, episodesRepository) {
    return Promise.reduce(selectedShowSlugs, (accumulation, selectedShow) => {
        return episodesRepository.retrieveAvailableEpisodesOfShow(selectedShow)
            .then((episodes) => {
                return accumulation.concat(episodes);
            });
    }, []);
}

function retrieveEpisodeCacheIndexesOfSelectedShows(selectedShowSlugs, episodeCacheIndexer) {

    return Promise.reduce(selectedShowSlugs, (accumulation, showSlug) => {
        return episodeCacheIndexer.retrieveEpisodeIndexesByShowSlug(showSlug)
            .then((indexes) => {
                return accumulation.concat(indexes);
            });
    }, []);
}

function notifyOfNewlyAvailableEpisodes(notificationService, episodes) {
    // for each episode, send a notification of its availability
    logger.debug('available episodes', episodes);
    return Promise.map(lodashFlatten(episodes), (episode) => {
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
        endpoint: config.dynamodb.endpoint,
        tableName: config.dynamodb.showSelectionsTableName
    }
}

function episodesRepositoryOptions(config) {
    return {
        region: config.region,
        endpoint: config.dynamodb.endpoint,
        tableName: config.dynamodb.episodesTableName,
        episodesByShowSlugIndexName: config.dynamodb.episodesByShowSlugIndexName
    }
}

function episodeCacheIndexerOptions(config) {
    return {
        region: config.region,
        endpoint: config.dynamodb.endpoint,
        tableName: config.dynamodb.episodeCacheIndexerTableName
    }
}

function notificationServiceOptions(config) {
    return {
        region: config.region,
        endpoint: config.sns.endpoint,
        episodeAvailabilityEventsTopicArn: config.sns.episodeAvailabilityEventsTopicArn
    };
}

function extractDistinctShowSlugsFrom(episodes) {
    return [...(new Set(lodashMap(episodes, 'showSlug')))];
}
