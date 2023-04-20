$(document).ready(function(){
    $("#searchP").keyup(function(){
        aplicarFiltros();
    });
});

function aplicarFiltros(){
    $(".alumno").each(function(){
        const id = $(this).attr("idAlumno").toLowerCase();
        const nombre = $(this).attr("nombre").toLowerCase();
        const filtro = new RegExp($("#searchP").val().toLowerCase());

        if(filtro.test(id) || filtro.test(nombre)){
            $(this).show();
        }
        else{
            $(this).hide();
        }
    });
}