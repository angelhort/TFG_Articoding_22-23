$(document).ready(function(){
    $('.plot').each(function() {
        var ruta = $(this).attr('ruta');
        fetch(ruta)
        .then(response => response.json())
        .then(data => {
            Plotly.newPlot($(this).attr('id'), data.data, data.layout, {responsive: true, 'displaylogo': false});
        })
        .catch(error => console.error(error));
    });
});