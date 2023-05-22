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
            modifiedResult = JSON.parse(result);
            modifiedResult.data[0].customdata = modifiedResult.data[0].y.map(formatTime);
            modifiedResult.data[0].hovertemplate = "<b>%{hovertext}</b><br>Tiempo(s): %{customdata}";
            Plotly.newPlot($(this).attr('id'), modifiedResult.data, modifiedResult.layout, {responsive: true, 'displaylogo': false});
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

function formatTime(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var remainingSeconds = seconds - (hours * 3600) - (minutes * 60);
  
    var timeArray = [];
    if (hours > 0) {
      timeArray.push(hours + 'h');
    }
    if (minutes > 0) {
      timeArray.push(minutes + 'm');
    }
    if (remainingSeconds > 0 || timeArray.length === 0) {
      timeArray.push(remainingSeconds + 's');
    }
  
    return timeArray.join('/');
  }