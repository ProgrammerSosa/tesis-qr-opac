// Datos institucionales que se muestran en el encabezado, el pie de página, las etiquetas y los comprobantes.
// Salen de la propuesta de modernización de la biblioteca (capítulo I).
export const LIBRARY = {
  nombre: 'Biblioteca «Francisco Rolando Velázquez González»',
  nombreCorto: 'Biblioteca Francisco Rolando Velázquez González',
  tituloSitio: 'Biblioteca Derecho USAC',
  facultad: 'Facultad de Ciencias Jurídicas y Sociales',
  universidad: 'Universidad de San Carlos de Guatemala',
  lema: 'Del anaquel cerrado al acceso inteligente',
  ciudad: 'Guatemala',
  zonaHoraria: 'America/Guatemala',

  // Dónde está la biblioteca y sus redes. Para cambiar una dirección o un enlace basta con editar esta lista.
  ubicacion: 'Edificio S-5, primer nivel · Campus central',
  direccion: 'Campus Central, Universidad de San Carlos de Guatemala, Ciudad Universitaria, Edificio S-5, Zona 12',
  comoLlegar: 'https://www.google.com/maps/search/?api=1&query=Facultad+de+Ciencias+Jur%C3%ADdicas+y+Sociales+USAC+Ciudad+Universitaria+zona+12',
  redes: {
    facebook: 'https://www.facebook.com/bibliotecaderechousac',
    instagram: 'https://www.instagram.com/biblioderechousac/',
    youtube: 'https://www.youtube.com/channel/UCPYiQPb47qLB7FVNn_bwQ6A',
  },

  // Logo de la biblioteca (archivo en frontend/public). Si el archivo falta, el sitio dibuja una marca sencilla en su lugar.
  logo: '/logo-biblioteca.png',
};
