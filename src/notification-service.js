const AWS = require('aws-sdk')
const Promise = require('bluebird');

module.exports = function(options, logger){

    options = options || {};
    AWS.config.update({
        region: (options.region ? options.region: 'ap-southeast-2')
    });
    AWS.config.setPromisesDependency(Promise);
    const SNS = createSnsClient(options);

    return {
        notifyOfEpisodeAvailability: (event) => {
            logger.info('An episode is available: ' + JSON.stringify(event));
            return publish(options.episodeAvailabilityEventsTopicArn, event);
        }
    }

    function publish(snsTopicArn, event) {
        const message = JSON.stringify({default:event});
        const params = {
            Message: message,
            TopicArn: snsTopicArn
        }
        logger.debug('about to publish', params);

        return SNS.publish({
            Message: message,
            TopicArn: snsTopicArn
        }).promise()
        .then((data) => {
            logger.info(`published message of '${message}' to ${snsTopicArn} and the response was ${JSON.stringify(data)}`);
            return data;
        })
        .catch((err) => {
            logger.info(`error publishing message of '${message}' to ${snsTopicArn}`, err);
            throw err;
        });
    }

    function createSnsClient(options) {
        
        let client;
        if(options.endpoint) {
            logger.debug(`Creating sns client with endpoint of ${options.endpoint}`);
            client = new AWS.SNS({
                apiVersion: '2012-08-10',
                endpoint: options.endpoint
            });
        }
        else {
            logger.debug(`Creating sns client with default endpoint`);
            client = new AWS.SNS({
                apiVersion: '2012-08-10'
            });
        }
        logger.debug(`Created sns client: ${JSON.stringify(client)}`);
        return client;
    }
}