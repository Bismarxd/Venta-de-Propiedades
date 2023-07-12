import {Dropzone} from "dropzone";

const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

console.log(token);

//.imagen es el id clocada en el form
Dropzone.options.imagen = {
  dictDefaultMessage: "Has click o Arrastar para Subir las Imagenes",
  acceptedFiles: '.png, .jpg, .jpeg',
  maxFilesize: 5,
  maxFiles: 1,
  parallelUploads: 1,
  autoProcessQueue: false,
  addRemoveLinks: true,
  dictRemoveFile: 'Borrar Archivo',
  dictMaxFilesExceeded: 'El Limite es 1 Archivo',
  //configurar el token
  headers: {
    'CSRF-Token': token
  },

  //NOmbre el parametro
  paramName: 'imagen',
  init: function() {
    const dropzone = this
    const btnPublicar = document.querySelector("#publicar");

    btnPublicar.addEventListener('click', function() {
      dropzone.processQueue()
    })

    dropzone.on('queuecomplete', function(file, mensaje) {
        if (dropzone.getActiveFiles().length == 0) {
          window.location.href = '/mis-propiedades'
        }
    })
  }
}