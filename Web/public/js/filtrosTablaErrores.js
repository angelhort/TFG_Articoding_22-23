$(document).ready(function(){
    var editableTable = new BSTable("example",{
        editableColumns:"1",
    });
    editableTable.init();
    editableTable.refresh();

    var listaAlumnos=[]
    $(".alumno").each(function(){
        listaAlumnos.push({"id" : $(this).attr("idAlumno"), "nombre" : $(this).attr("nombre"), "tiempo" : $(this).attr("tiempo"), "ultNivel" : $(this).attr("ultNivel") , "numAlumno" : $(this).attr("numAlumno")})
    });

    $("#searchP").keyup(function(){
        aplicarFiltros(editableTable, listaAlumnos);
    });
});

function aplicarFiltros(table, listaAlumnos){
    var alumnos = []
    $("#cuerpoTabla").empty();
    listaAlumnos.forEach(function(a){
        const filtro = new RegExp($("#searchP").val().toLowerCase());
        if(filtro.test(a.id.toLowerCase()) || filtro.test(a.nombre.toLowerCase())){
            alumnos.push(
                '<tr class="alumno" idAlumno ="' + a.id + '" nombre ="' + a.nombre + '" tiempo="'+a.tiempo + '" ultNivel="'+a.ultNivel+'" numAlumno"' + a.numAlumnos +'">' +
                    '<th scope="row">' + a.numAlumno + '</th>' +
                    '<td>' + a.id + '</td>' +
                    '<td>' + a.nombre + '</td>' +
                    '<td>' + a.tiempo + '</td>' +
                    '<td>' + a.ultNivel + '</td>' +
                '</tr>'
            );   
        }
    });
    $("#cuerpoTabla").append(alumnos);
    table.refresh();
}