# CIENCIA DE DATOS Y ANALÍTICAS DE APRENDIZAJE APLICADAS AL VIDEOJUEGO ARTICODING PARA LA EVALUACIÓN DE CONCEPTOS BÁSICOS EN ALUMNOS DE SECUNDARIA
### Este repositorio alberga un TFG de la Universidad Complutense de Madrid.
## Instrucciones para lanzar el proyecto y probarlo:
* Descargar la rama main, nos hará falta el archivo *articoding.sql*, el archivo *libreriasPython.py* y la carpeta *Web*
* Utilizamos el archivo *articoding.sql* para importar la base de datos donde queramos.
* Los datos de conexión a la base de datos se almacenan en el archivo *config.js* dentro de la carpeta *Web*. Habrá que editarlo en función de donde hayamos importado la base de datos. Es posible que también haya que editar las lineas 17-22 del archivo *app.js* de la carpeta *Web*. 
* Para poder lanzar el proyecto es indispensable que tengamos node js instalado en nuestra máquina. Podemos comprobar que lo tenemos instalado escribiendo **node -v** y **npm -v** en nuestra máquina. Si no lo tenemos instalado podemos hacerlo siguiendo los siguientes pasos: <a href="https://www.cursosgis.com/como-instalar-node-js-y-npm-en-4-pasos/">Guía instalación Node</a>
* Es necesario tener también python instalado en nuestra máquina para realizar el análisis de datos. <a href="https://www.python.org/downloads/">Instalar Python</a>
* La primera vez será necesario ejecutar el script *libreriasPython.py* mediante el comando **python libreriasPython.py**. Si no se ejecutase correctamente el script es posible que necesitemos instalar pip3 en nuestra maquina.
* Una vez tenemos la base de datos arrancada podemos lanzar el servicio escribiendo el comando **npm start** desde un términal estando dentro de la carpeta *Web*
* Abrimos un navegador y nos vamos a la ruta http://localhost:3000/login
* Podemos iniciar sesión con 2 usuarios distintos
    * usuario: **admin**, contraseña: **1234**. Este usuario es el que tiene el rol de administrador
    * usuario : **prof4Empresa**, contraseña **1234**. Este usuario es el que tiene rol de profesor.
* Si iniciamos con el rol de profesor nos aparecerán 2 sesiones para visualizar. Una está ya analizada por lo que podemos visualizar los datos diréctamente y otra hay que analizarla (pulsar en analizar sesión). Es posible que al analizar una sesión el script no pueda ejecutarse correctamente por que nos faltan librerías de python. Los datos de la sesión ya analizadad deberían de poder visualizarse sin problemas si entramos en esta.
* El servicio debería de estar ya funcionando correctamente.