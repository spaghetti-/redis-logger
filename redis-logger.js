var redis = require('redis');
var stackTrace = require('stack-trace');
var colors = require('colors');

var Logger = exports.Logger = function(options) {
  if (options.redis instanceof redis.RedisClient) {
    this.client = options.redis;
  } else {
    this.client = redis.createClient(options);
    this.client.on('error', function (error) {
      console.log('transport error: ' + error);
    });
  }

  this.timestamp = options.timestamp || false;
  this.key = options.key || 'logstash:debug';
  this.console = options.console || false;
  this.defaultLogObject = {
    hostname: require('os').hostname(),
    service: options.service || "redis-logger",
    level: "INFO"
  };
}

Logger.prototype.getDebugInfo = function() {
  var Log = this.defaultLogObject;
  var frame = stackTrace.get()[2];
  Log.lineNumber = frame.getLineNumber();
  Log.fileName = frame.getFileName();
  Log.method = frame.getFunctionName();
  if (this.timestamp) Log.timestamp = new Date().toISOString();
  return Log;
}

Logger.prototype.info = function (message) {
  var Log = this.getDebugInfo();
  Log.message = message;
  if (this.console)
    console.log('INFO' + ': ' + message);
  this.client.lpush(this.key, JSON.stringify(Log));
}

Logger.prototype.warn = function (message) {
  var Log = this.getDebugInfo();
  Log.level = "WARN";
  Log.message = message;
  if (this.console)
    console.log('WARN'.yellow + ': ' + message);
  this.client.lpush(this.key, JSON.stringify(Log));
}

Logger.prototype.error = Logger.prototype.fatal = function (message) {
  var Log = this.getDebugInfo();
  Log.level = "FATAL";
  Log.message = message;
  if (this.console)
    console.log('ERROR'.red + ': ' + message);
  this.client.lpush(this.key, JSON.stringify(Log));
}
