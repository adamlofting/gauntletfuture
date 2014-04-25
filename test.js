var data      = require("./lib/data");
data.getDashBoardData(function gotDashBoardData (err, result) {
  console.log(result);
});
