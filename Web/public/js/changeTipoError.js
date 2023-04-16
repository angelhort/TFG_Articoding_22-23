$(document).ready(cambiarTabla);

$(document).ready(function(){
    $(".form-select").change(cambiarTabla);
});

function cambiarTabla(){
    var concepto = $(this).val();
    if(concepto=="")
        concepto="Var"
        
    fetch("/profesor/getErroresAlumnos/" + concepto)
    .then(response => response.json())
    .then(data => {
        $('#tablaJugadores').each(function() {
            $(this).empty()
            for(var n in data["jugadores"]){
                $('#tablaJugadores:last-child').append(
                    '<tr> <th scope="row">' + data["jugadores"][n]["nombre"] + '</th>' +
                        '<td>' + data["jugadores"][n]["tiempo"] + '</td>' +
                        '<td>' + data["jugadores"][n]["ultNivel"] + '</td>' +
                        '<td class="text-center">' + data["jugadores"][n]["mediaErroresVar"] + '</td>' +
                    '</tr>'
                );
            }
        });

        $('#tablaNiveles').each(function() {
            $(this).empty()
            console.log(data["niveles"])
            data["niveles"].forEach(n => {
                const values = Object.values(n)[0];
                $('#tablaNiveles:last-child').append(
                    '<tr> <th scope="row">' + (Object.keys(n)[0].charAt(0).toUpperCase() + Object.keys(n)[0].slice(1)).replaceAll("_", " ") + '</th>' +
                        '<td class = "text-center">' + values.errores + '</td>' +
                        '<td class = "text-center">' + values.jugadores + '</td>' +
                    '</tr>'
                );
            });
        });
        $("#linkErroresDetallados").attr("href","/profesor/erroresAlumnos?concepto=" + concepto);
    })
    .catch(error => console.error(error));
    
}