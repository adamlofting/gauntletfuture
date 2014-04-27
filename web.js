var data      = require("./lib/data");
var express = require("express");
var app = express();


app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.get('/api/2014', function(req, res) {
  data.getDashBoardData('2014', function getDashBoardData (err, result) {
    res.json(result);
  });
});

app.get('/api/2015', function(req, res) {
  data.getDashBoardData('2015', function getDashBoardData (err, result) {
    res.json(result);
  });
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log("Listening on " + port);
});
