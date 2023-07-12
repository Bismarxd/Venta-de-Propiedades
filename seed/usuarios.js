import bcrypt from 'bcrypt'

//Crear un usuario de prueba
const usuarios = [
  {
    nombre: 'Bismar',
    email: 'correo@correo.com',
    confirmado: 1,
    password: bcrypt.hashSync('password', 10)

  }
]

export default usuarios