
d3.csv("resources/data/data.csv", function(error, data) {
  if (error) throw error;
    
    createStackedChart(data);
    
    
});