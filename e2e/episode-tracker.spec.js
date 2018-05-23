const AWS = require('aws-sdk');
const Promise = require('bluebird');
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

should.Assertion.add('theEqualSetOf', function (other) {   //must use 'function' here, as '=>' changes the meaning of 'this'
    this.params = {operation: 'should contain the same items'}
    this.obj.should.containDeep(other);
    other.should.containDeep(this.obj);
});

describe('Episode tracker', () => {
    it('should pass a dummy test', () => {
        return Promise.resolve();
    })
})

function loadFromTemplate(path, params) {
    console.log('cwd', process.cwd());
    const template = JsonTemplateParser(fse.readFileSync(path, {encoding:'utf8'}));
    return JSON.parse(template(params));
}
