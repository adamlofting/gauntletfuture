var GRAPH_DATA_ALL = "/api/all";

/**
 * RESPONSIVE
 * Make the SVG charts scale with responsive container divs
 */
var chartAll = $("#chartAll"),
    aspectAll = chartAll.width() / chartAll.height(),
    containerAll = chartAll.parent();

function resize_charts () {
  var targetWidthAll = containerAll.width();
  chartAll.attr("width", targetWidthAll);
  chartAll.attr("height", Math.round(targetWidthAll / aspectAll));
}

$(window).on("resize", function() {
    resize_charts();
}).trigger("resize");

// For X Axis ordinal scale
var MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function dateStringToMonthName(str) {
  var date = new Date(str);
  return MONTH_NAMES[date.getMonth()];
}


/**
 *
 * DRAW A GRAPH
 *
 */
function draw(data, targetSelector) {
  var NUMBER_OF_THINGS = 3;
  var TARGET_1 = 7000000;
  var TARGET_2 = 7500000;
  var TARGET_3 = 150000;

  var chart = d3.select(targetSelector);

  // utitlity vars
  var now = new Date();
  var lastMonth = new Date();
  lastMonth.setDate(now.getDate()-31);

  // Color (from colorBrewer palletes)
  var color_1 = "#a6cee3";
  var color_2 = "#1f78b4";
  var color_3 = "#b2df8a";

  // Graph settings
  var Y_SCALE_2_MAX_DEFAULT = Math.round(TARGET_3 * 1.1);
  var Y_SCALE_MAX_DEFAULT = Math.round(TARGET_1 * 1.25);
  var TARGET_25_percent = Math.round(TARGET_1 * 0.25),
      TARGET_50_percent = Math.round(TARGET_1 * 0.5),
      TARGET_75_percent = Math.round(TARGET_1 * 0.75);

  var margin = {top: 20, right: 100, bottom: 45, left: 100};
      margin.vertical = margin.top + margin.bottom;
      margin.horizontal = margin.left + margin.right;

  var width = 1200 - margin.horizontal,
      height = 600 - margin.vertical;

  var VIEWBOX = "0 0 " + (width + margin.horizontal) + " " + (height + margin.vertical);

  var TICK_VALUES = [TARGET_25_percent, TARGET_50_percent, TARGET_75_percent, TARGET_1, Y_SCALE_MAX_DEFAULT];
  var SPACER = Math.round(width / 12);

  /**
   * CONTATINER
   */
  chart
    .attr("width", width + margin.horizontal)
    .attr("height", height + margin.vertical)
    .attr("viewBox", VIEWBOX); // this is used for SVG proportional resizing

  /**
   * FUNCTIONS
   */

  /**
   * Add a label (to use with reference line and actual lines)
   */
  function addLabel (cssClass, extraCSSStyle, pos, scale_to_use, description, value, postfix) {
      var labelX, textAnchor, nudge;

      if (pos === 'right') {
        labelX = margin.left + width - SPACER + (SPACER/12);
        textAnchor = "start";
        nudge = 3;
      }

      if (pos === 'left') {
        labelX = margin.left + SPACER - (SPACER/12);
        textAnchor = "end";
        nudge = 5;
      }

      var format = d3.format("0,000");

      chart
      .append("text")
      .attr("class", "target-label " + cssClass + " " + extraCSSStyle)
      .attr("text-anchor", textAnchor)
      .attr("x", labelX)
      .attr("y", scale_to_use(value) + nudge)
      .attr("transform", "rotate(0) translate(0,0)")
      .text(description + format(value) + postfix);
    }

  /**
   * Draw a line
   */
  function drawALine (lineNumber, fieldName, scale_to_use, year, icon) {
    var cssClass = "line-" + lineNumber;

    // map the line
    var line = d3.svg.line()
      .x(function (d) { return x_scale(
          dateStringToMonthName(d.monthCommencing)
        ) + halfMonth; })
      .y(function (d) { return scale_to_use(d[fieldName]); });

    // TO-DATE: show segment of the full line
    chart
      .append("path")
      .datum(data.filter(function (d) {
          var date = new Date(d.monthCommencing);
          return ((d[fieldName] > 0) &&
                  (date < now) &&
                  (date.getUTCFullYear() === year) // filter on year
                  );
        })
      )
      .attr("class", "line " + cssClass)
      .attr("d", line);

    // FUTURE: show segment of the full line
    chart
      .append("path")
      .datum(data.filter(function (d) {
          var date = new Date(d.monthCommencing);
          return ((d[fieldName] > 0) &&
                  (date > lastMonth) &&
                  (date.getUTCFullYear() === year) // filter on year
                  );
        })
      )
      .attr("class", "line future-date " + cssClass)
      .style("stroke-dasharray", ("2, 2"))
      .attr("d", line);

    // Points
    chart
      .selectAll("points")
      .data(data.filter(function (d) {
          var date = new Date(d.monthCommencing);
          return ((d[fieldName] > 0) &&
                  (date.getUTCFullYear() === year)
                  );
        }))
      .enter()
      //.append("circle")
      .append('text')
      .attr('font-family', 'FontAwesome')
      .attr('font-size', '0.9em')
      .text(function(d) { return icon; })
      .attr("transform", function (d) {
          return "translate(" + (x_scale(dateStringToMonthName(d.monthCommencing)) + halfMonth) + "," +
            (scale_to_use(d[fieldName]) + 3) + ")";
          }
        )
      .attr("class", cssClass);

      chart
      .selectAll("points")
      .data(data.filter(function (d) {
          var date = new Date(d.monthCommencing);
          // get the value for December of this year
          if ((date.getMonth() === 11) && (date.getUTCFullYear() === year)) {
            addLabel(cssClass, "front-version", "right", scale_to_use, "", d[fieldName], " predicted");
          }
          return;
        }));
  }

  /**
   * Draw a reference line
   */
  function drawAReferenceLine (scale_to_use, value, cssClass, pos, unit, year) {

    var x1 = margin.left + SPACER;
    var x2 = margin.left + width - SPACER;
    var description = year + " target " + unit;

    chart
      .append("line")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", scale_to_use(value))
      .attr("y2", scale_to_use(value))
      .attr("class", "target " + cssClass);

    // addLabel(cssClass, "shadow-version", pos, scale_to_use, description, value, "");
    // (useful if the text sits over another line)
    addLabel(cssClass, "front-version", pos, scale_to_use, description, value, "");
  }

  /**
   * SCALES
   */

  // Y SCALE LEFT (Dollars)
  var y_scale_max = Y_SCALE_MAX_DEFAULT;
  var extent_dollars = d3.extent(data, function (d) { return d.dollarRunningTotal; });
  if (extent_dollars[1] > y_scale_max) {
    y_scale_max = extent_dollars[1];
  }

  var y_scale = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_max]);

  // Y SCALE RIGHT (people)
  var y_scale_2_max = Y_SCALE_2_MAX_DEFAULT;
  var extent_people = d3.extent(data, function (d) { return d.peopleRunningTotal; });
  if (extent_people[1] > y_scale_2_max) {
    y_scale_2_max = extent_people[1];
  }

  var y_scale_2 = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_2_max]);

  // X SCALE ORDINAL
  var x_scale = d3.scale.ordinal()
    .domain(MONTH_NAMES)
    .rangeBands([margin.left, margin.left + width],0.1,0.8)
    ;

  // // TOOL TIP
  // var tip = d3.tip()
  // .attr('class', 'd3-tip')
  // .offset([0, 0])
  // .html(function(d) {
  //   return "Grants:<br/>" +
  //         "<span style='color:#FFF;'>$" + $.number(d.dollarRunningTotal) + "</span> Total<br />" +
  //         "<span style='color:#FFF;'>$" + $.number(d.dollarNew) + "</span> New<br /><br />" +
  //         "Potential Webmaker Accounts:<br/>" +
  //         "<span style='color:"+color_3+";'>" + $.number(d.peopleRunningTotal) + "</span> Total<br />" +
  //         "<span style='color:"+color_3+";'>" + $.number(d.peopleNew) + "</span> New<br /><br />";
  // });

  // chart.call(tip);

  /**
   * Patterns
   */
  function createPattern (name, color) {
    chart
    .append('defs')
    .append('pattern')
      .attr('id', name)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 1)
    .append('rect')
      .attr('fill', color)
      .attr('width', 4)
      .attr('height', 1);
      //.attr('opacity', 0.5);
  }

  createPattern('pattern-1', color_1);
  createPattern('pattern-2', color_2);
  createPattern('pattern-3', color_3);

  /**
   * REFERENCE LINES
   */
  drawAReferenceLine(y_scale, TARGET_2, 'goal goal-2', 'left', '$', '2015');
  drawAReferenceLine(y_scale, TARGET_1, 'goal goal-1', 'left', '$', '2014');
  drawAReferenceLine(y_scale_2, TARGET_3, 'goal goal-3', 'left', '', '2014');

  /**
   * BARS
   */
  var monthWidth = x_scale.rangeBand();
  var partMonth = (monthWidth / NUMBER_OF_THINGS);
  var halfMonth = (monthWidth / 2);

  /**
   * HOVER INFO BARS
   */
  chart
    .selectAll("g")
    .data(data)
    .enter()
    .append("rect")
      .attr("class", "info-area")
      .attr("y", function (d) { return margin.top; })
      .attr("x", function (d) {
          return x_scale(dateStringToMonthName(d.monthCommencing));
        })
      .attr("height", function (d) { return height; })
      .attr("width", monthWidth )
      .on("mouseover", function(d, i) {
        d3.select(this).style("opacity", 0.1);
        //tip.show(d);
        })
      .on("mouseout", function(d, i) {
        d3.select(this).style("opacity", 0);
        //tip.hide(d);
      });


  /**
   * Draw bars
   */
  function drawBars(position, year, fieldName, pattern, scale_to_use) {
    var cssClass = "bar-" + position;
    var multiplier = position - 1;

    chart
      .selectAll("g")
      .data(data.filter(function (d) {
          var date = new Date(d.monthCommencing);
          return ((d[fieldName] > 0) &&
                  (date.getUTCFullYear() === year) // filter to relevant year
                  );
        }))
      .enter()
      .append("rect")
        .attr("class", function (d) {
          if (new Date(d.monthCommencing) > now) {
            return cssClass + " future-date";
          } else {
            return cssClass + " past-date";
          }
        })
        .attr("y",          function (d) { return scale_to_use(d[fieldName]); })
        .attr("height",     function (d) { return height+margin.top - scale_to_use(d[fieldName]); })
        .attr("width", partMonth)
        .attr('fill', 'url(#' + pattern + ')');

    // Position these elements on the X axis using their date value
    chart.selectAll("." + cssClass)
      .attr("x", function (d) {
          return x_scale(dateStringToMonthName(d.monthCommencing)) + (multiplier * partMonth);
        });
  }

  /**
   * NEW - BARS
   */
  // drawBars(1, 2014, 'dollarNew', 'pattern-1', y_scale);
  // drawBars(2, 2015, 'dollarNew', 'pattern-2', y_scale);
  // drawBars(3, 2014, 'peopleNew', 'pattern-3', y_scale_2);

  /**
   * RUNNING TOTALS - LINES
   */
  drawALine(1, "dollarRunningTotal", y_scale, 2014, '\uf155');
  drawALine(2, "dollarRunningTotal", y_scale, 2015, '\uf155');
  drawALine(3, "peopleRunningTotal", y_scale_2, 2014, '\uf007');

  /**
   * AXIS
   */
  var x_axis  = d3.svg.axis()
                .scale(x_scale);

  chart
  .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height + margin.top) + ")")
    .call(x_axis)
  .selectAll("text") // rotate text
    .attr("y", 0)
    .attr("x", 0)
    .attr("dy", ".35em")
    .attr("transform", "rotate(0) translate(-13,20)")
    .style("text-anchor", "start");

  // Y-AXIS LEFT (dollar scale)
  // var y_axis = d3.svg.axis()
  //               .scale(y_scale)
  //               .orient("left")
  //               .tickValues(TICK_VALUES)
  //               .tickFormat(function (d) {
  //                 var format_number = d3.format(["$", ""]);
  //                 return format_number(d);
  //               });
  // chart
  // .append("g")
  //   .attr("class", "y axis y1")
  //   .attr("transform", "translate(" + margin.left + ", 0 )")
  // .call(y_axis);

  // label
  // chart.append("text")
  //   .attr("class", "label-1")
  //   .attr("text-anchor", "middle")
  //   .attr("x", 0)
  //   .attr("y", 0)
  //   .attr("transform", "rotate(270) translate(-" + (height/2) + "," + (margin.left/4) + ")")
  //   .text("$ Predicted income: 2014 and 2015");


  // Y-AXIS RIGHT (people scale)
  // var y_axis_2 = d3.svg.axis()
  //               .scale(y_scale_2)
  //               .orient("right");
  // chart
  // .append("g")
  //   .attr("class", "y axis y2")
  //   .attr("transform", "translate(" + (width + margin.left) + ", 0 )")
  // .call(y_axis_2);

  // label
  // chart.append("text")
  //   .attr("class", "label-3")
  //   .attr("text-anchor", "middle")
  //   .attr("x", 0)
  //   .attr("y", 0)
  //   .attr("transform", "rotate(270) translate(-" + (height/2) + "," + (width + margin.left + (margin.right/4*3)) + ")")
  //   .text("Predicted New Webmaker User Accounts");

  resize_charts();
}

// Draw the D3 chart
d3.json(GRAPH_DATA_ALL, function (data) {
  draw(data, '#chartAll');
});
