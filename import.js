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
      return callback(err);

    } else {

      connection.query('INSERT INTO amounts SET ?', amount, function (err, result) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function clearAmounts(src, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      return callback(err);

    } else {

      connection.query('DELETE FROM gauntlet.amounts WHERE src=?;', src, function (err, result) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function saveAmounts(amounts, src, callback) {
  async.waterfall([

    function (callback) {
      clearAmounts(src, function cleared() {
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
      return callback(err);

    } else {

      connection.query('INSERT INTO people SET ?', count, function (err, result) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function clearPeopleCounts(src, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      return callback(err);

    } else {

      connection.query('DELETE FROM gauntlet.people WHERE src=?;', src, function (err, result) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

function savePeopleCounts(counts, src, callback) {
  async.waterfall([

    function (callback) {
      clearPeopleCounts(src, function cleared() {
        console.log('People counts Cleared');
        callback(null);
      });
    },
    function (callback) {
      async.eachSeries(counts, savePeopleCount, function (err) {
        if (err) {
          console.log('Error saving a people count');
          console.log(err);
        } else {
          console.log('All people counts have been processed successfully');
          callback();
        }
      });
    }
  ], function (err, result) {
    console.log("Counts Cleared and Latest Saved");
    callback(null);
  });
}

// targets
function saveTargets(targets, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      return callback(err);

    } else {

      connection.query('INSERT INTO targets SET ?', targets, function (err, result) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

// targets
function clearTargets(callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {

    if (err) {
      console.error(err);
      return callback(err);

    } else {
      connection.query('TRUNCATE targets', function (err, result) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
}

// PROCESSING
function processGauntletMainCSV(fetchedCSV, callback) {
  var amountsToSave = [];
  var allPeopleToSave = [];
  var src = 'main';

  function addToAmounts(date, amount, field) {
    amount = util.toInt(amount);
    if (util.isValidDate(date) && (amount > 0)) {
      var amountToSave = {
        'yesdate': util.dateToISOtring(new Date(date)),
        'src': src
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
        'yesdate': util.dateToISOtring(new Date(date)),
        'src': src
      };
      peopleToSave[field] = count;
      console.log(peopleToSave);
      allPeopleToSave.push(peopleToSave);
    }
  }

  csv()
    .from.string(fetchedCSV, {
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
      // people
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

          function (callback) {
            if (amountsToSave.length > 0) {
              saveAmounts(amountsToSave, src, function savedAmounts(err, res) {
                if (err) {
                  console.log(err);
                }
                console.log('Amounts saved.');
                callback(null);
              });
            }
          },
          function (callback) {
            if (allPeopleToSave.length > 0) {
              savePeopleCounts(allPeopleToSave, src, function savedCounts(err, res) {
                if (err) {
                  console.log(err);
                }
                console.log('Counts saved.');
                callback(null);
              });
            }
          }
        ],
        function (err, results) {
          callback(err);
        });

    })
    .on('error', function (error) {
      console.log(error.message);
      callback(null);
    });
}

function processGauntletMakerPartyCSV(fetchedCSV, callback) {
  var allPeopleToSave = [];
  var src = 'makerparty';

  function addToPeople(date, count, field) {
    count = util.toInt(count);
    if (util.isValidDate(date) && (count > 0)) {
      var peopleToSave = {
        'yesdate': util.dateToISOtring(new Date(date)),
        'src': src
      };
      peopleToSave[field] = count;
      console.log(peopleToSave);
      allPeopleToSave.push(peopleToSave);
    }
  }

  csv()
    .from.string(fetchedCSV, {
      columns: true,
      delimiter: ',',
      escape: '"',
    })
    .to.stream(process.stdout, {
      columns: ['planneddate',
        'expectedaccounts',
        'actualaccounts',
      ]
    })
    .transform(function (row) {
      console.log('\n\n-------------');
      console.log(' ');
      if (row.planneddate && row.actualaccounts) {
        // if there are real results (acutal accounts), use those
        console.log("* Yes date and actual accounts");
        addToPeople(row.planneddate, row.actualaccounts, '2014people');
      } else if (row.planneddate && row.expectedaccounts) {
        // otherwise report on predictions
        console.log("* Yes date and predicted accounts");
        addToPeople(row.planneddate, row.expectedaccounts, '2014people');
      }
      console.log(' ');
      console.log('Raw row:');
      return row;
    })
    .on('end', function (count) {
      // when writing to a file, use the 'close' event
      // the 'end' event may fire before the file has been written
      console.log('Number of lines: ' + count);
      console.log('PEOPLE TO SAVE');
      console.log(allPeopleToSave);
      console.log('============');

      if (allPeopleToSave.length > 0) {
        savePeopleCounts(allPeopleToSave, src, function savedCounts(err, res) {

          if (err) {
            console.log(err);
            callback(err);
          } else {

            console.log('Maker Party Counts saved.');
            callback(null);

          }
        });
      } else {
        console.log('No data received in Maker Party Gauntlet');
        callback(null);
      }

    })
    .on('error', function (error) {
      console.log(error.message);
      callback(null);
    });
}

function processTargetsCSV(fetchedCSV, callback) {
  var targetsToSave = {};

  csv()
    .from.string(fetchedCSV, {
      columns: true,
      delimiter: ',',
      escape: '"',
    })
    .to.stream(process.stdout, {
      columns: ['targetdollars2014',
        'targetdollars2015',
        'targetaccounts2014',
      ]
    })
    .transform(function (row) {
      console.log('\n\n-------------');
      console.log(' ');
      if (row.targetdollars2014) {
        // some data has loaded
        targetsToSave = {
          'targetdollars2014': util.toInt(row.targetdollars2014),
          'targetdollars2015': util.toInt(row.targetdollars2015),
          'targetaccounts2014': util.toInt(row.targetaccounts2014)
        };
      }
      return row;
    })
    .on('end', function (count) {
      // when writing to a file, use the 'close' event
      // the 'end' event may fire before the file has been written
      console.log('targetsToSave');
      console.log(targetsToSave);
      console.log('============');

      if (targetsToSave.targetdollars2014 > 0) {

        async.series([

            function (callback) {
              clearTargets(function clearedTargets(err, res) {
                if (err) {
                  console.log(err);
                  return callback(err);
                } else {

                  console.log('Targets Cleared.');
                  callback(null);
                }
              });
            },
            function (callback) {
              saveTargets(targetsToSave, function savedTargets(err, res) {
                if (err) {
                  console.log(err);
                  return callback(err);
                } else {

                  console.log('Targets saved.');
                  callback(null);
                }
              });
            }
          ],
          function (err, results) {
            callback(null);
          });

      } else {
        console.log('No data received in Targets');
        callback(null);
      }

    })
    .on('error', function (error) {
      console.log(error.message);
      callback(null);
    });
}

function importMainGauntlet(callback) {
  // get the latest from Google
  request.get('https://docs.google.com/spreadsheet/pub?key=0AvbQej-RMUQMdDFROXprcjNSVlQyV3hLOXRueWM1Qmc&single=true&gid=25&output=csv',
    function (err, res, body) {
      if (!err && res.statusCode === 200) {
        var csv = body;
        processGauntletMainCSV(csv, function processedCSV(err) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          callback(null);
        });
      } else {
        console.log("Error fetching Google Doc (Gauntlet Main)");
        callback(null);
      }
    }
  );
}

function importMakerPartyGauntlet(callback) {
  // get the latest from Google
  request.get('https://docs.google.com/spreadsheets/d/1R76-cRZj1HSLLtyLMAEURdxPkk-qXK9lgJLnSxUUtao/export?format=csv&id=1R76-cRZj1HSLLtyLMAEURdxPkk-qXK9lgJLnSxUUtao&gid=52169416',
    function (err, res, body) {
      if (!err && res.statusCode === 200) {
        var csv = body;
        processGauntletMakerPartyCSV(csv, function processedCSV(err) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          callback(null);
        });
      } else {
        console.log("Error fetching Google Doc (Gauntlet Maker Party)");
        callback(null);
      }
    }
  );
}

function importTargets(callback) {
  // get the latest from Google
  request.get('https://docs.google.com/spreadsheets/d/1ltIwmMz1oqGAXujCuYUQPNDeZZzQXDm7NCXNJDHhHOA/export?format=csv&id=1ltIwmMz1oqGAXujCuYUQPNDeZZzQXDm7NCXNJDHhHOA&gid=0',
    function (err, res, body) {
      if (!err && res.statusCode === 200) {
        var csv = body;
        processTargetsCSV(csv, function processedCSV(err) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          callback(null);
        });
      } else {
        console.log("Error fetching Google Doc (Targets)");
        callback(null);
      }
    }
  );
}

function importAll(callback) {
  async.series({
      gauntletMain: function (callback) {
        importMainGauntlet(function importedMainGauntle(err) {
          if (err) {
            console.log(err);
          }
          console.log('IMPORTED MAIN GAUNTLET');
          callback(null, null);
        });
      },
      gauntletMakerParty: function (callback) {
        importMakerPartyGauntlet(function importedMakerPartyGauntle(err) {
          if (err) {
            console.log(err);
          }
          console.log('IMPORTED MAKER PARTY GAUNTLET');
          callback(null, null);
        });
      },
      targets: function (callback) {
        importTargets(function importedTargets(err) {
          if (err) {
            console.log(err);
          }
          console.log('IMPORTED TARGETS');
          callback(null, null);
        });
      }
    },
    // optional callback
    function (err, results) {
      console.log('done');
      callback(null);
    });
}

module.exports = {
  importAll: importAll
};
