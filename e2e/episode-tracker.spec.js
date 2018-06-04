const AWS = require('aws-sdk');
const Promise = require('bluebird');
const poller = require('promise-poller').default;
const should = require('should');
const supertest = require('supertest'); 
const fse = require('fs-extra');
const path = require('path')
const JsonTemplateParser = require('json-templates');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.REGION
});

AWS.config.setPromisesDependency(Promise);
const DB = new AWS.DynamoDB({
    apiVersion: '2012-10-08',
    endpoint: process.env.DYNAMODB_ENDPOINT
});
const SNS = new AWS.SNS({
    apiVersion: '2012-10-08',
    endpoint: process.env.SNS_ENDPOINT
});

should.Assertion.add('theEqualSetOf', function (other) {   //must use 'function' here, as '=>' changes the meaning of 'this'
    this.params = {operation: 'should contain the same items'}
    this.obj.should.containDeep(other);
    other.should.containDeep(this.obj);
});

describe('Episode tracker', () => {
    const episodeTracker = require('../src/episode-tracker/index');
    const tableName = process.env.SHOW_SELECTIONS_TABLE_NAME;

    const tableDefinition = loadFromTemplate(
        path.resolve(__dirname, 'table-definition.json'), 
        {tableName:tableName}
    );

    const scheduledEvent = require('./scheduled-event.json');
    const items = require('./table-items.json');

    before(function() {
        this.timeout(15000);
        return DB.createTable(tableDefinition).promise();
            // then(() => {
            //     return poller({
            //         taskFn: () => {
            //             return DB.describeTable({TableName:tableName})
            //                 .then(() => {
            //                     console.log('table is provisioned...')
            //                     return false;
            //                 })
            //                 .catch(() => {
            //                     console.log('waiting for table to be provisioned...')
            //                     return true;
            //                 });
            //         },
            //         interval: 500,
            //         retries: 10,
            //         masterTimeout: 20000
            //     })
            // });
    });

    after(() => {
        return DB.deleteTable({TableName:tableDefinition.TableName}).promise();
    });

    afterEach(() => {
        return wipeDB();
    })

    beforeEach(() => {

        console.log('Adding data to the db', items);
        return Promise.map(items, (item) => {
            return DB.putItem({
                Item: {
                    "username": {
                        S: item.username                    
                    },
                    "showSlug": {
                        S: item.showSlug
                    }
                },
                TableName: tableDefinition.TableName
            }).promise();
        });
    });

    it('should send a notification', (done) => {

        episodeTracker.handler(scheduledEvent, {}, (err, data) => {
            if(err) {
                done(err);
            }
            else {
                done();
            }
        })
    });

    function wipeDB() {
        return DB.scan({TableName: tableName}).promise()
            .then((res) => {
                return Promise.map(res.Items, (item) => {
                    return DB.deleteItem({
                        Key: {
                            "username": {
                                S: item.username.S
                            },
                            "showSlug": {
                                S: item.showSlug.S
                            }
                        },
                        TableName: tableDefinition.TableName
                    }).promise();
                });
            });
    }
})

function loadFromTemplate(path, params) {
    const template = JsonTemplateParser(fse.readFileSync(path, {encoding:'utf8'}));
    return JSON.parse(template(params));
}
