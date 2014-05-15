var GRAPH_DATA_2014 = "/api/2014";
var GRAPH_DATA_2015 = "/api/2015";

/**
 * RESPONSIVE
 * Make the SVG charts scale with responsive container divs
 */
var chart1 = $("#chart1"),
    aspect1 = chart1.width() / chart1.height(),
    container1 = chart1.parent();

var chart2 = $("#chart2"),
    aspect2 = chart2.width() / chart2.height(),
    container2 = chart2.parent();

function resize_charts () {
  var targetWidth1 = container1.width();
  chart1.attr("width", targetWidth1);
  chart1.attr("height", Math.round(targetWidth1 / aspect1));

  var targetWidth2 = container2.width();
  chart2.attr("width", targetWidth2);
  chart2.attr("height", Math.round(targetWidth2 / aspect2));
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
  var chart = d3.select(targetSelector);
  var TARGET = targetLine;

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
  var extent_contributors = d3.extent(data, function (d) { return d.contributorRunningTotal; });
  if (extent_contributors[1] > y_scale_2_max) {
    y_scale_2_max = extent_contributors[1];
  }

  var y_scale_2 = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_2_max]);

  // X SCALE ORDINAL
  var x_scale = d3.scale.ordinal()
    .domain(MONTH_NAMES)
    .rangeBands([margin.left, margin.left + width])
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
          "<span style='color:#FECB33;'>" + $.number(d.contributorRunningTotal) + "</span> Total<br />" +
          "<span style='color:#FECB33;'>" + $.number(d.peopleNew) + "</span> New<br /><br />";
  });

  chart.call(tip);

  // Re-usable hatch pattern - Dollars (white)
  // .attr('fill', 'url(#diagonalHatchDollars)');
  chart
  .append('defs')
  .append('pattern')
    .attr('id', 'diagonalHatchDollars')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 2)
  .append('rect')
    .attr('fill', '#FFF')
    .attr('width', 4)
    .attr('height', 1)
    .attr('opacity', 0.5);

  // Re-usable hatch pattern - Contributors (orange)
  // .attr('fill', 'url(#diagonalHatchPeople)');
  chart
  .append('defs')
  .append('pattern')
    .attr('id', 'diagonalHatchPeople')
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
  chart
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_25_percent))
    .attr("y2", y_scale(TARGET_25_percent))
    .attr("class", "target milestone");

  chart
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_50_percent))
    .attr("y2", y_scale(TARGET_50_percent))
    .attr("class", "target milestone");

  chart
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_75_percent))
    .attr("y2", y_scale(TARGET_75_percent))
    .attr("class", "target milestone");

  chart
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET))
    .attr("y2", y_scale(TARGET))
    .attr("class", "target goal");

  /**
   * BARS
   */
  var barWidth = (width / data.length);
  var halfBar = (barWidth / 2);

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
      .attr("width", barWidth )
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
   * DOLLAR BARS
   */
  chart
    .selectAll("g")
    .data(data.filter(function (d) { return (d.dollarNew > 0); }))
    .enter()
    .append("rect")
      .attr("class", function (d) {
        if (new Date(d.monthCommencing) > now) {
          return "new-dollars future-date";
        } else {
          return "new-dollars past-date";
        }
      })
      .attr("y",          function (d) { return y_scale(d.dollarNew); })
      .attr("height",     function (d) { return height+margin.top - y_scale(d.dollarNew); })
      .attr("width", halfBar)
      .attr('fill', 'url(#diagonalHatchDollars)');

  // Position these elements on the X axis using their date value
  chart.selectAll(".new-dollars")
    .attr("x", function (d) { return x_scale(
        dateStringToMonthName(d.monthCommencing)
      ); });

  /**
   * CONTRIBUTOR BARS
   */
  chart
    .selectAll("g")
    .data(data.filter(function (d) { return (d.peopleNew > 0); }))
    .enter()
    .append("rect")
      .attr("class", function (d) {
        if (new Date(d.monthCommencing) > now) {
          return "new-contributors future-date";
        } else {
          return "new-contributors past-date";
        }
      })
      .attr("y",          function (d) { return y_scale_2(d.peopleNew); })
      .attr("height",     function (d) { return height+margin.top - y_scale_2(d.peopleNew); })
      .attr("width", halfBar)
      .attr('fill', 'url(#diagonalHatchPeople)');

  // Position these elements on the X axis using their date value
  chart.selectAll(".new-contributors")
    .attr("x", function (d) { return x_scale(
        //new Date(d.monthCommencing)
        dateStringToMonthName(d.monthCommencing)
      ) + halfBar; });

  /**
   * LINES & POINTS
   */

  /**
   * DOLLAR LINES
   */
  var line = d3.svg.line()
    .x(function (d) { return x_scale(
        dateStringToMonthName(d.monthCommencing)
      ) + halfBar; })
    .y(function (d) { return y_scale(d.dollarRunningTotal); });

  // line to date
  chart
    .append("path")
    .datum(data.filter(function (d) {
        return (d.dollarRunningTotal > 0 && (new Date(d.monthCommencing) < now));
      })
    )
    .attr("class", "line total-dollars ")
    .attr("d", line);

  // line future
  chart
    .append("path")
    .datum(data.filter(function (d) {
        return (d.dollarRunningTotal > 0 && (new Date(d.monthCommencing) > lastMonth));
      })
    )
    .attr("class", "line total-dollars future-date")
    .style("stroke-dasharray", ("2, 2"))
    .attr("d", line);

  // Points
  chart
    .selectAll("points")
    .data(data.filter(function (d) { return (d.dollarRunningTotal > 0); }))
    .enter()
    .append("circle")
    .attr("class", function (d) {
      if (new Date(d.monthCommencing) > now) {
        return "total-dollars future-date";
      } else {
        return "total-dollars";
      }
    });

  chart.selectAll(".total-dollars")
    .attr("cx", function (d) { return x_scale(
        dateStringToMonthName(d.monthCommencing)
      ) + halfBar; })
    .attr("cy", function (d) { return y_scale(d.dollarRunningTotal); })
    .attr("r", function (d) {
      return 2.0;
    });

  /**
   * CONTIRIBUTOR LINES
   */
  var line2 = d3.svg.line()
    .x(function (d) { return x_scale(
        dateStringToMonthName(d.monthCommencing)
      ) + halfBar; })
    .y(function (d) { return y_scale_2(d.contributorRunningTotal); });

  // line to date
  chart
    .append("path")
    .datum(data.filter(function (d) {
        return (d.contributorRunningTotal > 0 && (new Date(d.monthCommencing) < now));
      })
    )
    .attr("class", "line total-contributors ")
    .attr("d", line2);

  // line future
  chart
    .append("path")
    .datum(data.filter(function (d) {
        return (d.contributorRunningTotal > 0 && (new Date(d.monthCommencing) > lastMonth));
      })
    )
    .attr("class", "line total-contributors future-date")
    .style("stroke-dasharray", ("2, 2"))
    .attr("d", line2);

  // Points
  chart
    .selectAll("points")
    .data(data.filter(function (d) { return (d.contributorRunningTotal > 0); }))
    .enter()
    .append("circle")
    .attr("class", function (d) {
      if (new Date(d.monthCommencing) > now) {
        return "total-contributors future-date";
      } else {
        return "total-contributors";
      }
    });

  chart.selectAll(".total-contributors")
    .attr("cx", function (d) { return x_scale(
        dateStringToMonthName(d.monthCommencing)
      ) + halfBar; })
    .attr("cy", function (d) { return y_scale_2(d.contributorRunningTotal); })
    .attr("r", function (d) {
      return 2.0;
    });

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
d3.json(GRAPH_DATA_2014, function (data) {
  draw(data, '#chart1', 7000000, 2014);
});

d3.json(GRAPH_DATA_2015, function (data) {
  draw(data, '#chart2', 7000000, 2015);
});
