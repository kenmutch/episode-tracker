#!/bin/bash
export SHOW_SELECTIONS_TABLE_NAME='ShowSelectionsLocal'
export AVAILABLE_EPISODES_TABLE_NAME='episodes-dev'
export AVAILABLE_EPISODES_BY_SHOW_SLUG_INDEX_NAME='episodes-by-show-slug-dev'
export EPISODE_AVAILABILITY_EVENTS_TOPIC_ARN='arn:aws:sns:us-east-1:123456789012:episode-availablility-events'
export LOG_LEVEL=error

if [[ ! -z $1 ]]; then
    export LOG_LEVEL=$1
fi

# mocha --recursive tests | ./node_modules/.bin/bunyan

mocha --recursive tests