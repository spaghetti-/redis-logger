# Simple logger for Node.js [![CircleCI](https://circleci.com/gh/spaghetti-/redis-logger.svg?style=svg)](https://circleci.com/gh/spaghetti-/redis-logger)

There are many logging frameworks available for Node.js but most of them are not
well maintained, riddled with dependencies and hence bloated.

This is a 50 line library that does what it's supposed to do with minimal
dependencies. It is used to push logs to a redis channel for logstash to pick
up, but it can be used for other purposes as well.
