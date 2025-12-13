# Generación de PDF con @react-pdf/renderer

## 📋 Descripción

Este proyecto utiliza `@react-pdf/renderer` para generar reportes PDF de pólizas directamente en el navegador, eliminando la necesidad de usar Puppeteer en el backend.

## ✅ Ventajas sobre Puppeteer

1. **Reducción de carga en el backend**: Todo el procesamiento se hace en el cliente
2. **Evita problemas de configuración**: Puppeteer requiere dependencias del sistema que pueden desconfigurarse
3. **Más rápido**: No hay latencia de red para generar el PDF
4. **Offline-friendly**: Puede funcionar sin conexión al backend
5. **Menor costo de servidor**: No consume recursos del servidor para generar PDFs

## 🚀 Uso

### Generación básica de PDF

```jsx
import { pdf } from "@react-pdf/renderer";
import PolicyPDFDocument from "../helpers/PolicyPDFDocument";

const handleGenerateReport = async (policyData) => {
  try {
    // Generar el blob del PDF
    const blob = await pdf(<PolicyPDFDocument policy={policyData} />).toBlob();
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `poliza-${policyData.numberPolicy}.pdf`;
    
    // Descargar
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generando PDF:", error);
  }
};
```

### Previsualización de PDF (Opcional)

Para previsualizar el PDF antes de descargar:

```jsx
import { PDFViewer } from "@react-pdf/renderer";
import PolicyPDFDocument from "../helpers/PolicyPDFDocument";

const PreviewModal = ({ policy }) => {
  return (
    <PDFViewer width="100%" height="600px">
      <PolicyPDFDocument policy={policy} />
    </PDFViewer>
  );
};
```

## 📦 Estructura de archivos

```
src/helpers/
├── PolicyPDFDocument.jsx    # Componente del documento PDF
├── PDFViewer.jsx            # Visor opcional para preview
└── modal/
    └── ListPolicyModal.jsx  # Modal que genera el PDF
```

## 🎨 Personalización

### Estilos

Los estilos del PDF se definen con `StyleSheet.create()`:

```jsx
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
```

### Fuentes personalizadas

Para usar fuentes personalizadas:

```jsx
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf",
});
```

## 📄 Estructura del documento

El PDF generado contiene:

1. **Página 1: Información General**
   - Datos del asesor
   - Información general de la póliza
   - Información financiera
   - Observaciones

2. **Página 2: Historial**
   - Historial de pagos (tabla completa)
   - Historial de renovaciones
   - Períodos registrados

## 🔧 Problemas comunes

### El PDF no se descarga

Asegúrate de que el navegador no esté bloqueando las descargas automáticas.

### El PDF se ve mal en móviles

Considera usar orientación `portrait` en lugar de `landscape` para móviles:

```jsx
<Page size="A4" orientation="portrait">
```

### Imágenes no aparecen

Las imágenes deben estar en formato base64 o URLs absolutas:

```jsx
<Image src="https://example.com/logo.png" />
// o
<Image src="data:image/png;base64,iVBORw0KG..." />
```

## 📚 Recursos

- [Documentación oficial](https://react-pdf.org/)
- [Ejemplos](https://react-pdf.org/repl)
- [API Reference](https://react-pdf.org/components)

## 🆚 Migración desde Puppeteer

### Antes (Backend con Puppeteer)

```javascript
// Backend
const puppeteer = require('puppeteer');

app.get('/generate-pdf', async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdf = await page.pdf();
  await browser.close();
  res.send(pdf);
});
```

### Ahora (Frontend con @react-pdf/renderer)

```jsx
// Frontend
const blob = await pdf(<PolicyPDFDocument policy={data} />).toBlob();
const url = URL.createObjectURL(blob);
// Descargar...
```

## ✨ Beneficios obtenidos

- ✅ Sin dependencias del sistema en el servidor
- ✅ Sin problemas de configuración de Chrome/Chromium
- ✅ Generación más rápida
- ✅ Mejor experiencia de usuario
- ✅ Reducción de costos de servidor
- ✅ Más fácil de mantener
