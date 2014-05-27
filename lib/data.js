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

function getDashBoardData(year, callback) {
  var valid = ['2014', '2015'];
  if (valid.indexOf(year) === -1) {
    // invalid
    callback(null, {});
  }

  var queryYear = parseInt(year);
  var dollarField = year + 'dollar';
  var peopleField = year + 'people';

  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {
    if (err) {
      console.log(err);
    } else {

      async.parallel({
          dollars: function (callback) {
            /*jshint multistr: true */
            var query = 'SELECT month(yesdate) AS "month", \
                  year(yesdate) AS "year", \
                  sum(' + mysql.escapeId(dollarField) + ') AS "sumdollar" \
                  FROM gauntlet.amounts \
                  WHERE year(yesdate) = ? \
                  GROUP BY monthname(yesdate), \
                  year(yesdate) \
                  ORDER BY yesdate;';
            var vals = [queryYear];
            connection.query(query, vals, function queryComplete(err, result) {
              if (err) {
                console.log(err);
              }
              callback(null, result);
            });
          },
          people: function (callback) {
            /*jshint multistr: true */
            var query = 'SELECT month(yesdate) AS "month", \
                  year(yesdate) AS "year", \
                  sum(' + mysql.escapeId(peopleField) + ') AS "sumpeople" \
                  FROM gauntlet.people \
                  WHERE year(yesdate) = ? \
                  GROUP BY monthname(yesdate), \
                  year(yesdate) \
                  ORDER BY yesdate;';
            var vals = [queryYear];
            connection.query(query, vals, function queryComplete(err, result) {
              if (err) {
                console.log(err);
              }
              callback(null, result);
            });
          },
          startingDollar: function (callback) {
            /*jshint multistr: true */
            var query = 'SELECT sum(' + mysql.escapeId(dollarField) + ') AS "sumdollar" \
                  FROM gauntlet.amounts \
                  WHERE year(yesdate) < ? ;';
            var vals = [queryYear];
            connection.query(query, vals, function queryComplete(err, result) {
              if (err) {
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

          // look at this
          console.log(results.dollars);
          console.log(results.people);
          console.log(results.startingDollar[0].sumdollar);

          // build up a JSON object with the 12 months
          var output = [];
          var runningTotalDollar = results.startingDollar[0].sumdollar; // money coming in in this, with yes date from prior years
          var runningTotalPeople = 0;

          // go through the months, even when there is no data
          for (var i = 1; i <= 12; i++) {
            var month = {};
            var date = new Date(queryYear, i - 1, 1);
            month.monthCommencing = util.dateToISOtring(date);
            month.dollarNew = 0;
            month.peopleNew = 0;

            var dollars = results.dollars;
            // check if there is a dollar value for this month in the DB
            for (var j = dollars.length - 1; j >= 0; j--) {
              if (dollars[j].month === i && dollars[j].year === queryYear) {
                month.dollarNew += dollars[j].sumdollar;
                runningTotalDollar += dollars[j].sumdollar;
              }
            }

            var people = results.people;
            // check if there is a people value for this month in the DB
            for (var k = people.length - 1; k >= 0; k--) {
              if (people[k].month === i && people[k].year === queryYear) {
                month.peopleNew += people[k].sumpeople;
                runningTotalPeople += people[k].sumpeople;
              }
            }

            month.dollarRunningTotal = runningTotalDollar;
            month.peopleRunningTotal = runningTotalPeople;

            output.push(month);
          }
          callback(null, output);
        });

    }
  });
}

function getDashBoardDataAll(callback) {
  async.parallel({
      year_2014: function (callback) {
        getDashBoardData('2014', function gotData(err, result) {
          if (err) {
            console.log(err);
            callback(err, null);
          }
          callback(null, result);
        });
      },
      year_2015: function (callback) {
        getDashBoardData('2015', function gotData(err, result) {
          if (err) {
            console.log(err);
            callback(err, null);
          }
          callback(null, result);
        });
      }
    },
    function (err, results) {
      if (err) {
        console.log(err);
      }

      var output = results.year_2014.concat(results.year_2015);
      callback(null, output);
    });
}

function getTargets(callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {
    if (err) {
      console.error(err);
      callback(err);

    } else {
      var query = 'SELECT * FROM targets LIMIT 1;';
      connection.query(query, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null, result[0]);
      });
    }
  });
}

module.exports = {
  getDashBoardData: getDashBoardData,
  getDashBoardDataAll: getDashBoardDataAll,
  getTargets: getTargets
};
