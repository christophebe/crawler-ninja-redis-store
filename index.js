
/**
 *
 *  Redis implementation for a crawl persistence store
 *
 */
var Redis  = require("ioredis");
var _      = require("underscore");
var URI    = require("crawler-ninja-uri");
var log    = require("crawler-ninja-logger");


var SET_START_FROM_HOSTS = "startFromHosts";
var SET_START_FROM_DOMAINS = "startFromDomains";
var SET_HISTORY = "history";
var HASH_DEPTH = "depth";

var Store = function (params) {
    //TODO : check if Redis is running correctly
    this.redis = new Redis(params);

    //TODO : Replace a flush by a more robust solution :
    // - How to keep crawl data ?
    // - create an id for each crawl ?
    // - use a different DB ?
    // - How to restart a crawl after a failure ?
    console.log("Delete the Redis data");
    this.redis.flushdb();

};

/**
 *  Check if an url is in the crawl history (that means already crawled)
 *  and add it if it is not yet in the history
 *
 * @param the url to check
 * @param callback(error, true/false), true means that the uri is in the history
 *
 */
Store.prototype.checkInCrawlHistory = function(url, callback) {
       this.redis.pipeline()
                 .sismember(SET_HISTORY, url)
                 .sadd(SET_HISTORY, url)
                 .exec(function (error, result) {
                    callback(error, result[0][1] === 1);
                  });
};


/**
 * Remove an url from the crawl history
 *
 * @param the url to remove
 * @param callback(error)
 */
Store.prototype.removeFromHistory = function(url, callback) {
   this.redis.srem(SET_HISTORY, url, callback);

};

Store.prototype.getDepth = function (url, callback) {

  this.redis.hget(HASH_DEPTH, url, function(error, value){

      if (value === null) {
        value = 0;
      }
      else {
        value = Number(value); 
      }
      callback(error, value);
  });

};

Store.prototype.setDepth = function (url, depth, callback) {
    this.redis.hset(HASH_DEPTH, url, depth, callback);
};


Store.prototype.addStartUrls = function(urls, callback) {

  this.redis.pipeline([
    ['sadd', SET_START_FROM_HOSTS, _.map(urls, function(url){ return URI.host(url); })],
    ['sadd', SET_START_FROM_DOMAINS, _.map(urls, function(url){ return URI.domain(url); })]

  ]).exec(function (error, results) {
      callback(error);
  });

};


Store.prototype.isStartFromUrl = function(parentUri, link, callback) {


    this.redis.pipeline([
      ['sismember', SET_START_FROM_HOSTS, URI.host(parentUri)],
      ['sismember', SET_START_FROM_DOMAINS, URI.domain(parentUri)],
      ['sismember', SET_START_FROM_HOSTS, URI.host(link)],
      ['sismember', SET_START_FROM_DOMAINS, URI.domain(link)]

    ]).exec(function (error, results) {
      //console.log("RESULT", results);
      if (error) {
        return callback(error);
      }
      callback(null,
          {
            parentUri : {
              isStartFromHost : results[0][1] === 1,
              isStartFromDomain : results[1][1] === 1
            },
            link : {
              isStartFromHost : results[2][1] === 1,
              isStartFromDomain : results[3][1] === 1
            }

         }
      );
    });

};


Store.prototype.toString = function() {
    return "Redis Store";
};

module.exports.Store = Store;
