var data      = require("./lib/data");
var express = require("express");
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/api/2014', function(req, res) {
  data.getDashBoardData(function getDashBoardData (err, result) {
    res.json(result);
  });
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log("Listening on " + port);
});
