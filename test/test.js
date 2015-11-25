var assert     = require("assert");
var crawler    = require("crawler-ninja");
var cs         = require("crawler-ninja/plugins/console-plugin");
//var seoaudit   = require("crawler-ninja/plugins/audit-plugin.js");
var redisStore = require("../index.js");


var testSite  = require("./website/start.js").site;

describe('Redis Store tests', function() {


        it('Audit Test', function(done) {
          this.timeout(100000);
          var options = {
            //storeModuleName : "../index.js",
            //storeParams : {}
          };

          crawler.init(options, function(){ done();});
          var consolePlugin = new cs.Plugin();
          crawler.registerPlugin(consolePlugin);

          var rs = new redisStore.Store();
          crawler.setStore(rs);
          //crawler.queue({url : "http://localhost:9999/index.html"});
          crawler.queue("http://www.cirh.ht/");

        });



});
