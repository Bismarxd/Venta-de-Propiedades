import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from "./routes/propiedadesRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import db from './config/db.js'

//Crear la App
const app = express()

//Habilita lecturas y datos el formulario
app.use(express.urlencoded({extended: true}))

//Hbilitar Cookie Parser
app.use(cookieParser())

//Habilitar CSRF
app.use(csrf({cookie: true}))

//Conexion a la Base de Datos
try {
    await db.authenticate();
    db.sync()
    console.log('Conexion Correcta a la base de datos');
    
} catch (error) {
    console.log(error);
}

//Routing
app.use("/", appRoutes);
app.use('/auth', usuarioRoutes)
app.use("/", propiedadesRoutes);
app.use("/api", apiRoutes); // "/api" crea la api

//Habilitar plugins
app.set('view engine', 'pug')
app.set("views", "./views");

//Carpeta Publica
app.use(express.static('public'))

//Definir un puerto y arrncar el proyecto
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('El servidor esta funcionando en el puerto 3000');
})