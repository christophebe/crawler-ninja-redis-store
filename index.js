
/**
 *
 *  Redis implementation for a crawl persistence store
 *
 */
var redis  = require("redis");
var _      = require("underscore");
var URI    = require("crawler-ninja-uri");
var log    = require("crawler-ninja-logger");


var SET_START_FROM_HOSTS = "startFromHosts";
var SET_START_FROM_DOMAINS = "startFromDomains";
var SET_HISTORY = "history";
var HASH_DEPTH = "depth";

var Store = function (params) {
    this.client = redis.createClient(params);
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
        this.client.multi()
            .sismember(SET_HISTORY, url)
            .sadd(SET_HISTORY, url)
            .exec(function (error, result) {
              if (error) {
                return callback(error);
              }
               callback(null, result[0] === 1);
             });
};


/**
 * Remove an url from the crawl history
 *
 * @param the url to remove
 * @param callback(error)
 */
Store.prototype.removeFromHistory = function(url, callback) {
   this.client.srem(SET_HISTORY, url, callback);

};

Store.prototype.getDepth = function (url, callback) {

  this.client.hget(HASH_DEPTH, url, function(error, value){
      if (error) {
          return callback(error);
      }

      if (value === null) {
        value = 0;
      }
      else {
        value = Number(value);
      }
      callback(null, value);
  });

};

Store.prototype.setDepth = function (url, depth, callback) {
    this.client.hset(HASH_DEPTH, url, depth, callback);
};


Store.prototype.addStartUrls = function(urls, callback) {
  this.client.multi()
      .sadd(SET_START_FROM_HOSTS, _.map(urls, function(url){ return URI.host(url); }))
      .sadd(SET_START_FROM_DOMAINS, _.map(urls, function(url){ return URI.domain(url); }))
      .exec(function (error, result) {
         callback(error);
       });
};


Store.prototype.isStartFromUrl = function(parentUri, link, callback) {

    this.client.multi()
        .sismember(SET_START_FROM_HOSTS, URI.host(parentUri))
        .sismember(SET_START_FROM_DOMAINS, URI.domain(parentUri))
        .sismember(SET_START_FROM_HOSTS, URI.host(link))
        .sismember(SET_START_FROM_DOMAINS, URI.domain(link))
        .exec(function (error, results) {

            if (error) {
              return callback(error);
            }
            callback(null,
                {
                  parentUri : {
                    isStartFromHost : results[0] === 1,
                    isStartFromDomain : results[1] === 1
                  },
                  link : {
                    isStartFromHost : results[2] === 1,
                    isStartFromDomain : results[3] === 1
                  }

               }
            );

         });
};


Store.prototype.toString = function() {
    return "Redis Store";
};

module.exports.Store = Store;
