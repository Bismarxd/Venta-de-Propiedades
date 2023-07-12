import categorias from "./categorias.js";
import precios from "./precios.js";
import usuarios from "./usuarios.js";
import db from "../config/db.js";
import {Categoria, Precio, Usuario} from "../models/index.js";

const importarDatos = async () => {
  try {
    //Autenticar
    await db.authenticate()

    //Generar la Columnas
    await db.sync()


    //Insertamos los Datos
    await Promise.all([
      Categoria.bulkCreate(categorias),
      Precio.bulkCreate(precios),
      Usuario.bulkCreate(usuarios),
    ]);

    // //Sin Promise.all
    // await Categoria.bulkCreate(categorias)
    // await Precio.bulkCreate(precios)

    console.log('Datos importados Correctamente');
    process.exit(0) // exit(0) es que finaliso correctamente
    
  } catch (error) {
    console.log(error);
    process.exit(1); // exit(1) es que hubo un error al finalizar
  }
}

const eliminarDatos = async () => {
  try {
    ////primera forma de elimanr
    // await Promise.all([
    //   Categoria.destroy({ where: {}, truncate: true }),
    //   Precio.destroy({ where: {}, truncate: true }),
    // ]);

    //Segunda forma para eliminar
    await db.sync({force: true})

    console.log("Datos eliminados Correctamente");
    process.exit(0); // exit(0) es que finaliso correctamente

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

//argv importa la pocision 2 del script del seeder del package.json
if (process.argv[2] === "-i") {
  importarDatos();
}

if (process.argv[2] === "-e") {
  eliminarDatos();
}