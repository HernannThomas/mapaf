<?php
/**
 * SCADA SENA-CIES — Proxy PHP para XAMPP
 * =========================================
 * Este archivo actúa como puente entre Apache (XAMPP) y los
 * microservicios Python del sistema SCADA que corren en el puerto 8000.
 *
 * Coloca este archivo en:  C:/xampp/htdocs/scada/api_proxy.php
 * El .htaccess redirige /api/* hacia este proxy automáticamente.
 *
 * Los microservicios Python deben estar corriendo (ejecutar run.bat)
 * antes de usar la aplicación desde XAMPP.
 */

// ─── Configuración ──────────────────────────────────────────────────
// URL base del Gateway Python (no cambiar si usas run.bat por defecto)
define('SCADA_GATEWAY_URL', 'http://localhost:8000');

// Tiempo máximo de espera para respuestas del microservicio (segundos)
define('PROXY_TIMEOUT', 10);

// ─── CORS ────────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Construir la URL destino ─────────────────────────────────────────
// El .htaccess envía la ruta relativa en _path
$path = $_GET['_path'] ?? '';
if (empty($path)) {
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = preg_replace('#^/scada/api_proxy\.php#', '', $requestUri);
    $path = preg_replace('#^/scada/api#', '/api', $path) ?: '/api';
}

$targetUrl = SCADA_GATEWAY_URL . $path;

// ─── Reenviar la petición con cURL ────────────────────────────────────
$ch = curl_init();

$method = strtoupper($_SERVER['REQUEST_METHOD']);
$body   = file_get_contents('php://input');

$headersToForward = [];
foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    if (in_array($lowerName, ['host', 'connection', 'transfer-encoding'])) continue;
    $headersToForward[] = "$name: $value";
}

curl_setopt_array($ch, [
    CURLOPT_URL            => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => PROXY_TIMEOUT,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER     => $headersToForward,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_POSTFIELDS     => ($method !== 'GET') ? $body : null,
    CURLOPT_HEADER         => true,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError  = curl_error($ch);
curl_close($ch);

// ─── Manejar errores de conexión ─────────────────────────────────────
if ($response === false || !empty($curlError)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error'   => 'No se puede conectar con los microservicios SCADA',
        'detail'  => $curlError ?: 'Sin respuesta del Gateway Python',
        'tip'     => 'Asegurate de que run.bat este ejecutandose y el puerto 8000 este disponible',
        'gateway' => SCADA_GATEWAY_URL,
    ]);
    exit;
}

// ─── Separar cabeceras y cuerpo de la respuesta ──────────────────────
$responseHeaders = substr($response, 0, $headerSize);
$responseBody    = substr($response, $headerSize);

http_response_code($httpCode);

foreach (explode("\r\n", $responseHeaders) as $header) {
    if (empty($header)) continue;
    $lowerHeader = strtolower($header);
    if (str_starts_with($lowerHeader, 'http/')) continue;
    if (str_starts_with($lowerHeader, 'transfer-encoding:')) continue;
    if (str_starts_with($lowerHeader, 'connection:')) continue;
    header($header, false);
}

echo $responseBody;
