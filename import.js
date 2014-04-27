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
          callback();
        }
      });
    }
  ], function (err, result) {
    console.log("Amounds Cleared and Latest Saved");
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
  });
}

// PROCESSING
function processCSV(fetchecCSV) {
  var amountsToSave = [];
  var allPeopleToSave = [];

  function addToAmounts(date, amount) {
    amount = util.toInt(amount);
    if (util.isValidDate(date) && (amount > 0)) {
      var amountToSave = {
        'yesdate': util.dateToISOtring(new Date(date)),
        '2014dollar': amount
      };
      console.log(amountToSave);
      amountsToSave.push(amountToSave);
    }
  }

  function addToPeople(date, count) {
    count = util.toInt(count);
    if (util.isValidDate(date) && (count > 0)) {
      var peopleToSave = {
        'yesdate': util.dateToISOtring(new Date(date)),
        '2014people': count
      };
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
        'closed2014contributor',
        'prospectyesdate',
        'prospect2014predictiondollar',
        'prospectlikelihood',
        'prospect2014dollar',
        'prospect2014predictioncontributor'
      ]
    })
    .transform(function (row) {
      //row.name = row.closedyesdate + ' ' + row.closed2014dollar;
      console.log('\n\n=================');
      console.log(' ');
      // Dollars
      if (row.closedyesdate && row.closed2014dollar) {
        console.log("* Closed yes date and dollar");
        addToAmounts(row.closedyesdate, row.closed2014dollar);
      }
      if (row.prospectyesdate && row.prospect2014predictiondollar) {
        console.log("* Prospect yes date and dollar");
        console.log("TEST",row.prospect2014predictiondollar);
        addToAmounts(row.prospectyesdate, row.prospect2014predictiondollar);
      }
      // Contributors
      if (row.closedyesdate && row.closed2014contributor) {
        console.log("* Closed yes date and contributor");
        addToPeople(row.closedyesdate, row.closed2014contributor);
      }
      if (row.prospectyesdate && row.prospect2014predictioncontributor) {
        console.log("* Prospect yes date and contributor");
        addToPeople(row.prospectyesdate, row.prospect2014predictioncontributor);
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

      if (amountsToSave.length > 0) {
        saveAmounts(amountsToSave, function savedAmounts(err, res) {
          if (err) {
            console.log(err);
          }
          console.log('AMOUNTS SAVED!!!');
        });
      }

      if (allPeopleToSave.length > 0) {
        savePeopleCounts(allPeopleToSave, function savedCounts(err, res) {
          if (err) {
            console.log(err);
          }
          console.log('COUNTS SAVED!!!');
        });
      }

    })
    .on('error', function (error) {
      console.log(error.message);
    });
}

function runImport () {
  // get the latest from Google
    request.get('https://docs.google.com/spreadsheet/pub?key=0AvbQej-RMUQMdDFROXprcjNSVlQyV3hLOXRueWM1Qmc&single=true&gid=25&output=csv',
      function (err, res, body) {
        if (!err && res.statusCode === 200) {
          var csv = body;
          processCSV(csv);
        } else {
          console.log("Error fetching Google Doc");
        }
      }
    );
}

runImport();
