import express from "express";
import { body } from "express-validator";
import {
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
} from "../controllers/propiedadController.js";
import protegerRuta from "../middleware/protegerRuta.js";
import upload from "../middleware/subirImagen.js";
import identificarUsuario from "../middleware/identificarUsuario.js";

const router = express.Router();

//Routing
router.get("/mis-propiedades", protegerRuta,identificarUsuario, admin);
router.get("/propiedades/crear", protegerRuta, crear);
router.post(
  "/propiedades/crear",protegerRuta,
  body("titulo").notEmpty().withMessage("El Titulo es Obligatorio"),
  body("descripcion")
    .notEmpty()
    .withMessage("La Descripción es Obligatoria")
    .isLength({ max: 500 })
    .withMessage("La Descripción es muy Larga"),
  body("categoria").isNumeric().withMessage("Selecciona una Categoria"),
  body("precio").isNumeric().withMessage("Selecciona un Rango de Precio"),
  body("habitaciones")
    .isNumeric()
    .withMessage("Selecciona la Cantidad de Habitaciones"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la Cantidad de Estacionamiento"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la Cantidad de Baños"),
  body("lat").isNumeric().withMessage("Ubica la Propiedad en el Mapa"),
  guardar
);

router.get("/propiedades/agregar-imagen/:id",protegerRuta, agregarImagen);
router.post(
  "/propiedades/agregar-imagen/:id",
  protegerRuta,
  upload.single("imagen"),
  almacenarImagen
);

//Actualizar
router.get("/propiedades/editar/:id", protegerRuta, editar);
router.post(
  "/propiedades/editar/:id",
  protegerRuta,
  body("titulo").notEmpty().withMessage("El Titulo es Obligatorio"),
  body("descripcion")
    .notEmpty()
    .withMessage("La Descripción es Obligatoria")
    .isLength({ max: 200 })
    .withMessage("La Descripción es muy Larga"),
  body("categoria").isNumeric().withMessage("Selecciona una Categoria"),
  body("precio").isNumeric().withMessage("Selecciona un Rango de Precio"),
  body("habitaciones")
    .isNumeric()
    .withMessage("Selecciona la Cantidad de Habitaciones"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la Cantidad de Estacionamiento"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la Cantidad de Baños"),
  body("lat").isNumeric().withMessage("Ubica la Propiedad en el Mapa"),
  guardarCambios
);

//Eliminar
router.post('/propiedades/eliminar/:id', 
    protegerRuta,
    eliminar
)

//Modificr l actualizacion e l propiedad
router.put('/propiedades/:id', protegerRuta, cambiarEstado) //put si acepta el fetchapi


//Area Publica
router.get("/propiedad/:id", identificarUsuario, mostrarPropiedad);

//Almacenar los Mensajes
router.post("/propiedad/:id", identificarUsuario, body('mensaje').isLength({min: 10}).withMessage('El Mensaje es muy corto') ,enviarMensaje);


router.get('/mensajes/:id',
  protegerRuta,
  verMensajes
  )
export default router;
