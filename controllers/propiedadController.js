import { unlink } from "node:fs/promises";
import { validationResult } from "express-validator";
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from "../models/index.js";
import { esVendedor, formatearFecha } from "../helpers/index.js";
import { log } from "node:console";

const admin = async (req, res) => {
  //Leer el query string
  const { pagina: paginaActual } = req.query;
  const expresion = /^[1-9]$/; //^ valida que el numero sea positivo y $ que sea solo numeros

  if (!expresion.test(paginaActual)) {
    //test retorna true o false
    return res.redirect("mis-propiedades?pagina=1");
  }

  try {
     const { id } = req.usuario;

     //limites y offset para el paginador
     const limite =5;
     const offset = ((paginaActual * limite) - limite)

     const [propiedades, total] = await Promise.all([
       await Propiedad.findAll({
         limit: limite,
         offset,
         where: {
           usuarioId: id,
         },
         include: [
           { model: Categoria, as: "categoria" },
           { model: Precio, as: "precio" },
           { model: Mensaje, as: "mensajes" },
         ],
       }),
       Propiedad.count({
         where: {
           usuarioId: id,
         },
       }),
     ]);



     res.render("propiedades/admin", {
       pagina: "Mis Propiedades",
       csrfToken: req.csrfToken(),
       propiedades,
       paginas: Math.ceil(total / limite),
        paginaActual: Number(paginaActual),
        total,
        offset,
        usuario: req.usuario,
        limite
     });
    
  } catch (error) {
    console.log(error);
    
  }

};

const crear = async (req, res) => {
  //Consultar modelo de precios y categorias
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/crear", {
    pagina: "Crear Propiedad",
    csrfToken: req.csrfToken(),
    categorias: categorias,
    precios: precios,
    usuario: req.usuario,
    datos: {},
  });
};

const guardar = async (req, res) => {
  //Resultado de la Validcion
  let resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    //Consultar modelo de precios y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);

    return res.render("propiedades/crear", {
      pagina: "Crear Propiedad",
      csrfToken: req.csrfToken(),
      categorias: categorias,
      precios: precios,
      usuario: req.usuario,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  //Crear un registro en caso e que se pase la validacion

  const {
    titulo,
    descripcion,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precio: precioId,
    categoria: categoriaId,
  } = req.body;

  const { id: usuarioId } = req.usuario;

  try {
    const propiedadGuardada = await Propiedad.create({
      titulo, //En caso de titulo:titulo tambien es equivalente a titulo
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      categoriaId,
      usuarioId,
      imagen: "",
    });

    const { id } = propiedadGuardada;
    res.redirect(`/propiedades/agregar-imagen/${id}`);
  } catch (error) {
    console.log(error);
  }
};

const agregarImagen = async (req, res) => {
  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad este publicada
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece al que esta visitando la pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  res.render("propiedades/agregar-imagen", {
    pagina: `Agregar Imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad,
  });
};

const almacenarImagen = async (req, res, next) => {
  const { id } = req.params;

  //Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad este publicada
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece al que esta visitando la pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  try {
    console.log(req.file);

    //subir la imagen en la base de datos y cambiar el estado de publicado
    propiedad.imagen = req.file.filename;
    propiedad.publicado = 1;

    await propiedad.save();

    next();
  } catch (error) {
    console.log(error);
  }
};

const editar = async (req, res) => {
  const { id } = req.params;

  //Validar qu la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece al que esta visitando la pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Consultar modelo de precios y categorias
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/editar", {
    pagina: `Editar Propiedad: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    categorias: categorias,
    precios: precios,
    usuario: req.usuario,
    datos: propiedad,
  });
};

const guardarCambios = async (req, res) => {
  //Resultado de la Validcion
  let resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    //Consultar modelo de precios y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);

    return res.render("propiedades/editar", {
      pagina: "Editar Propiedad",
      csrfToken: req.csrfToken(),
      categorias: categorias,
      precios: precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  const { id } = req.params;
  //Validar qu la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece al que esta visitando la pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Reescribir el Objeto y actualizarlo
  try {
    const {
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precio: precioId,
      categoria: categoriaId,
    } = req.body;

    propiedad.set({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      categoriaId,
    });

    await propiedad.save();

    res.redirect("mis-propiedades");
  } catch (error) {
    console.log(error);
  }
};

const eliminar = async (req, res) => {
  const { id } = req.params;

  //Validar qu la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece al que esta visitando la pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Eliminar la Imagen
  await unlink(`public/uploads/${propiedad.imagen}`);
  console.log("Se Elimino la Imagen");

  //Eliminar la propiedad
  await propiedad.destroy();
  res.redirect("/mis-propiedades");
};


//Modifoca el estado de una propiedad
const cambiarEstado = async (req, res) => {
   const { id } = req.params;

   //Validar qu la propiedad exista
   const propiedad = await Propiedad.findByPk(id);

   if (!propiedad) {
     return res.redirect("/mis-propiedades");
   }

   //Validar que la propiedad pertenece al que esta visitando la pagina
   if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
     return res.redirect("/mis-propiedades");
   }

   //Actulizar
   propiedad.publicado = !propiedad.publicado;

   await propiedad.save()

   res.json({
    resultado: 'ok'
   })
}


//Muestar una propiedad
const mostrarPropiedad = async (req, res) => {
  const { id } = req.params;
  

  //Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
   
    include: [
      { model: Categoria, as: "categoria" },
      { model: Precio, as: "precio" },
    ],
  });

  if (!propiedad || !propiedad.publicado) {
    return res.redirect("/404");
  }


  res.render("propiedades/mostrar", {
    pagina: propiedad.titulo,
    propiedad,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad?.usuarioId),
  });
};

const enviarMensaje = async (req, res) => {
  const { id } = req.params;

  //Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Categoria, as: "categoria" },
      { model: Precio, as: "precio" },
    ],
  });

  if (!propiedad) {
    return res.redirect("/404");
  }

  //Renderizar lo errores
  //Resultado de la Validcion
  let resultado = validationResult(req);

  if (!resultado.isEmpty()) {
       return res.render("propiedades/mostrar", {
         pagina: propiedad.titulo,
         propiedad,
         csrfToken: req.csrfToken(),
         usuario: req.usuario,
         esVendedor: esVendedor(req.usuario?.id, propiedad?.usuarioId),
         errores: resultado.array()
       });
   
  }

  const { mensaje } = req.body;
  const { id: propiedadId } = req.params;
  const { id: usuarioId} = req.usuario;

  //Almacemar el mensaje
  await Mensaje.create({
    mensaje,
    propiedadId,
    usuarioId
  })
  res.redirect("/");

  
  

 
}

//Leer Mensaje Recibidos
const verMensajes = async (req, res) => {
  const { id } = req.params;

  //Validar qu la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {
        model: Mensaje,
        as: "mensajes",
        include: [{ model: Usuario.scope('eliminarPassword'), as: "usuario" }],
      },
    ],
  });

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad pertenece al que esta visitando la pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect("/mis-propiedades");
  }

  res.render('propiedades/mensajes', {
    pagina: 'Mensajes',
    mensajes: propiedad.mensajes,
    formatearFecha
  })
}

export {
  admin,
  crear,
  guardar,
  agregarImagen,
  almacenarImagen,
  editar,
  guardarCambios,
  eliminar,
  cambiarEstado,
  mostrarPropiedad,
  enviarMensaje,
  verMensajes
  
};
