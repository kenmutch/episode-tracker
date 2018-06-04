const AWS = require('aws-sdk')
const Promise = require('bluebird');

module.exports = function(options, logger) {
    options = options || {};

    AWS.config.update({
        region: options.region ? options.region: 'ap-southeast-2'
    });
    AWS.config.setPromisesDependency(Promise);
    
    const docClient = createDocClient(options);
    const tableName = options.tableName;
    const indexName = options.episodesByShowSlugIndexName;

    return {
        retrieveAvailableEpisodesOfShow: retrieveAvailableEpisodesOfShow
    }

    function retrieveAvailableEpisodesOfShow(showSlug) {
        var params = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: 'showSlug = :s',
            ExpressionAttributeValues: {
                ':s': showSlug
            },
            ProjectionExpression: 'id, showSlug, siteName, title'
        };
        
        logger.debug('query params', params);
        return docClient.query(params).promise()
            .then((data) => {
                logger.debug('query response', data);
                return data.Items;
            });
    }
}

function createDocClient(options) {
    if (options.endpoint) {
        return new AWS.DynamoDB.DocumentClient({
            apiVersion: '2012-08-10',
            endpoint: options.endpoint
        });
    }
    else {
        return new AWS.DynamoDB.DocumentClient({
            apiVersion: '2012-08-10'
        });
    };
}
