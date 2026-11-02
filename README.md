# Reserva Directa · demo para cabañas y complejos

Demo visual de reservas directas para alojamientos en las Sierras. **Las Lajas** es un complejo inventado para la demo.
Es todo frontend: las reservas de prueba se generan solas y se guardan en el navegador.

- **Web pública** (`#/`): colores tomados del lugar (pasto dorado y azul de sierra) y el cartel del km 4. Foto de Los
  Gigantes, las cuatro cabañas con su próximo fin de semana libre, un calendario con las noches libres y su precio, el
  camino desde Córdoba parada por parada, y la cotización que compara el precio directo (10% menos) contra Booking, con
  seña simulada.
- **Panel del complejo** (`#/admin`): cuadro de ocupación de 4 semanas con el origen de cada reserva y cuántas cabañas
  quedan ocupadas cada noche,
  llegadas y salidas de la semana, lista de reservas, e ingresos con lo pagado en comisiones y lo ahorrado.

Una reserva hecha en la web aparece en el panel. **Reiniciar demo** vuelve todo a cero.

## Correrlo

```bash
npm install
npm run dev
```

## Publicarlo en GitHub Pages

Subir a la rama `main` de un repo y activar **Settings → Pages → Source: GitHub Actions**.

## Adaptarlo a un complejo real

Todo está en [`src/config/negocio.ts`](src/config/negocio.ts): nombre, ubicación, cabañas con capacidad y precios por
temporada, seña, descuento por reserva directa y lo que hay cerca. Las fotos van en `public/img/`: hoy son paisajes reales
de la zona e interiores genéricos de Wikimedia Commons, con crédito en el pie. Los interiores hay que reemplazarlos por
fotos de las cabañas reales.
