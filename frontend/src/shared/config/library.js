// Datos institucionales que se muestran en el encabezado, el pie de página, las etiquetas y los comprobantes.
// Son los que la biblioteca publica en su sitio web y en la propuesta de modernización (capítulo I). Para cambiar un
// teléfono, una red social o un enlace de esta lista basta con editar este archivo.
export const LIBRARY = {
  nombre: 'Biblioteca «Francisco Rolando Velázquez González»',
  nombreCorto: 'Biblioteca Francisco Rolando Velázquez González',
  tituloSitio: 'Biblioteca Derecho USAC',
  facultad: 'Facultad de Ciencias Jurídicas y Sociales',
  universidad: 'Universidad de San Carlos de Guatemala',
  lema: 'Del anaquel cerrado al acceso inteligente',
  ubicacion: 'Edificio S-5, primer nivel · Campus central',
  direccion: 'Campus Central, Universidad de San Carlos de Guatemala, Ciudad Universitaria, Edificio S-5, Zona 12',
  ciudad: 'Guatemala',
  zonaHoraria: 'America/Guatemala',
  sitioWeb: 'https://www.biblioderechousac.info/inicio',

  // Logo de la biblioteca (archivo en frontend/public). Si el archivo falta, el sitio dibuja una marca sencilla en su lugar.
  logo: '/logo-biblioteca.png',

  // Contacto y redes de la biblioteca.
  whatsapp: { numero: '50258812194', texto: '+502 5881 2194' },
  redes: {
    facebook: 'https://www.facebook.com/bibliotecaderechousac',
    messenger: 'https://m.me/bibliotecaderechousac',
    instagram: 'https://www.instagram.com/biblioderechousac/',
    youtube: 'https://www.youtube.com/channel/UCPYiQPb47qLB7FVNn_bwQ6A',
    blog: 'https://biblioderechousac.blogspot.com/',
  },
  comoLlegar: 'https://www.google.com/maps/search/?api=1&query=Facultad+de+Ciencias+Jur%C3%ADdicas+y+Sociales+USAC+Ciudad+Universitaria+zona+12',
};

export const ENLACE_WHATSAPP = `https://wa.me/${LIBRARY.whatsapp.numero}`;

// Sitios de otras instituciones a los que remite la biblioteca.
export const ENLACES_EXTERNOS = {
  usac: 'https://www.usac.edu.gt/',
  siif: 'https://siif.usac.edu.gt/',
  catalogoDeLibros:
    'https://script.google.com/macros/s/AKfycbxUubgNsEQJKIxiG6mMgtHR58qczJKHmWsqHI4lG4p7ndhTkg6cXtFSlH3UaPn-W5k2UQ/exec',
  tesisGrado: 'https://bibliotesisderechousac.blogspot.com/',
  tesisPosgrado: 'https://biblioderechousactesisposgrado.blogspot.com/',
  bibliotecaUnam: 'https://biblio.juridicas.unam.mx/bjv',
};
