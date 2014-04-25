var mysql = require('mysql');
var async = require('async');
var util = require("../lib/util.js");

var connectionOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

if (process.env.DB_SSL) {
  // SSL is used for Amazon RDS, but not necessarily for local dev
  connectionOptions.ssl = process.env.DB_SSL;
}

exports.getDashBoardData = function getDashBoardData(callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted (err) {
    if (err) {
      console.log(err);
    }
    else {

      async.parallel({
        dollars: function (callback) {
          /*jshint multistr: true */
          var query = 'SELECT month(yesdate) AS "month", \
                  year(yesdate) AS "year", \
                  sum(2014dollar) AS "sumdollar" \
                  FROM gauntlet.amounts \
                  WHERE year(yesdate) = 2014 \
                  GROUP BY monthname(yesdate), \
                  year(yesdate) \
                  ORDER BY yesdate;';
          connection.query(query, function queryComplete (err, result) {
            if(err) {
              console.log(err);
            }
            callback(null, result);
          });
        },
        contributors: function (callback) {
          /*jshint multistr: true */
          var query = 'SELECT month(yesdate) AS "month", \
                  year(yesdate) AS "year", \
                  sum(2014people) AS "sumpeople" \
                  FROM gauntlet.contributors \
                  WHERE year(yesdate) = 2014 \
                  GROUP BY monthname(yesdate), \
                  year(yesdate) \
                  ORDER BY yesdate;';
          connection.query(query, function queryComplete (err, result) {
            if(err) {
              console.log(err);
            }
            callback(null, result);
          });
        }
      },
      function (err, results) {
        if (err) {
          console.log(err);
        }
        connection.end();
        console.log(results.dollars);
        console.log(results.contributors);

        // build up a JSON object with the 12 months
        var output = [];
        var runningTotalDollar = 5584478; // money coming in in 2014 from early years
        var runningTotalPeople = 0;

        // go through the months, even when there is no data
        for (var i = 1; i <= 12; i++) {
          var month = {};
          var date = new Date(2014, i-1, 1);
          month.monthCommencing = util.dateToISOtring(date);
          month.dollarNew = 0;
          month.peopleNew = 0;

          // check if there is a dollar value for this month in the DB
          for (var j = results.dollars.length - 1; j >= 0; j--) {
            if (results.dollars[j].month === i && results.dollars[j].year === 2014) {
              month.dollarNew += results.dollars[j].sumdollar;
              runningTotalDollar += results.dollars[j].sumdollar;
            }
          }

          // check if there is a people value for this month in the DB
          for (var k = results.contributors.length - 1; k >= 0; k--) {
            if (results.contributors[k].month === i && results.dollars[k].year === 2014) {
              month.peopleNew += results.contributors[k].sumpeople;
              runningTotalPeople += results.contributors[k].sumpeople;
            }
          }

          month.dollarRunningTotal = runningTotalDollar;
          month.contributorRunningTotal = runningTotalPeople;

          output.push(month);
        }
        callback(null, output);
      });

    }
  });
};
