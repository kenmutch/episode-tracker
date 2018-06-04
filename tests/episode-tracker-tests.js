"use strict";
const AWSMock = require('aws-sdk-mock');
const EpisodeTracker = require('../src/episode-tracker');
const should = require('should');
const sinon = require('sinon');


describe('EpisodeTracker', () => {

    describe('Given there are no newly available episodes,', () => {

        it('it should not send any notifications', (done) => {
            const snsSpy = sinon.spy()
            const SNS = AWSMock.mock('SNS', 'publish', snsSpy);

            EpisodeTracker.handler("fake event", "fake context", (err, data) => {
                if(err) {
                    done(err);
                } 
                else {
                    sinon.assert.notCalled(snsSpy);
                    AWSMock.restore('SNS', 'publish');
                    done();
                }
            });
        });

        beforeEach(() => {
            const dynamodbStub = sinon.stub();
            dynamodbStub.withArgs(sinon.match({
                TableName:process.env.SHOW_SELECTIONS_TABLE_NAME
            })).returns({
                Items: []
            });
            const DB = AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
                callback(null, dynamodbStub(params, callback));
            });            
        });

        afterEach(() => {
            AWSMock.restore('DynamoDB.DocumentClient');
            sinon.reset();
        });
    });

    describe('Given there are newly available episodes,', (done) => {

        it('it should send a notification for each newly available episode', (done) => {
            const snsSpy = sinon.spy();
            const SNS = AWSMock.mock('SNS', 'publish', (params, callback) => {
                snsSpy(params, callback);
                callback(undefined, {});
            });
            
            EpisodeTracker.handler("fake event", "fake context", (err, data) => {
                if(err) {
                    done(err);
                } 
                else {
                    sinon.assert.calledTwice(snsSpy);
                    AWSMock.restore('SNS', 'publish');
                    done();
                }
            });
        });

        beforeEach(() => {
            const showSelectionsTableStub = sinon.stub();
            showSelectionsTableStub.withArgs(sinon.match({
                TableName:process.env.SHOW_SELECTIONS_TABLE_NAME
            })).returns({
                Items: [
                    {showSlug: 'show-a'},
                    {showSlug: 'show-b'}
                ]
            });
            const episodesByShowSlugIndexStub = sinon.stub();
            episodesByShowSlugIndexStub.returns({
                Items: [
                    {id:'foo', showSlug: 'show-a'}
                ]
            });
            AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
                callback(null, showSelectionsTableStub(params, callback));
            });    
            AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
                callback(null, episodesByShowSlugIndexStub(params, callback));
            });       
        });

        afterEach(() => {
            AWSMock.restore('DynamoDB.DocumentClient');
            sinon.reset();
        });
    });

    describe('Given a there was an episode with id of \'foo\' available for a show with slug \'show-a\'', () => {

        it('should send a notification that contains the show slug in the message', (done) => {
            const snsDefaultMessageSpy = sinon.spy();
            const SNS = AWSMock.mock('SNS', 'publish', (params, callback) => {
                snsDefaultMessageSpy(JSON.parse(params.Message).default, callback);
                callback(undefined, {});
            });
            
            EpisodeTracker.handler("fake event", "fake context", (err, data) => {
                if(err) {
                    done(err);
                } 
                else {
                    sinon.assert.calledWith(snsDefaultMessageSpy, sinon.match({showSlug: 'show-a'}));
                    AWSMock.restore('SNS', 'publish');
                    done();
                }
            });
        });

        it('should send a notification to the episode availability events topic', (done) => {
            const snsTopicSpy = sinon.spy();
            const SNS = AWSMock.mock('SNS', 'publish', (params, callback) => {
                snsTopicSpy(params, callback);
                callback(undefined, {});
            });
            
            EpisodeTracker.handler("fake event", "fake context", (err, data) => {
                if(err) {
                    done(err);
                } 
                else {
                    sinon.assert.calledWith(snsTopicSpy, sinon.match({
                        TopicArn: process.env.EPISODE_AVAILABILITY_EVENTS_TOPIC_ARN
                    }));
                    AWSMock.restore('SNS', 'publish');
                    done();
                }
            });
        });

        it('should send a notification that contains the episode id in the message', (done) => {
            const snsDefaultMessageSpy = sinon.spy();
            const SNS = AWSMock.mock('SNS', 'publish', (params, callback) => {
                snsDefaultMessageSpy(JSON.parse(params.Message).default, callback);
                callback(undefined, {});
            });
            
            EpisodeTracker.handler("fake event", "fake context", (err, data) => {
                if(err) {
                    done(err);
                } 
                else {
                    sinon.assert.calledWith(snsDefaultMessageSpy, sinon.match({id:'foo'}));
                    AWSMock.restore('SNS', 'publish');
                    done();
                }
            });
        });

        beforeEach(() => {
            const selectedShowsStub = sinon.stub();
            selectedShowsStub.withArgs(sinon.match({
                TableName:process.env.SHOW_SELECTIONS_TABLE_NAME
            })).returns({
                Items: [
                    {showSlug: 'show-a'}
                ]
            });
            const episodesByShowSlugIndexStub = sinon.stub();
            episodesByShowSlugIndexStub.returns({
                Items: [
                    {id:'foo', showSlug: 'show-a'}
                ]
            })
            AWSMock.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
                callback(null, selectedShowsStub(params, callback));
            });
            AWSMock.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
                callback(null, episodesByShowSlugIndexStub(params, callback));
            })                      
        });

        afterEach(() => {
            AWSMock.restore('DynamoDB.DocumentClient');
            sinon.reset();
        });
    });
});