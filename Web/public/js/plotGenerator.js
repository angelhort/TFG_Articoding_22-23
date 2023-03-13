$(document).ready(function(){
    $('.plot').each(function() {
        var ruta = $(this).attr('ruta');
        fetch(ruta)
        .then(response => response.json())
        .then(data => {
            // Create the Plotly graph using the JSON data
            Plotly.newPlot($(this).attr('id'), data.data, data.layout, {responsive: true});
        })
        .catch(error => console.error(error));
    });
});