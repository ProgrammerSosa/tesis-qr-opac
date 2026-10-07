export default function Container({ as: Etiqueta = 'div', className = '', children, ...props }) {
  return (
    <Etiqueta className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`} {...props}>
      {children}
    </Etiqueta>
  );
}
