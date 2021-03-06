

var margin = {top: 20, right: 20, bottom: 30, left: 130},
    width = 800 - margin.left - margin.right,
    height = 960     - margin.top - margin.bottom;

var y = d3.scale.ordinal()
    .rangeRoundBands([0, height], .1);

var x = d3.scale.sqrt()
    .rangeRound([width, 0]);

var color = d3.scale.ordinal()
    .range(["#bfbf00", "#a9a900", "#949400", "#7f7f00", "#6a6a00"]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .ticks(15)
    .tickFormat(d3.format(".2s"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");    

var svg = d3.select(".stackedbch").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var active_link = "0"; //to control legend selections and hover
var legendClicked; //to control legend selections
var legendClassArray = []; //store legend classes to select bars in plotSingle()
var x_orig; //to store original y-posn

var formatComma = d3.format(',');

function createStackedChart(data){

  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "Departamento"; }));

  data.forEach(function(d) {
    var mydpto = d.Departamento; //add to stock code
    var x0 = 0;
    d.ages = color.domain().map(function(name) { return {mydpto:mydpto, name: name, x0: x0, x1: x0 += +d[name]}; });
    d.total = d.ages[d.ages.length - 1].x1;

  });

  data.sort(function(a, b) { return b.total - a.total; });

  y.domain(data.map(function(d) { return d.Departamento; }));
  x.domain([d3.max(data, function(d) { return d.total; }), 0]);

  svg.append("g")
      .attr("class", "x axis")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");

  var dpto = svg.selectAll(".dpto")
      .data(data)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", "translate(0,0)"); 
    
  var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

  dpto.selectAll("rect")
      .data(function(d) {
        return d.ages; 
      })
    .enter().append("rect")
      .attr("height", y.rangeBand())
      .attr("x", function(d) { return x(d.x0); })
      .attr("y",function(d) { //add to stock code
          return y(d.mydpto)
        })
      .attr("width", function(d) { return x(d.x1) - x(d.x0); })
      .attr("class", function(d) {
        classLabel = d.name.replace(/\s/g, ''); //remove spaces
        return "class" + classLabel;
      })
      .style("fill", function(d) { return color(d.name); });

  dpto.selectAll("rect")
       .on("mouseover", function(d){

          var delta = d.x1 - d.x0;
          var xPos = parseFloat(d3.select(this).attr("x"));
          var yPos = parseFloat(d3.select(this).attr("y"));
          var width = parseFloat(d3.select(this).attr("width"));
          var height = parseFloat(d3.select(this).attr("height"));
          
          d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);
          if (active_link === "0" || d.name === legendClicked){
              div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
              div	.html("<b>" + d.name + "</b></br>" + formatComma(delta) + " Gramos")	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");
          }
       })
       .on("mouseout",function(){
          div.transition()		
            .duration(500)		
            .style("opacity", 0);	
          d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);
                                
        })


  var legend = svg.selectAll(".legend")
      .data(color.domain().slice().reverse())
    .enter().append("g")
      .attr("class", function (d) {
        legendClassArray.push(d.replace(/\s/g, '')); //remove spaces
        return "legend";
      })
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  //reverse order to match order in which bars are stacked    
  legendClassArray = legendClassArray.reverse();

  legend.append("rect")
      .attr("x", width - 18)
      .attr("y", 350)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color)
      .attr("id", function (d, i) {
        return "id" + d.replace(/\s/g, '');
      })
      .on("mouseover",function(){        

        if (active_link === "0") d3.select(this).style("cursor", "pointer");
        else {
          if (active_link.split("class").pop() === this.id.split("id").pop()) {
            d3.select(this).style("cursor", "pointer");
          } else d3.select(this).style("cursor", "auto");
        }
      })
      .on("click",function(d){        

        if (active_link === "0") { //nothing selected, turn on this selection
          d3.select(this)           
            .style("stroke", "black")
            .style("stroke-width", 2);
            
            
        console.log(d);

            legendClicked = d;
            active_link = this.id.split("id").pop();
            plotSingle(this);

            //gray out the others
            for (i = 0; i < legendClassArray.length; i++) {
              if (legendClassArray[i] != active_link) {
                d3.select("#id" + legendClassArray[i])
                  .style("opacity", 0.5);
              }
            }
           
        } else { //deactivate
          if (active_link === this.id.split("id").pop()) {//active square selected; turn it OFF
            d3.select(this)           
              .style("stroke", "none");

            active_link = "0"; //reset

            //restore remaining boxes to normal opacity
            for (i = 0; i < legendClassArray.length; i++) {              
                d3.select("#id" + legendClassArray[i])
                  .style("opacity", 1);
            }

            //restore plot to original
            restorePlot(d);

          }

        } //end active_link check
                          
                                
      });

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 359)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

  function restorePlot(d) {

    dpto.selectAll("rect").forEach(function (d, i) {      
      //restore shifted bars to original posn
      d3.select(d[idx])
        .transition()
        .duration(1000)        
        .attr("x", x_orig[i]);
    })

    //restore opacity of erased bars
    for (i = 0; i < legendClassArray.length; i++) {
      if (legendClassArray[i] != class_keep) {
        d3.selectAll(".class" + legendClassArray[i])
          .transition()
          .duration(1000)
          .delay(750)
          .style("opacity", 1);
      }
    }

  }

  function plotSingle(d) {
        
    class_keep = d.id.split("id").pop();
    idx = legendClassArray.indexOf(class_keep);    
   
    //erase all but selected bars by setting opacity to 0
    for (i = 0; i < legendClassArray.length; i++) {
      if (legendClassArray[i] != class_keep) {
        d3.selectAll(".class" + legendClassArray[i])
          .transition()
          .duration(1000)          
          .style("opacity", 0);
      }
    }

    //lower the bars to start on y-axis
    x_orig = [];
    dpto.selectAll("rect").forEach(function (d, i) {        
    
      //get width and x posn of base bar and selected bar
      w_keep = d3.select(d[idx]).attr("width");
      x_keep = d3.select(d[idx]).attr("x");
      //store x_base in array to restore plot
      x_orig.push(x_keep);

      x_base = d3.select(d[0]).attr("x");    

      x_new = x_base;

      //reposition selected bars
      d3.select(d[idx])
        .transition()
        .ease("bounce")
        .duration(1000)
        .delay(750)
        .attr("x", x_new);
   
    })    
   
  } 

};