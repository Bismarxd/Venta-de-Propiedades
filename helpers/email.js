import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
  var transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email, nombre, token } = datos;

  //Enviar el email
  await transport.sendMail({
    from: "VentaPropiedades.com",
    to: email,
    subject: "Confirma Tu Cuenta",
    text: "Confirma Tu Cuenta",
    html: `
      <div style="background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 0.375rem; padding: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 700; color: #374151; margin-bottom: 1rem;">¡Bienvenido, ${nombre}!</h1>

        <p style="color: #4B5563; margin-bottom: 1rem;">Tu cuenta ha sido creada con éxito. Para activarla, por favor haz clic en el siguiente botón:</p>
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}" style="background-color: #3B82F6; color: white; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.375rem; text-decoration: none; transition: background-color 0.2s;">Activar cuenta</a>

        <p style="color: #4B5563; margin-top: 1rem;">Si no creaste esta cuenta, por favor ignora este mensaje.</p>
      </div>
    `,
  });
};


const emailOlvidePassword = async (datos) => {
  var transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email, nombre, token } = datos;

  //Enviar el email
  await transport.sendMail({
    from: "VentaPropiedades.com",
    to: email,
    subject: "Reestablecer Contraseña",
    text: "Reestablecer Contraseña",
    html: `
      <div style="background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 0.375rem; padding: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 700; color: #374151; margin-bottom: 1rem;">Reestablecer Contraseña, ${nombre}!</h1>

        <p style="color: #4B5563; margin-bottom: 1rem;">Tu cuenta ha sido creada con éxito. Para reestablecer la contraseña, por favor haz clic en el siguiente botón:</p>
        <a href="${process.env.BACKEND_URL}:${
      process.env.PORT ?? 3000
    }/auth/olvide-password/${token}" style="background-color: #3B82F6; color: white; font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.375rem; text-decoration: none; transition: background-color 0.2s;">Reestablecer Contraseña</a>

        <p style="color: #4B5563; margin-top: 1rem;">Si no solicitaste reestablecer, por favor ignora este mensaje.</p>
      </div>
    `,
  });
};



export {
  emailRegistro,
  emailOlvidePassword
}