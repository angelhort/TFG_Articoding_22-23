$(document).ready(cambiarPlot);

$(document).ready(function(){
    $(".form-select").change(cambiarPlot);
});

function cambiarPlot(){
    var categoria = $(this).val();
    if(categoria=="")
        categoria="tutorials"
    $('.plotTiempo').each(function() {
        var ruta = $(this).attr('ruta');
        fetch(ruta + categoria)
        .then(response => response.json())
        .then(data => {
            jugadores = JSON.parse($('#infoJugadores').attr('value'));
            data = JSON.stringify(data);
            var result = data;
            for(var j in jugadores){
                if(j != jugadores[j]["nombre"]){
                    result = result.replaceAll(j, jugadores[j]["nombre"]);
                }
            }
            Plotly.newPlot($(this).attr('id'), JSON.parse(result).data, JSON.parse(result).layout, {responsive: true, 'displaylogo': false});
        })
        .catch(error => console.error(error));
    });

    $('.plotIntentos').each(function() {
        var ruta = $(this).attr('ruta');
        fetch(ruta + categoria)
        .then(response => response.json())
        .then(data => {
            jugadores = JSON.parse($('#infoJugadores').attr('value'));
            data = JSON.stringify(data);
            var result = data;
            for(var j in jugadores){
                if(j != jugadores[j]["nombre"]){
                    result = result.replaceAll(j, jugadores[j]["nombre"]);
                }
            }
            Plotly.newPlot($(this).attr('id'), JSON.parse(result).data, JSON.parse(result).layout, {responsive: true, 'displaylogo': false});
        })
        .catch(error => console.error(error));
    });

    $('tbody').each(function() {
        $(this).empty()
        var ruta = $(this).attr('ruta');
        fetch(ruta + categoria)
        .then(response => response.json())
        .then(data => {
            for(var n in data){
                $('tbody:last-child').append(
                    '<tr> <th scope="row">' + (n.charAt(0).toUpperCase() + n.slice(1)).replaceAll("_", " ") + '</th>' +
                        '<td class="text-center">' + data[n]["tiempo"] + '</td>' +
                        '<td class="text-center">' + data[n]["estrellas"] + '</td>' +
                        '<td class="text-center">' + data[n]["intentos"] + '</td>' +
                        '<td class="text-center">' + data[n]["participantes"] + '</td>' +
                    '</tr>'
                );
            }
        })
        .catch(error => console.error(error));
    });
}