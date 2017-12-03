d3.select(window).on('load', init);
var raw_data;
var year_domain;
var temperature_domain;

var year2color;

var year2decade;

function init() {
    d3.csv(
        'data.csv',
        function(error, data) {
            if (error) throw error;
            raw_data = data.map(function(row) {
                var new_row = {};
                for (var key in row) {
                    var val = parseFloat(row[key]);
                    if (key != "YEAR" && val > 900.0)
                    {
                        new_row[key] = NaN;
                    }
                    else
                    {
                        new_row[key] = val;
                    }
                }
                return new_row;
            });


            selectMonths(data);
            updateGrouping();
            updateVisualisations();
        }
    );
}


function updateVisualisations(){

    //De valgte måneder udtrækkes fra data her
    var selected_data = selectMonths(raw_data)

    //Udtrukket data sendes til visualiseringsfunktionerne
    vis1(selected_data);
    vis2(selected_data);
}

function vis1(data)
{
    var canvas = d3.select('#vis1');

    var margin = {top: 20, right: 5, bottom: 20, left: 20};


    var height = canvas.node().getBoundingClientRect().height;
    var width = canvas.node().getBoundingClientRect().width;


    var xScale = d3.scaleLinear()
        .domain(year_domain)
        .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
        .domain(temperature_domain)
        .range([height - margin.top, margin.bottom]);

    console.log(temperature_domain);


    //C/P - https://bl.ocks.org/HarryStevens/be559bed98d662f69e68fc8a7e0ad097

    var xAxis = d3.axisBottom(xScale);

    var yAxis = d3.axisRight(yScale);
    //C/P - End

    canvas
        .selectAll("g")
        .remove();

    canvas
        .selectAll("circle")
        .remove();

    canvas
        .selectAll("line")
        .remove();

    canvas
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", "2px")
        .attr("cx", function(d){
            return ""+xScale(d["YEAR"])+"px";
        })
        .attr("cy", function(d){
            return ""+yScale(d["VAL"])+"px";
        })

    var lreg = linearRegression(data);
    console.log(lreg.a);
    console.log(lreg.b)
    var x1 = year_domain[0];
    var x2 = year_domain[1]
    var y1 = lreg.f(x1);
    var y2 = lreg.f(x2);

    canvas.append("line")
        .attr("x1", xScale(x1))
        .attr("x2", xScale(x2))
        .attr("y1", yScale(y1))
        .attr("y2", yScale(y2))
        .style("stroke", "red")
        .style("stroke-width", "2")

    //C/P - https://bl.ocks.org/HarryStevens/be559bed98d662f69e68fc8a7e0ad097
    canvas.append("g")
        .attr("transform", "translate(0,0)")
        .call(xAxis)

    canvas.append("g")
        .attr("transform", "translate(0,0)")
        .call(yAxis);
    //C/P - End
}

//Visualisering 2
function vis2(data)
{
    data.sort(function(a, b){ return b["VAL"] - a["VAL"];});

    d3.select('#vis2')
        .selectAll("div")
        .remove();

    d3.select('#vis2')
        .selectAll("div")
        .data(data)
        .enter()
        .append("div")
        .html(function(d){return d["YEAR"];})
        .style("background-color", function(d){return year2color(d["YEAR"]);})
        //.style("background-color", "white")
        .attr("class", "vis2row")
        .exit()
        .remove()
}

function updateGrouping()
{
    var groupsize = document.getElementById("groupsizeslider").value;
    var num_groups = Math.ceil((year_domain[1] - year_domain[0]) / groupsize)

    var groups = d3.range(year_domain[0], year_domain[1], groupsize);

    var unit_groups = d3.range(0, 1, 1 / (num_groups+1));


    // var year2color = d3.scaleQuantize()
    //     .domain([groups[0], groups[groups.length-1]+10])
    //     .range(unit_groups.map(function(d){ return d3.interpolateYlGnBu(d)}));

    year2color = d3.scaleThreshold()
        .domain(groups)
        .range(unit_groups.map(function(d){ return d3.interpolateYlGnBu(d)}));

    year2decade = d3.scaleQuantize()
        .domain(year_domain)
        .range(groups);
}

//Funktion til at udtrække valgte måneder fra datasættet
function selectMonths(data)
{
    months = checkedMonths();
    if (months.length == 0 || months.length == 12)
    {
        months = ["metANN"]
    }

    var selected_data = [];
    data.forEach(function(row){
        var mean = 0;
        months.forEach(function(key) {
            mean += row[key];
        });
        mean = mean / months.length;
        if (!isNaN(mean)) {
            selected_data.push({"YEAR": row["YEAR"], "VAL": mean});
        }
    });



    year_domain = d3.extent(selected_data,
        function(d){
            return d["YEAR"];});

    temperature_domain = d3.extent(selected_data,
        function(d){
            return d["VAL"];});

    return selected_data;
}



//Returnerer hvilke måneder er valgt
function checkedMonths()
{
    var status = [];
    d3.select('#global_options_table').selectAll(".month_checkbox").each(
        function(d, i) {
            if (this.checked) {
                status.push(this.getAttribute("id"));
            }
        });
    return status;
}

//Stort første bogstav
function upperCaseFirst(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function linearRegression(data)
{
    var tmp1 = 0; //sum of all x * y
    var tmp2 = 0; //sum of all x
    var tmp3 = 0; //sum of all y
    var tmp4 = 0; //sum of squared x

    var n = data.length;

    data.forEach(function(d) {
        tmp1 += d["VAL"] * d["YEAR"];
        tmp2 += d["YEAR"];
        tmp3 += d["VAL"];
        tmp4 += d["YEAR"]*d["YEAR"]});

    var a = n * tmp1;

    var b = tmp2 * tmp3;

    var c = n * tmp4;

    var d = tmp2 * tmp2;

    var slope = (a - b) / (c - d);

    var f = slope * tmp2;

    var intercept = (tmp3 - f) / n;

    return {a: slope, b: intercept, f: function(x){return slope * x + intercept;}}
}