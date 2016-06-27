var redis = require('redis');
var stackTrace = require('stack-trace');
var colors = require('colors');
var util = require('util');

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

  this.transports = {
    'console': this.consoleTransport,
    'redis': this.redisTransport
  }

  this.defaultLogObject = {
    hostname: require('os').hostname(),
    service: options.service || "redis-logger",
    level: "INFO"
  };
}

Logger.prototype.redisTransport = function (t, o) {
  t.client.lpush(t.key, JSON.stringify(o));
}

Logger.prototype.consoleTransport = function (t, o) {
  if (!t.console) return;
  var errorString = util.format('%s [%s:%s %s]: %s\n',
                                o.level === 'FATAL' ? o.level.red :
                                o.level === 'WARN' ? o.level.yellow :
                                o.level,
                                o.filename,
                                o.linenumber,
                                o.method,
                                o.message);
  if (o.level === 'FATAL') process.stderr.write(errorString);
  else process.stdout.write(errorString);
}

Logger.prototype.send = function (o) {
  for (t in this.transports) {
    this.transports[t](this, o);
  }
}

Logger.prototype.getDebugInfo = function() {
  var Log = this.defaultLogObject;
  var frame = stackTrace.get()[2];
  Log.linenumber = frame.getLineNumber();
  Log.filename = frame.getFileName();
  Log.method = frame.getFunctionName();
  if (this.timestamp) Log.timestamp = new Date().toISOString();
  return Log;
}

Logger.prototype.info = function (message) {
  var Log = this.getDebugInfo();
  Log.message = message;
  this.send(Log);
}

Logger.prototype.warn = function (message) {
  var Log = this.getDebugInfo();
  Log.level = "WARN";
  Log.message = message;
  this.send(Log);
}

Logger.prototype.error = Logger.prototype.fatal = function (message) {
  var Log = this.getDebugInfo();
  Log.level = "FATAL";
  Log.message = message;
  this.send(Log);
}
