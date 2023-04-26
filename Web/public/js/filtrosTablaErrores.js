$(document).ready(function(){
    var listaAlumnos=[]
    $(".alumno").each(function(){
        listaAlumnos.push({"id" : $(this).attr("idAlumno"), "nombre" : $(this).attr("nombre"), "tiempo" : $(this).attr("tiempo"), "ultNivel" : $(this).attr("ultNivel") , "numAlumno" : $(this).attr("numAlumno"), "mediaErrores" : $(this).attr("mediaErrores")})
    });

    $("#searchP").keyup(function(){
        aplicarFiltros(listaAlumnos);
    });

    $("#orden").on("change", function(){
        aplicarFiltros(listaAlumnos);
    });
});

function aplicarFiltros(listaAlumnos){
    const orden = $("#orden").val();

    if(orden == "num"){
        listaAlumnos.sort((a,b) => {return b.mediaErrores - a.mediaErrores});
        construirTabla(listaAlumnos);
    }
    else if(orden == "nivel"){
        fetch("/profesor/getNiveles")
            .then(response => response.json())
            .then(data => {
            listaAlumnos.sort((a,b) => {
                return data.niveles.indexOf(b.ultNivel.toLowerCase().replaceAll(" ","_")) - data.niveles.indexOf(a.ultNivel.toLowerCase().replaceAll(" ","_"));
            });
            construirTabla(listaAlumnos)
            });
    }
    else if(orden == "nombre"){
        listaAlumnos.sort((a,b) => {
        const nombreA = a.nombre.toUpperCase();
        const nombreB = b.nombre.toUpperCase();
        if (nombreA < nombreB) {
            return -1;
        }
        if (nombreA > nombreB) {
            return 1;
        }
        return 0;
        });
        construirTabla(listaAlumnos);
    }
}

function construirTabla(listaAlumnos){
    var alumnos = []
    $("#cuerpoTabla").empty();
    listaAlumnos.forEach(function(a){
        const filtro = new RegExp($("#searchP").val().toLowerCase());
        if(filtro.test(a.id.toLowerCase()) || filtro.test(a.nombre.toLowerCase())){
            alumnos.push(
                '<tr class="alumno" idAlumno="' + a.id + '" numAlumno="'+ a.numAlumno +'" nombre="'+ a.nombre +'" tiempo="' + a.tiempo + '" ultNivel="' + a.ultNivel + '" mediaErrores="' + a.mediaErrores + '">' +
                    '<th scope="row" class="text-center">'+ a.numAlumno +'</th>' +
                    '<td class="text-center">'+ a.nombre +'</td>' +
                    '<td class="text-center">'+ a.tiempo +'</td>' +
                    '<td class="text-center">'+ a.ultNivel +'</td>' +
                    '<td class="text-center">'+ a.mediaErrores +'</td>' +
                    '<td class="text-center">' +
                        '<a class="cursorOnHover" data-bs-toggle="modal" data-bs-target="#modal'+ a.id +'">' +
                            '<i class="fa-solid fa-eye" style="color:black"></i>' +
                        '</a>' +
                    '</td>' +
                '</tr>'
            );   
        }
    });
    $("#cuerpoTabla").append(alumnos);
}