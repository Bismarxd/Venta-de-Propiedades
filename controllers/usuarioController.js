import { check, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import Usuario from "../models/Usuario.js";
import { generarId, generarJWT } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";


const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesión",
    csrfToken: req.csrfToken(),
  });
};

const autenticar = async (req, res) => {
  //Validación
  await check("email")
    .isEmail()
    .withMessage("El Email es Obligatorio")
    .run(req);
  await check("password")
    .notEmpty()
    .withMessage("La Contraseña es Obligatorio")
    .run(req);

     let resultado = validationResult(req);

  //Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      
    });
  }

  const {email, password} = req.body
  //Comprobar si el usuaurio existe
  const usuario = await Usuario.findOne({where: {email}})
  
  if (!usuario) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: 'El Usuario no Existe' }],
    });
  }

  //Comprobar si el usuario esta confirmado
  if (!usuario.confirmado ) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: 'Tu Cuenta no ha Sido Confirmado' }],
    });
  }

  //Revisar el Password
  if (!usuario.verificarPassword(password)) {
     return res.render("auth/login", {
       pagina: "Iniciar Sesión",
       csrfToken: req.csrfToken(),
       errores: [{ msg: "La Contraseña es Incorrecto" }],
     });
  }

  //Autenticar al Usuario con json web token
  const token = generarJWT({ id: usuario.id, nombre: usuario.nombre});

  //Almacenar el JWT en un cookie
  return res.cookie('_token', token , {
    httpOnly: true,
    secure: true
  }).redirect('/mis-propiedades')
  

}


const cerrarSesion = (req, res) => {
  return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req, res) => {
  res.render("auth/registro", {
    pagina: "Crear Cuenta",
    csrfToken: req.csrfToken(),
  });
};

const registrar = async (req, res) => {
  //Validacion de lo errores ingresados en el usrio enviados por el usuaio a registrarse
  await check("nombre")
    .notEmpty()
    .withMessage("El Nombre no Puede Estar Vacio")
    .run(req);
  await check("email")
    .isEmail()
    .withMessage("El Email no Puede Estar Vacio")
    .run(req);
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El Password debe Tener almenos 6 carcateres")
    .run(req);
  await check("repetirpassword")
    .equals("password")
    .withMessage("Los Password no son Iguales")
    .run(req);

  let resultado = validationResult(req);

  //Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }

  //Extraer los Datos
  const { nombre, email, password } = req.body;

  //Verificar que el usuario no este duplicaddo
  const existeUsuario = await Usuario.findOne({ where: { email } });
  if (existeUsuario) {
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El Usuario ya Esta Registrado" }],
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }

  //Almacenar un Usuario
  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId(),
  });

  //envia el email de confirmación
  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token,
  });

  //Mostrar Mensaje de confirmacion
  res.render("templates/mensaje", {
    pagina: "Cuenta Creada Correctamente",
    mensaje: "Hemos enviado un  Email de Confirmación",
  });
};

//funcion que comprueba la cuenta
const confirmar = async (req, res, next) => {
  const { token } = req.params;

  //Verificar si el token es valido
  const usuario = await Usuario.findOne({ where: { token } });

  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Error al Confirmar tu Cuenta",
      mensaje: "Hubo un error al confirmar tu cuenta, intenta de nuevo",
      error: true,
    });
  }

  //confirmar la cuenta
  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    pagina: "Cuenta Confirmada",
    mensaje: "La cuenta se Confirmo Correctamente",
  });
};

const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu Acceso al Sistema",
    csrfToken: req.csrfToken(),
  });
};

const resetPassword = async (req, res) => {
  //Validacion de lo errores ingresados en el usrio enviados por el usuaio a registrarse

  await check("email")
    .isEmail()
    .withMessage("El Email no Puede Estar Vacio")
    .run(req);

  let resultado = validationResult(req);

  //Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu Acceso al Sistema",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  //Buscar el Usuario

  const { email } = req.body;

  const usuario = await Usuario.findOne({ where: { email } });

  if (!usuario) {
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu Acceso al Sistema",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El Email no Pertenece a Ningún Usuario" }],
    });
  }

  //Generar un token y enviar el email
  usuario.token = generarId();
  await usuario.save();

  //Enviar un email
  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token,
  });

  //Mostrar Mensaje de Confirmación
  res.render("templates/mensaje", {
    pagina: "Reestablecer Contraseña",
    mensaje: "Hemos enviado un con las instrucciones",
  });
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({ where: { token } });

  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Reestablecer tu Password",
      mensaje: "Hubo un error al validar tu información, intenta de nuevo",
      error: true,
    });
  }

  //Mostrar formulario para modificar el password
  res.render("auth/reset-password", {
    pagina: "Reestablece tu Password",
    csrfToken: req.csrfToken(),
  });
};

const nuevoPasword = async (req, res) => {
  //Validar el password
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El Password debe Tener almenos 6 caracteres")
    .run(req);

  let resultado = validationResult(req);

  //Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/reset-password", {
      pagina: "Reestablece tu Contraseña",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  const { token } = req.params;
  const { password } = req.body;

  //Identificar quien hace el cambio
  const usuario = await Usuario.findOne({ where: { token } });

  //Hashear el Password
  const salt = await bcrypt.genSalt(10);
  usuario.password = await bcrypt.hash(password, salt);
  usuario.token = null;

  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    pagina: "Contraseña Reestablecida",
    mensaje: "La Contraseña se Guardo Correctamente",
  });
};

export {
  formularioLogin,
  autenticar,
  cerrarSesion,
  formularioRegistro,
  registrar,
  confirmar,
  formularioOlvidePassword,
  resetPassword,
  comprobarToken,
  nuevoPasword,
};
