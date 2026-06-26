# 💸 Divisor de Gastos

Una Progressive Web App (PWA) para registrar los gastos de una salida grupal y calcular automáticamente quién le debe plata a quién.

---

## 📋 Descripción

Divisor de Gastos permite crear "salidas" (juntadas, viajes, asados, etc.), agregar las personas que participaron, registrar cada gasto indicando quién pagó y entre quiénes se divide, y obtener un resumen claro de las deudas: quién le debe cuánto a quién.

La app funciona completamente sin conexión a internet una vez instalada, y puede instalarse en el celular como una app nativa.

---

## ✨ Funcionalidades

- **Crear salidas** con nombre, fecha y ubicación
- **Registrar participantes** por salida
- **Agregar gastos** indicando quién pagó y entre quiénes se divide (no necesariamente todos)
- **Calcular deudas** automáticamente: muestra saldos por persona y transacciones sugeridas
- **Marcar como pagado** cada transacción
- **Escuchar el resumen** de deudas en voz alta (Speech Synthesis)
- **Detectar la ubicación** automáticamente al crear una salida (Geolocalización)
- **Resumen general** con el total gastado en todas las salidas
- **Indicador online/offline** en tiempo real
- **Funciona sin internet** gracias al Service Worker y Cache Storage
- **Instalable** como app en Android, iOS y escritorio

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| HTML / CSS / JavaScript | Base de la aplicación |
| IndexedDB | Almacenamiento local de salidas, personas y gastos |
| Service Worker | Cache y funcionamiento offline |
| Cache Storage | Estrategia Cache First para archivos estáticos |
| Web Manifest | Configuración de la app instalable |
| Geolocation API | Registro de ubicación de la salida |
| SpeechSynthesis API | Lectura en voz alta del resumen de deudas |

---

## 📁 Estructura del proyecto

```
DIVISOR-DE-GASTOS/
├── assets/
├── css/
│   └── style.css
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── js/
│   ├── api.js         → Geolocalización
│   ├── app.js         → Lógica principal de la app
│   └── storage.js     → IndexedDB (base de datos del navegador)
├── index.html
├── manifest.json
└── sw.js              → Service Worker
```

---

## 🗄️ Modelo de datos (IndexedDB)

La base de datos `DivisorGastosDB` tiene 3 object stores:

**salidas**
```
{ id, nombre, fecha, ubicacion }
```

**personas**
```
{ id, salidaId, nombre }
```

**gastos**
```
{ id, salidaId, descripcion, monto, pagadoPor, participantes[] }
```

---

## ⚙️ Cómo funciona

### Service Worker
El archivo `sw.js` implementa una estrategia **Cache First**: al instalar la app por primera vez guarda todos los archivos estáticos (HTML, CSS, JS, íconos) en el caché. Ante cada pedido, primero busca en caché y si no lo encuentra va a la red. Esto permite que la app funcione sin conexión.

### Navegación
Toda la app vive en un único `index.html` con 5 secciones (`<section>`). La navegación entre vistas se maneja con JavaScript ocultando y mostrando secciones con la clase `hiden`, sin recargar la página. Esto es fundamental para el funcionamiento offline.

### Cálculo de deudas
Por cada gasto, el monto se divide entre los participantes. Quien pagó suma el total a su balance (le deben eso), y cada participante resta su parte (debe eso). Al final se generan transacciones simplificadas del tipo "Juan le debe $500 a Ana".

---

## 🚀 Deploy

La app está publicada en:

🔗 **[Ver app en Netlify](#)** ← reemplazá con tu URL

---

## 📦 Instalación local

1. Cloná el repositorio:
```bash
git clone https://github.com/Grabiel-Neyra/divisor-de-gastos.git
```

2. Abrí el proyecto con un servidor local (por ejemplo Live Server en VS Code)

3. Abrí `http://localhost:5500` en el navegador

> ⚠️ El Service Worker requiere que la app corra sobre un servidor HTTP, no abriendo el archivo directamente desde el explorador de archivos.

---

## 📚 Materia

Trabajo Práctico N°2 — Aplicaciones Web Progresivas  
**Diseño y Programación Web** — Escuela Da Vinci  
Profesor: Jonathan Cruz