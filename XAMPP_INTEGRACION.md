# SCADA SENA-CIES — Integración con XAMPP

## ¿Qué hace esta integración?

Permite servir la aplicación React SCADA desde **Apache de XAMPP** en lugar del servidor de desarrollo Vite, usando un proxy PHP para conectar con los microservicios Python.

```
Navegador
   │
   ▼  http://localhost/scada/
┌──────────────────┐
│  Apache (XAMPP)  │  Puerto 80
│  htdocs/scada/   │
└────────┬─────────┘
         │  /api/* → api_proxy.php
         ▼
┌──────────────────┐
│   api_proxy.php  │  Proxy PHP (reenvía peticiones)
└────────┬─────────┘
         │  HTTP → localhost:8000
         ▼
┌──────────────────────────────────────────┐
│   Gateway Python  (puerto 8000)          │
│   ├── Telemetry   (puerto 8001)          │
│   ├── Production  (puerto 8002)          │
│   ├── Alerts      (puerto 8003)          │
│   └── Assets      (puerto 8004)          │
└──────────────────────────────────────────┘
```

---

## Archivos creados

| Archivo | Ubicación | Propósito |
|---|---|---|
| `deploy_xampp.bat` | Raíz del proyecto | Script de despliegue automático |
| `xampp/api_proxy.php` | `xampp/` | Proxy PHP → Python gateway |
| `xampp/.htaccess` | `xampp/` | Reglas Apache (SPA + proxy) |

---

## Pasos para usar

### 1. Instalar XAMPP (si no lo tienes)
Descárgalo desde [apachefriends.org](https://www.apachefriends.org/) e instálalo en `C:\xampp`.

### 2. Iniciar Apache en XAMPP
Abre el **XAMPP Control Panel** e inicia **Apache**.

### 3. Iniciar los microservicios Python
```bat
run.bat
```
Esto arranca los 5 microservicios (puertos 8000–8004).

### 4. Desplegar la app en XAMPP
```bat
deploy_xampp.bat
```
Este script:
- Hace el **build de producción** de la app React
- Copia los archivos a `C:\xampp\htdocs\scada\`
- Copia el proxy PHP y el `.htaccess`

### 5. Abrir en el navegador
```
http://localhost/scada/
```

---

## Notas importantes

### mod_rewrite en Apache
El `.htaccess` requiere que `mod_rewrite` esté activo. En XAMPP viene activado por defecto.

Para verificarlo, revisa en `C:\xampp\apache\conf\httpd.conf` que la línea:
```
LoadModule rewrite_module modules/mod_rewrite.so
```
no esté comentada (sin `#` al inicio).

### cURL en PHP
El proxy PHP usa cURL para conectar con los microservicios. Verifica que esté habilitado en `C:\xampp\php\php.ini`:
```ini
extension=curl
```
No debe tener `;` al inicio.

### Orden de arranque
⚠️ **Primero** iniciar los microservicios Python (`run.bat`) y **después** abrir la app en el navegador. Si los microservicios no corren, el proxy mostrará un error `503` con un mensaje claro.

### XAMPP en ruta diferente
Si instalaste XAMPP en una ruta diferente a `C:\xampp`, edita la variable `XAMPP_ROOT` al inicio de `deploy_xampp.bat`.

---

## Para desarrollo (sin XAMPP)

Sigue usando Vite dev server como siempre:
```bat
npm run dev
```
La app estará en `http://localhost:3000` y el proxy integrado de Vite redirigirá `/api/*` al gateway Python automáticamente.
