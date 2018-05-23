/**
 * Created by kmutch on 19/09/2016.
 */
var bunyan = require('bunyan');
var util = require('util');

var rootLogName;
var logInstance;


function _getLogger(options) {

    options = options || {}

    const name = options.name || 'no-app-name';
    const logLevel = options.logLevel || 'info';

    if (!logInstance || null === logInstance) {

        logInstance = bunyan.createLogger({
            name: name,
            src:true,
            serializers: {
                err: bunyan.stdSerializers.err,
                req: bunyan.stdSerializers.req,
                res: bunyan.stdSerializers.res,
                dbQuery: querySerializer
            },
            streams: [
                {
                    level: process.env.LOG_LEVEL,
                    stream: process.stdout
                }
            ]
        });
    }
    return logInstance;
}

function querySerializer(data) {
    var query = JSON.stringify(data.query);
    var options = JSON.stringify(data.options || {});

    return util.format('db.%s.%s(%s, %s);', data.coll, data.method, query, options);
}

module.exports = {
    getLogger: _getLogger
};