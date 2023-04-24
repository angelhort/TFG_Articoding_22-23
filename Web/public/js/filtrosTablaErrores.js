$(document).ready(function(){
    var listaAlumnos=[]
    $(".alumno").each(function(){
        listaAlumnos.push({"id" : $(this).attr("idAlumno"), "nombre" : $(this).attr("nombre"), "tiempo" : $(this).attr("tiempo"), "ultNivel" : $(this).attr("ultNivel") , "numAlumno" : $(this).attr("numAlumno"), "mediaErrores" : $(this).attr("mediaErrores")})
    });

    $("#searchP").keyup(function(){
        aplicarFiltros(listaAlumnos);
    });
});

function aplicarFiltros(listaAlumnos){
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