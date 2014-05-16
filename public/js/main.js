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
function draw(data, targetSelector, targetLine, year) {
  var NUMBER_OF_THINGS = 3;
  var TARGET = targetLine;
  var chart = d3.select(targetSelector);

  // utitlity vars
  var now = new Date();
  var lastMonth = new Date();
  lastMonth.setDate(now.getDate()-31);

  // Graph settings
  var Y_SCALE_2_MAX_DEFAULT = 10000;
  var Y_SCALE_MAX_DEFAULT = TARGET * 1.25;
  var TARGET_25_percent = Math.round(TARGET * 0.25),
      TARGET_50_percent = Math.round(TARGET * 0.5),
      TARGET_75_percent = Math.round(TARGET * 0.75);

  var margin = {top: 20, right: 80, bottom: 45, left: 80};
      margin.vertical = margin.top + margin.bottom;
      margin.horizontal = margin.left + margin.right;

  var width = 1200 - margin.horizontal,
      height = 600 - margin.vertical;

  var VIEWBOX = "0 0 " + (width + margin.horizontal) + " " + (height + margin.vertical);

  var TICK_VALUES = [TARGET_25_percent, TARGET_50_percent, TARGET_75_percent, TARGET, Y_SCALE_MAX_DEFAULT];

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
   * Draw a line
   */
  function drawALine (lineNumber, fieldName, scale_to_use, year) {
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
      .append("circle")
      .attr("class", function (d) {
        if (new Date(d.monthCommencing) > now) {
          return cssClass + " future-date";
        } else {
          return cssClass;
        }
      });

    chart.selectAll("." + cssClass)
      .attr("cx", function (d) { return x_scale(
          dateStringToMonthName(d.monthCommencing)
        ) + halfMonth; })
      .attr("cy", function (d) { return scale_to_use(d[fieldName]); })
      .attr("r", function (d) {
        return 2.0;
      });
  }

  /**
   * Draw a reference line
   */
  function drawAReferenceLine (scale_to_use, value, cssClass) {
    chart
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", scale_to_use(value))
    .attr("y2", scale_to_use(value))
    .attr("class", "target " + cssClass);
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

  // Y SCALE RIGHT (Contributors)
  var y_scale_2_max = Y_SCALE_2_MAX_DEFAULT;
  var extent_contributors = d3.extent(data, function (d) { return d.peopleRunningTotal; });
  if (extent_contributors[1] > y_scale_2_max) {
    y_scale_2_max = extent_contributors[1];
  }

  var y_scale_2 = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_2_max]);

  // X SCALE ORDINAL
  var x_scale = d3.scale.ordinal()
    .domain(MONTH_NAMES)
    .rangeBands([margin.left, margin.left + width],0.1,0.1)
    ;

  // TOOL TIP
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 0])
  .html(function(d) {
    return "Grants:<br/>" +
          "<span style='color:#FFF;'>$" + $.number(d.dollarRunningTotal) + "</span> Total<br />" +
          "<span style='color:#FFF;'>$" + $.number(d.dollarNew) + "</span> New<br /><br />" +
          "Potential Contributors:<br/>" +
          "<span style='color:#FECB33;'>" + $.number(d.peopleRunningTotal) + "</span> Total<br />" +
          "<span style='color:#FECB33;'>" + $.number(d.peopleNew) + "</span> New<br /><br />";
  });

  chart.call(tip);

  // Re-usable hatch pattern - Dollars (white)
  // .attr('fill', 'url(#patternHatchDollars)');
  chart
  .append('defs')
  .append('pattern')
    .attr('id', 'patternHatchDollars')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 2)
  .append('rect')
    .attr('fill', '#FFF')
    .attr('width', 4)
    .attr('height', 1)
    .attr('opacity', 0.5);

  // Re-usable hatch pattern - Contributors (orange)
  // .attr('fill', 'url(#patternHatchPeople)');
  chart
  .append('defs')
  .append('pattern')
    .attr('id', 'patternHatchPeople')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 2)
  .append('rect')
    .attr('fill', '#FECB33')
    .attr('width', 4)
    .attr('height', 1)
    .attr('opacity', 0.5);

  /**
   * REFERENCE LINES
   */
  drawAReferenceLine(y_scale, TARGET_25_percent, 'milestone');
  drawAReferenceLine(y_scale, TARGET_50_percent, 'milestone');
  drawAReferenceLine(y_scale, TARGET_75_percent, 'milestone');
  drawAReferenceLine(y_scale, TARGET, 'goal');

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
      .attr("class", function (d) {
        if (new Date(d.monthCommencing) > now) {
          return "info-area future-date";
        } else {
          return "info-area";
        }
      })
      .attr("y",          function (d) { return margin.top; })
      .attr("height",     function (d) { return height; })
      .attr("width", monthWidth )
      .on("mouseover", function(d, i) {
        d3.select(this).style("opacity", 0.1);
        tip.show(d);
        })
      .on("mouseout", function(d, i) {
        d3.select(this).style("opacity", 0);
        tip.hide(d);
      });

  // Position these elements on the X axis using their date value
  chart.selectAll(".info-area")
    .attr("x", function (d) { return x_scale(
        dateStringToMonthName(d.monthCommencing)
      ); });

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
  drawBars(1, 2014, 'dollarNew', 'patternHatchDollars', y_scale);
  drawBars(2, 2014, 'peopleNew', 'patternHatchPeople', y_scale_2);
  drawBars(3, 2015, 'dollarNew', 'patternHatchDollars', y_scale);


  /**
   * RUNNING TOTALS - LINES
   */
  drawALine(1, "dollarRunningTotal", y_scale, 2014);
  drawALine(1, "dollarRunningTotal", y_scale, 2015);
  drawALine(2, "peopleRunningTotal", y_scale_2, 2014);


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
  var y_axis = d3.svg.axis()
                .scale(y_scale)
                .orient("left")
                .tickValues(TICK_VALUES)
                .tickFormat(function (d) {
                  var format_number = d3.format(["$", ""]);
                  return format_number(d);
                });
  chart
  .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ", 0 )")
  .call(y_axis);

  // Y-AXIS RIGHT (contributor scale)
  var y_axis_2 = d3.svg.axis()
                .scale(y_scale_2)
                .orient("right");
  chart
  .append("g")
    .attr("class", "y axis y2")
    .attr("transform", "translate(" + (width + margin.left) + ", 0 )")
  .call(y_axis_2);

  resize_charts();
}

// Draw the D3 chart
d3.json(GRAPH_DATA_ALL, function (data) {
  draw(data, '#chartAll', 7000000, 2015);
});
