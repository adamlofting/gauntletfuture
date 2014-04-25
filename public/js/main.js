var GRAPH_DATA = "/api/2014";
var TARGET = 10000000;
var TARGET_2014 = 7000000;

// Graph settings
var Y_SCALE_2_MAX_DEFAULT = 10000;
var Y_SCALE_MAX_DEFAULT = TARGET * 1.25;
var TARGET_25_percent = Math.round(TARGET * 0.25),
    TARGET_50_percent = Math.round(TARGET * 0.5),
    TARGET_75_percent = Math.round(TARGET * 0.75);

var margin = {top: 20, right: 80, bottom: 45, left: 80};
  margin.vertical = margin.top + margin.bottom;
  margin.horizontal = margin.left + margin.right;

var width = 1000 - margin.horizontal,
    height = 600 - margin.vertical;

var VIEWBOX = "0 0 " + (width + margin.horizontal) + " " + (height + margin.vertical);

var TICK_VALUES = [TARGET_25_percent, TARGET_50_percent, TARGET_75_percent, TARGET, Y_SCALE_MAX_DEFAULT];

// CONTAINER
d3.select("#chart")
  .attr("width", width + margin.horizontal)
  .attr("height", height + margin.vertical)
  .attr("viewBox", VIEWBOX); // this is used for SVG proportional resizing

