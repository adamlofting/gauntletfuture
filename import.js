var mysql = require('mysql');
var async = require('async');
var util = require("./lib/util.js");
var csv = require('csv');
var request = require('request');

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

// SAVING
function saveAmount(amount, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      callback(err);

    } else {

      connection.query('INSERT INTO amounts SET ?', amount, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function clearAmounts(callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      callback(err);

    } else {

      connection.query('TRUNCATE amounts', function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function saveAmounts(amounts, callback) {
  async.waterfall([

    function (callback) {
      clearAmounts(function cleared() {
        console.log('Amounts Cleared');
        callback(null);
      });
    },
    function (callback) {
      async.eachSeries(amounts, saveAmount, function (err) {
        if (err) {
          console.log('Error saving an ammount');
          console.log(err);
        } else {
          console.log('All amounts have been processed successfully');
          callback(null);
        }
      });
    }
  ], function (err, result) {
    console.log("Amounds Cleared and Latest Saved");
    callback(null);
  });
}

// SAVING People
function savePeopleCount(count, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      callback(err);

    } else {

      connection.query('INSERT INTO contributors SET ?', count, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function clearPeopleCounts(callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      callback(err);

    } else {

      connection.query('TRUNCATE contributors', function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function savePeopleCounts(counts, callback) {
  async.waterfall([

    function (callback) {
      clearPeopleCounts(function cleared() {
        console.log('People counts Cleared');
        callback(null);
      });
    },
    function (callback) {
      async.eachSeries(counts, savePeopleCount, function (err) {
        if (err) {
          console.log('Error saving a count');
          console.log(err);
        } else {
          console.log('All counts have been processed successfully');
          callback();
        }
      });
    }
  ], function (err, result) {
    console.log("Counts Cleared and Latest Saved");
    callback(null);
  });
}

// PROCESSING
function processCSV(fetchecCSV, callback) {
  var amountsToSave = [];
  var allPeopleToSave = [];

  function addToAmounts(date, amount, field) {
    amount = util.toInt(amount);
    if (util.isValidDate(date) && (amount > 0)) {
      var amountToSave = {
        'yesdate': util.dateToISOtring(new Date(date))
      };
      amountToSave[field] = amount;
      console.log(amountToSave);
      amountsToSave.push(amountToSave);
    }
  }

  function addToPeople(date, count, field) {
    count = util.toInt(count);
    if (util.isValidDate(date) && (count > 0)) {
      var peopleToSave = {
        'yesdate': util.dateToISOtring(new Date(date))
      };
      peopleToSave[field] = count;
      console.log(peopleToSave);
      allPeopleToSave.push(peopleToSave);
    }
  }

  csv()
    .from.string(fetchecCSV, {
      columns: true,
      delimiter: ',',
      escape: '"',
    })
    .to.stream(process.stdout, {
      columns: ['closedyesdate',
        'closed2014dollar',
        'closed2015dollar',
        'closed2014contributor',
        'closed2015contributor',
        'prospectyesdate',
        'prospect2014predictiondollar',
        'prospect2015predictiondollar',
        'prospectlikelihood',
        'prospect2014dollar',
        'prospect2014predictioncontributor',
        'prospect2015predictioncontributor',
      ]
    })
    .transform(function (row) {
      //row.name = row.closedyesdate + ' ' + row.closed2014dollar;
      console.log('\n\n-------------');
      console.log(' ');
      // Dollars
      if (row.closedyesdate && row.closed2014dollar) {
        console.log("* Closed yes date and 2014 dollar");
        addToAmounts(row.closedyesdate, row.closed2014dollar, '2014dollar');
      }
      if (row.closedyesdate && row.closed2015dollar) {
        console.log("* Closed yes date and 2015 dollar");
        addToAmounts(row.closedyesdate, row.closed2015dollar, '2015dollar');
      }
      if (row.prospectyesdate && row.prospect2014predictiondollar) {
        console.log("* Prospect yes date and 2014 dollar");
        addToAmounts(row.prospectyesdate, row.prospect2014predictiondollar, '2014dollar');
      }
      if (row.prospectyesdate && row.prospect2015predictiondollar) {
        console.log("* Prospect yes date and 2015 dollar");
        addToAmounts(row.prospectyesdate, row.prospect2015predictiondollar, '2015dollar');
      }
      // Contributors
      if (row.closedyesdate && row.closed2014contributor) {
        console.log("* Closed yes date and 2014 contributor");
        addToPeople(row.closedyesdate, row.closed2014contributor, '2014people');
      }
      if (row.closedyesdate && row.closed2015contributor) {
        console.log("* Closed yes date and 2015 contributor");
        addToPeople(row.closedyesdate, row.closed2015contributor, '2015people');
      }
      if (row.prospectyesdate && row.prospect2014predictioncontributor) {
        console.log("* Prospect yes date and 2014 contributor");
        addToPeople(row.prospectyesdate, row.prospect2014predictioncontributor, '2014people');
      }
      if (row.prospectyesdate && row.prospect2015predictioncontributor) {
        console.log("* Prospect yes date and 2015 contributor");
        addToPeople(row.prospectyesdate, row.prospect2015predictioncontributor, '2015people');
      }
      console.log(' ');
      console.log('Raw row:');
      return row;
    })
    .on('end', function (count) {
      // when writing to a file, use the 'close' event
      // the 'end' event may fire before the file has been written
      console.log('Number of lines: ' + count);
      console.log('AMOUNTS TO SAVE');
      console.log(amountsToSave);
      console.log('PEOPLE TO SAVE');
      console.log(allPeopleToSave);
      console.log('============');

      async.parallel([
        function(callback){
          if (amountsToSave.length > 0) {
            saveAmounts(amountsToSave, function savedAmounts(err, res) {
              if (err) {
                console.log(err);
              }
              console.log('Amounts saved.');
              callback(null);
            });
          }
        },
        function(callback){
          if (allPeopleToSave.length > 0) {
            savePeopleCounts(allPeopleToSave, function savedCounts(err, res) {
              if (err) {
                console.log(err);
              }
              console.log('Counts saved.');
              callback(null);
            });
          }
        }
      ],
      function(err, results){
        callback(err);
      });


    })
    .on('error', function (error) {
      console.log(error.message);
    });
}

function importMainGauntlet (callback) {
  // get the latest from Google
    request.get('https://docs.google.com/spreadsheet/pub?key=0AvbQej-RMUQMdDFROXprcjNSVlQyV3hLOXRueWM1Qmc&single=true&gid=25&output=csv',
      function (err, res, body) {
        if (!err && res.statusCode === 200) {
          var csv = body;
          processCSV(csv, function processedCSV(err) {
            if (err) {
              console.log(err);
              callback(err);
            }
            callback(null);
          });
        } else {
          console.log("Error fetching Google Doc");
          callback(null);
        }
      }
    );
}

importMainGauntlet(function importedMainGauntle(err) {
  if (err) {
    console.log(err);
  }
  console.log('IMPORTED MAIN GAUNTLET');
});
