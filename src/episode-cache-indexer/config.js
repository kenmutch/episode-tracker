module.exports = {
    appName: process.env.APP_NAME,
    logLevel: process.env.LOG_LEVEL,
    aws: {
        region: process.env.REGION
    },
    dynamodb: {
        episodeCacheIndexTableName: process.env.EPISODE_INDEX_CACHE_TABLE_NAME,
        endpoint: process.env.DYNAMODB_ENDPOINT
    },
    sns: {
        episodeAvailabilityEventsTopicArn: process.env.EPISODE_AVAILABILITY_EVENTS_TOPIC_ARN,
        endpoint: process.env.SNS_ENDPOINT
    }
}