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

    return {
        retrieveDistinctShowSlugsOfSelectedShows: retrieveDistinctShowSlugsOfSelectedShows
    }

    function retrieveDistinctShowSlugsOfSelectedShows() {

        var params = {
            TableName: tableName,
            ProjectionExpression: 'showSlug'
        };
        
        logger.debug('scan params', params);
        return docClient.scan(params).promise()
            .then((data) => {
                logger.debug('scan data', data);
                const showSlugs = data.Items.map((item) => {
                    return item.showSlug;
                });
                // de-dupe the result by inserting into a set,
                // then return to an array by spreading
                return [...(new Set(showSlugs))]
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