// Build the graph
function draw(data) {
  var now = new Date();

  // SCALE
  var y_scale_max = Y_SCALE_MAX_DEFAULT;
  var contributor_extent = d3.extent(data, function (d) { return d.dollarRunningTotal; });
  if (contributor_extent[1] > y_scale_max) {
    y_scale_max = contributor_extent[1];
  }

  var y_scale_2_max = Y_SCALE_2_MAX_DEFAULT;

  var y_scale = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_max]);

  var y_scale_2 = d3.scale.linear()
    .range([height + margin.top, margin.top])
    .domain([0,y_scale_2_max]);

  // var time_extent = d3.extent(data, function (d) { return new Date(d.monthCommencing); });
  // console.log(time_extent);
  // Hardcoded to Jan for now, as was stopping on 1st Dec otherwise
  var x_scale = d3.time.scale()
    .domain([ new Date ('2014-01-01T00:00:00.000Z'), new Date ('2015-01-01T00:00:00.000Z') ])
    .range([margin.left, margin.left + width]);

  // TOOL TIP
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([105, 0])
  .html(function(d) {
    return "Grants:<br/>" +
          "<span style='color:#FFF;'>$" + $.number(d.dollarRunningTotal) + "</span> Total<br />" +
          "<span style='color:#FFF;'>$" + $.number(d.dollarNew) + "</span> New<br /><br />" +
          "Potential Contributors:<br/>" +
          "<span style='color:#FECB33;'>" + $.number(d.contributorRunningTotal) + "</span> Total<br />" +
          "<span style='color:#FECB33;'>" + $.number(d.peopleNew) + "</span> New<br /><br />";
  });

  d3.select("#chart").call(tip);

  // REFERENCE LINES
  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_25_percent))
    .attr("y2", y_scale(TARGET_25_percent))
    .attr("class", "target milestone");

  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_50_percent))
    .attr("y2", y_scale(TARGET_50_percent))
    .attr("class", "target milestone");

  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_75_percent))
    .attr("y2", y_scale(TARGET_75_percent))
    .attr("class", "target milestone");

  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET))
    .attr("y2", y_scale(TARGET))
    .attr("class", "target milestone");

  // ANNUAL TARGET
  d3.select("#chart")
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", margin.left + width)
    .attr("y1", y_scale(TARGET_2014))
    .attr("y2", y_scale(TARGET_2014))
    .style("stroke-dasharray", ("3, 3"))
    .attr("class", "target target2014 milestone");

  // Bars
  var barWidth = width / data.length;
  var halfBar = (barWidth / 2) - 1;

  // HOVER BARS
  d3.select("#chart")
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
      .attr("width", barWidth - 1)
      .on("mouseover", function(d, i) {
        d3.select(this).style("opacity", 0.1);
        tip.show(d);
        })
      .on("mouseout", function(d, i) {
        d3.select(this).style("opacity", 0);
        tip.hide(d);
      });

  // Position these elements on the X axis using their date value
  d3.select("#chart").selectAll(".info-area")
    .attr("x", function (d) { return x_scale(new Date(d.monthCommencing)); });

  // NEW dollars
  d3.select("#chart")
    .selectAll("g")
    .data(data.filter(function (d) { return (d.dollarNew > 0); }))
    .enter()
    .append("rect")
      .attr("class", function (d) {
        if (new Date(d.monthCommencing) > now) {
          return "new-dollars future-date";
        } else {
          return "new-dollars";
        }
      })
      .attr("y",          function (d) { return y_scale(d.dollarNew); })
      .attr("height",     function (d) { return height+margin.top - y_scale(d.dollarNew); })
      .attr("width", halfBar - 1);

  // Position these elements on the X axis using their date value
  d3.select("#chart").selectAll(".new-dollars")
    .attr("x", function (d) { return x_scale(new Date(d.monthCommencing)); });

  // NEW contributors
  d3.select("#chart")
    .selectAll("g")
    .data(data.filter(function (d) { return (d.peopleNew > 0); }))
    .enter()
    .append("rect")
      .attr("class", function (d) {
        if (new Date(d.monthCommencing) > now) {
          return "new-contributors future-date";
        } else {
          return "new-contributors";
        }
      })
      .attr("y",          function (d) { return y_scale_2(d.peopleNew); })
      .attr("height",     function (d) { return height+margin.top - y_scale_2(d.peopleNew); })
      .attr("width", halfBar - 1);

  // Position these elements on the X axis using their date value
  d3.select("#chart").selectAll(".new-contributors")
    .attr("x", function (d) { return x_scale(new Date(d.monthCommencing)) + halfBar; });

  // Total dollars
  // Line
  var line = d3.svg.line()
    .x(function (d) { return x_scale(new Date(d.monthCommencing)) + halfBar/2; })
    .y(function (d) { return y_scale(d.dollarRunningTotal); });

  // line to date
  d3.select("#chart")
    .append("path")
    .datum(data.filter(function (d) {
        return (d.dollarRunningTotal > 0 && (new Date(d.monthCommencing) < now));
      })
    )
    .attr("class", "line total-dollars ")
    .attr("d", line);

  // line future
  d3.select("#chart")
    .append("path")
    .datum(data.filter(function (d) {
        return (d.dollarRunningTotal > 0 && (new Date(d.monthCommencing) > now));
      })
    )
    .attr("class", "line total-dollars future-date")
    .attr("d", line);

  // Points
  d3.select("#chart")
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

  d3.select("#chart").selectAll(".total-dollars")
    .attr("cx", function (d) { return x_scale(new Date(d.monthCommencing)) + halfBar/2; })
    .attr("cy", function (d) { return y_scale(d.dollarRunningTotal); })
    .attr("r", function (d) {
      return 2.0;
    });

  // Total Contributors
  // Line
  var line2 = d3.svg.line()
    .x(function (d) { return x_scale(new Date(d.monthCommencing)) + halfBar + (halfBar/2); })
    .y(function (d) { return y_scale_2(d.contributorRunningTotal); });

  // line to date
  d3.select("#chart")
    .append("path")
    .datum(data.filter(function (d) {
        return (d.contributorRunningTotal > 0 && (new Date(d.monthCommencing) < now));
      })
    )
    .attr("class", "line total-contributors ")
    .attr("d", line2);

  // line future
  d3.select("#chart")
    .append("path")
    .datum(data.filter(function (d) {
        return (d.contributorRunningTotal > 0 && (new Date(d.monthCommencing) > now));
      })
    )
    .attr("class", "line total-contributors future-date")
    .attr("d", line2);

  // Points
  d3.select("#chart")
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

  d3.select("#chart").selectAll(".total-contributors")
    .attr("cx", function (d) { return x_scale(new Date(d.monthCommencing)) + halfBar + (halfBar/2); })
    .attr("cy", function (d) { return y_scale_2(d.contributorRunningTotal); })
    .attr("r", function (d) {
      return 2.0;
    });

  // AXIS
  var x_axis  = d3.svg.axis()
                .scale(x_scale)
                .ticks(d3.time.months, 1)
                .tickFormat(function (d) {
                  var format_month = d3.time.format('%b'); // short name month e.g. Feb
                  var format_year = d3.time.format('%Y');
                  var label = format_month(d);//.toUpperCase();
                  if (label === "Jan") {
                    label = format_year(d);
                  }
                  return label;
                });
  d3.select("#chart")
  .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height + margin.top) + ")")
    .call(x_axis)
  .selectAll("text") // rotate text
    .attr("y", 0)
    .attr("x", 0)
    .attr("dy", ".35em")
    .attr("transform", "rotate(270) translate(-35,0)")
    .style("text-anchor", "start");

  var y_axis = d3.svg.axis()
                .scale(y_scale)
                .orient("left")
                .tickValues(TICK_VALUES)
                .tickFormat(function (d) {
                  var format_number = d3.format(["$", ""]);
                  return format_number(d);
                });
  d3.select("#chart")
  .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + ", 0 )")
  .call(y_axis);

  var y_axis_2 = d3.svg.axis()
                .scale(y_scale_2)
                .orient("right");
  d3.select("#chart")
  .append("g")
    .attr("class", "y axis y2")
    .attr("transform", "translate(" + (width + margin.left) + ", 0 )")
  .call(y_axis_2);
}

// Draw the D3 chart
d3.json(GRAPH_DATA, draw);

// Make the chart responsive
var chart = $("#chart"),
    aspect = chart.width() / chart.height(),
    container = chart.parent();

function resize_chart () {
  var targetWidth = container.width();
  chart.attr("width", targetWidth);
  chart.attr("height", Math.round(targetWidth / aspect));
}

$(window).on("resize", function() {
    resize_chart();
}).trigger("resize");


