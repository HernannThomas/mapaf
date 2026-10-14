<?php
/**
 * SCADA SENA-CIES — Sistema de Monitoreo Industrial con RBAC, CSV y Pasarela de Pago
 * =================================================================================
 * Roles:
 *   - ADMIN      : Control total, CREACIÓN DE USUARIOS, ASIGNACIÓN DE ROLES e INGRESO CSV
 *   - SUPERVISOR : Personal clave, visualiza TODOS los parámetros más importantes y críticos
 *   - EMPLEADO   : Solo visualiza parámetros generales (parámetros críticos bloqueados)
 *   - AUDITOR    : Auditoría y solo lectura
 * Módulos integrados:
 *   - Gestión de Usuarios con creación y cambio de roles en vivo
 *   - Pasarela de Pago interactiva (Tarjeta con preview 3D, PSE, Nequi, Factura Digital)
 *   - Ingreso y Carga de parámetros desde CSV
 */
session_start();

$DATA_FILE         = __DIR__ . '/parametros_guardados.json';
$USERS_FILE        = __DIR__ . '/usuarios_guardados.json';
$TRANSACTIONS_FILE = __DIR__ . '/transacciones_guardadas.json';

// ─── Funciones de Usuarios y Persistencia ─────────────────────────────
function get_default_users() {
    return [
        'admin' => [
            'pass'   => password_hash('admin123', PASSWORD_DEFAULT),
            'rol'    => 'ADMIN',
            'nombre' => 'Ing. Rodrigo Valenzuela',
            'cargo'  => 'Administrador del Sistema SCADA',
            'email'  => 'r.valenzuela@scada-cies.edu.co',
            'fecha'  => '2026-01-15'
        ],
        'supervisor' => [
            'pass'   => password_hash('super2026', PASSWORD_DEFAULT),
            'rol'    => 'SUPERVISOR',
            'nombre' => 'Ing. Diana Marcela Morales',
            'cargo'  => 'Supervisora de Planta / Personal Clave',
            'email'  => 'd.morales@scada-cies.edu.co',
            'fecha'  => '2026-02-10'
        ],
        'empleado' => [
            'pass'   => password_hash('emp2026', PASSWORD_DEFAULT),
            'rol'    => 'EMPLEADO',
            'nombre' => 'Juan Carlos Pérez',
            'cargo'  => 'Operario / Empleado General',
            'email'  => 'j.perez@scada-cies.edu.co',
            'fecha'  => '2026-03-01'
        ],
        'operador' => [
            'pass'   => password_hash('op2026', PASSWORD_DEFAULT),
            'rol'    => 'EMPLEADO',
            'nombre' => 'Carlos Mendoza',
            'cargo'  => 'Operador de Turno General',
            'email'  => 'c.mendoza@scada-cies.edu.co',
            'fecha'  => '2026-03-12'
        ],
        'auditor' => [
            'pass'   => password_hash('audit2026', PASSWORD_DEFAULT),
            'rol'    => 'AUDITOR',
            'nombre' => 'Dra. Elena Peñaloza',
            'cargo'  => 'Auditora de Procesos Industriales',
            'email'  => 'e.penaloza@scada-cies.edu.co',
            'fecha'  => '2026-04-05'
        ],
    ];
}

function load_users() {
    global $USERS_FILE;
    if (file_exists($USERS_FILE)) {
        $json = @file_get_contents($USERS_FILE);
        $data = json_decode($json, true);
        if (is_array($data) && count($data) > 0) {
            return $data;
        }
    }
    $defaults = get_default_users();
    save_users($defaults);
    return $defaults;
}

function save_users($users) {
    global $USERS_FILE;
    return @file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ─── Funciones de Transacciones / Pagos ────────────────────────────────
function load_transactions() {
    global $TRANSACTIONS_FILE;
    if (file_exists($TRANSACTIONS_FILE)) {
        $json = @file_get_contents($TRANSACTIONS_FILE);
        $data = json_decode($json, true);
        if (is_array($data)) return $data;
    }
    $defaults = [
        [
            'id'           => 'TXN-SCADA-94821',
            'fecha'        => '2026-10-12 14:32:10',
            'plan_nombre'  => 'Plan Industrial Supervisor',
            'monto'        => 89.00,
            'moneda'       => 'USD',
            'metodo'       => 'Tarjeta de Crédito (Visa •••• 4242)',
            'titular'      => 'Ing. Rodrigo Valenzuela',
            'estado'       => 'APROBADA',
            'autorizacion' => 'AUTH-892415',
            'usuario'      => 'admin'
        ]
    ];
    @file_put_contents($TRANSACTIONS_FILE, json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $defaults;
}

function save_transactions($txs) {
    global $TRANSACTIONS_FILE;
    return @file_put_contents($TRANSACTIONS_FILE, json_encode($txs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$USERS = load_users();

// ─── Matriz de Permisos por Rol ───────────────────────────────────────
$PERMISOS = [
    'ADMIN' => [
        'dashboard', 'equipment', 'alerts', 'users', 'status', 'sim',
        'ack_alert', 'csv_import', 'view_critical', 'view_general',
        'edit_params', 'export_data', 'payments', 'create_user', 'manage_roles'
    ],
    'SUPERVISOR' => [
        'dashboard', 'equipment', 'alerts', 'status', 'sim',
        'ack_alert', 'view_critical', 'view_general', 'export_data', 'payments'
    ],
    'EMPLEADO' => [
        'dashboard', 'equipment', 'alerts', 'status', 'view_general', 'payments'
    ],
    'AUDITOR' => [
        'dashboard', 'equipment', 'alerts', 'status', 'view_critical', 'view_general', 'payments'
    ],
];

function can($perm) {
    global $PERMISOS;
    $rol = $_SESSION['rol'] ?? '';
    return in_array($perm, $PERMISOS[$rol] ?? []);
}

// ─── Parámetros por Defecto del Sistema ───────────────────────────────
function get_default_parameters() {
    return [
        ['codigo' => 'PZ-LIZ-104', 'nombre' => 'Cabeza de Pozo Lizama 104', 'parametro' => 'Presión en Cabeza', 'valor' => 542.4, 'unidad' => 'PSI', 'min' => 400.0, 'max' => 650.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Lizama'],
        ['codigo' => 'PZ-LIZ-104', 'nombre' => 'Cabeza de Pozo Lizama 104', 'parametro' => 'Temperatura Operacional', 'valor' => 68.2, 'unidad' => '°C', 'min' => 45.0, 'max' => 85.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Lizama'],
        ['codigo' => 'PZ-LIZ-104', 'nombre' => 'Cabeza de Pozo Lizama 104', 'parametro' => 'Caudal de Extracción', 'valor' => 1240.5, 'unidad' => 'BPD', 'min' => 800.0, 'max' => 1600.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Lizama'],
        ['codigo' => 'PZ-LIZ-104', 'nombre' => 'Cabeza de Pozo Lizama 104', 'parametro' => 'Estado de Conexión', 'valor' => 100.0, 'unidad' => '%', 'min' => 90.0, 'max' => 100.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Lizama'],
        
        ['codigo' => 'VFD-MOT-201', 'nombre' => 'Variador Frecuencia Bomba ESP #2', 'parametro' => 'Frecuencia Inversor Potencia', 'valor' => 58.4, 'unidad' => 'Hz', 'min' => 40.0, 'max' => 65.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Lizama'],
        ['codigo' => 'VFD-MOT-201', 'nombre' => 'Variador Frecuencia Bomba ESP #2', 'parametro' => 'Vibración Radial Eje', 'valor' => 1.4, 'unidad' => 'mm/s', 'min' => 0.5, 'max' => 3.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Lizama'],
        ['codigo' => 'VFD-MOT-201', 'nombre' => 'Variador Frecuencia Bomba ESP #2', 'parametro' => 'Caudal Bombeo General', 'valor' => 1180.0, 'unidad' => 'BPD', 'min' => 700.0, 'max' => 1500.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Lizama'],
        
        ['codigo' => 'PZ-RUB-018', 'nombre' => 'Cabeza de Pozo Rubiales Pad 18', 'parametro' => 'Presión Manifold Alta', 'valor' => 894.2, 'unidad' => 'PSI', 'min' => 600.0, 'max' => 850.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Rubiales'],
        ['codigo' => 'PZ-RUB-018', 'nombre' => 'Cabeza de Pozo Rubiales Pad 18', 'parametro' => 'Temperatura de Fondo', 'valor' => 79.1, 'unidad' => '°C', 'min' => 50.0, 'max' => 90.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Rubiales'],
        ['codigo' => 'PZ-RUB-018', 'nombre' => 'Cabeza de Pozo Rubiales Pad 18', 'parametro' => 'Caudal de Producción', 'valor' => 2150.0, 'unidad' => 'BPD', 'min' => 1200.0, 'max' => 3000.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Rubiales'],
        
        ['codigo' => 'SEP-TRI-03', 'nombre' => 'Separador Trifásico Batería Central', 'parametro' => 'Presión de Separación Gas', 'valor' => 148.6, 'unidad' => 'PSI', 'min' => 100.0, 'max' => 180.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Rubiales'],
        ['codigo' => 'SEP-TRI-03', 'nombre' => 'Separador Trifásico Batería Central', 'parametro' => 'Nivel Interfase Agua/Crudo', 'valor' => 58.5, 'unidad' => '%', 'min' => 30.0, 'max' => 75.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Rubiales'],
        ['codigo' => 'SEP-TRI-03', 'nombre' => 'Separador Trifásico Batería Central', 'parametro' => 'Caudal Total Tratado', 'valor' => 8420.0, 'unidad' => 'BPD', 'min' => 5000.0, 'max' => 10000.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Rubiales'],
        
        ['codigo' => 'TK-ALM-01', 'nombre' => 'Tanque Fiscal Crudo Diluido TK-101', 'parametro' => 'Nivel de Llenado Radar', 'valor' => 72.8, 'unidad' => '%', 'min' => 15.0, 'max' => 90.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Cusiana'],
        ['codigo' => 'TK-ALM-01', 'nombre' => 'Tanque Fiscal Crudo Diluido TK-101', 'parametro' => 'Caudal de Despacho', 'valor' => 3200.0, 'unidad' => 'BPD', 'min' => 1000.0, 'max' => 4500.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Cusiana'],
        ['codigo' => 'TK-ALM-01', 'nombre' => 'Tanque Fiscal Crudo Diluido TK-101', 'parametro' => 'Presión de Alivio Venteo', 'valor' => 14.7, 'unidad' => 'PSI', 'min' => 12.0, 'max' => 20.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Cusiana'],
        
        ['codigo' => 'VFD-MOT-305', 'nombre' => 'Variador Tracción Compresor Gas', 'parametro' => 'Temperatura Célula IGBT', 'valor' => 89.2, 'unidad' => '°C', 'min' => 45.0, 'max' => 85.0, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Casabe'],
        ['codigo' => 'VFD-MOT-305', 'nombre' => 'Variador Tracción Compresor Gas', 'parametro' => 'Vibración Cojinete Alta', 'valor' => 4.8, 'unidad' => 'mm/s', 'min' => 0.5, 'max' => 4.2, 'criticidad' => 'CRITICO', 'ubicacion' => 'Campo Casabe'],
        ['codigo' => 'VFD-MOT-305', 'nombre' => 'Variador Tracción Compresor Gas', 'parametro' => 'Caudal de Gas Comprimido', 'valor' => 620.0, 'unidad' => 'KSCFD', 'min' => 300.0, 'max' => 900.0, 'criticidad' => 'GENERAL', 'ubicacion' => 'Campo Casabe']
    ];
}

function load_parameters() {
    global $DATA_FILE;
    if (file_exists($DATA_FILE)) {
        $json = @file_get_contents($DATA_FILE);
        $data = json_decode($json, true);
        if (is_array($data) && count($data) > 0) return $data;
    }
    $defaults = get_default_parameters();
    @file_put_contents($DATA_FILE, json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $defaults;
}

function save_parameters($params) {
    global $DATA_FILE;
    return @file_put_contents($DATA_FILE, json_encode($params, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ─── Descarga de Plantilla CSV ────────────────────────────────────────
if (isset($_GET['req']) && $_GET['req'] === 'download_template') {
    if (!isset($_SESSION['user']) || !can('csv_import')) {
        die('Acceso denegado. Se requiere rol de Administrador.');
    }
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="parametros_scada_plantilla.csv"');
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    fputcsv($output, ['codigo', 'nombre', 'parametro', 'valor', 'unidad', 'min', 'max', 'criticidad', 'ubicacion']);
    foreach (get_default_parameters() as $row) {
        fputcsv($output, [
            $row['codigo'], $row['nombre'], $row['parametro'], $row['valor'],
            $row['unidad'], $row['min'], $row['max'], $row['criticidad'], $row['ubicacion']
        ]);
    }
    fclose($output);
    exit;
}

// ─── Logout ───────────────────────────────────────────────────────────
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: ?');
    exit;
}

// ─── Login POST ───────────────────────────────────────────────────────
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $USERS = load_users();
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';
    if (isset($USERS[$u]) && password_verify($p, $USERS[$u]['pass'])) {
        $_SESSION['user']   = $u;
        $_SESSION['rol']    = $USERS[$u]['rol'];
        $_SESSION['nombre'] = $USERS[$u]['nombre'];
        $_SESSION['cargo']  = $USERS[$u]['cargo'] ?? 'Usuario SCADA';
        $_SESSION['email']  = $USERS[$u]['email'] ?? '';
        header('Location: ?');
        exit;
    }
    $loginError = 'Usuario o contraseña incorrectos. Revisa las credenciales abajo.';
}

// ─── API Endpoints (JSON) ─────────────────────────────────────────────
$request = $_GET['req'] ?? '';
if (!empty($request) && isset($_SESSION['user'])) {
    header('Content-Type: application/json; charset=utf-8');

    // 1. GESTIÓN DE USUARIOS: CREAR USUARIO (Solo Administrador)
    if ($request === 'create_user') {
        if (!can('create_user')) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permisos de Administrador para crear usuarios.']);
            exit;
        }

        $username = strtolower(trim($_POST['username'] ?? ''));
        $nombre   = trim($_POST['nombre'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $cargo    = trim($_POST['cargo'] ?? 'Operador SCADA');
        $password = $_POST['password'] ?? '';
        $rol      = strtoupper(trim($_POST['rol'] ?? 'EMPLEADO'));

        if (empty($username) || empty($nombre) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Usuario, Nombre y Contraseña son obligatorios.']);
            exit;
        }

        if (!in_array($rol, ['ADMIN', 'SUPERVISOR', 'EMPLEADO', 'AUDITOR'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Rol inválido. Elija entre ADMIN, SUPERVISOR, EMPLEADO o AUDITOR.']);
            exit;
        }

        $allUsers = load_users();
        if (isset($allUsers[$username])) {
            http_response_code(400);
            echo json_encode(['error' => "El nombre de usuario '{$username}' ya está registrado. Elige otro."]);
            exit;
        }

        $allUsers[$username] = [
            'pass'   => password_hash($password, PASSWORD_DEFAULT),
            'rol'    => $rol,
            'nombre' => $nombre,
            'cargo'  => $cargo,
            'email'  => $email,
            'fecha'  => date('Y-m-d')
        ];

        save_users($allUsers);

        echo json_encode([
            'status'  => 'success',
            'message' => "Usuario '{$username}' creado con rol '{$rol}' correctamente.",
            'user'    => [
                'username' => $username,
                'nombre'   => $nombre,
                'rol'      => $rol,
                'cargo'    => $cargo,
                'email'    => $email
            ]
        ]);
        exit;
    }

    // 2. GESTIÓN DE USUARIOS: CAMBIAR ROL (Solo Administrador)
    if ($request === 'update_role') {
        if (!can('manage_roles')) {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado. Solo ADMIN puede cambiar roles.']);
            exit;
        }

        $targetUser = trim($_POST['username'] ?? '');
        $newRole    = strtoupper(trim($_POST['new_role'] ?? ''));

        if (!in_array($newRole, ['ADMIN', 'SUPERVISOR', 'EMPLEADO', 'AUDITOR'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Rol inválido.']);
            exit;
        }

        $allUsers = load_users();
        if (!isset($allUsers[$targetUser])) {
            http_response_code(404);
            echo json_encode(['error' => 'Usuario no encontrado.']);
            exit;
        }

        $allUsers[$targetUser]['rol'] = $newRole;
        save_users($allUsers);

        // Si se actualizó la sesión propia
        if ($targetUser === $_SESSION['user']) {
            $_SESSION['rol'] = $newRole;
        }

        echo json_encode([
            'status'  => 'success',
            'message' => "Rol de '{$targetUser}' actualizado a '{$newRole}'.",
            'username'=> $targetUser,
            'new_role'=> $newRole
        ]);
        exit;
    }

    // 3. GESTIÓN DE USUARIOS: ELIMINAR USUARIO (Solo Administrador)
    if ($request === 'delete_user') {
        if (!can('create_user')) {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado.']);
            exit;
        }

        $targetUser = trim($_POST['username'] ?? '');
        if ($targetUser === 'admin' || $targetUser === $_SESSION['user']) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes eliminar la cuenta de Administrador principal ni tu usuario en uso.']);
            exit;
        }

        $allUsers = load_users();
        if (isset($allUsers[$targetUser])) {
            unset($allUsers[$targetUser]);
            save_users($allUsers);
            echo json_encode(['status' => 'success', 'message' => "Usuario '{$targetUser}' eliminado."]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Usuario no encontrado.']);
        }
        exit;
    }

    // 4. LISTAR USUARIOS (JSON)
    if ($request === 'get_users') {
        $allUsers = load_users();
        $safeUsers = [];
        foreach ($allUsers as $k => $u) {
            $safeUsers[] = [
                'username' => $k,
                'nombre'   => $u['nombre'],
                'rol'      => $u['rol'],
                'cargo'    => $u['cargo'] ?? '',
                'email'    => $u['email'] ?? '',
                'fecha'    => $u['fecha'] ?? '2026-01-01'
            ];
        }
        echo json_encode(['status' => 'ok', 'data' => $safeUsers]);
        exit;
    }

    // 5. PASARELA DE PAGO: PROCESAR PAGO
    if ($request === 'process_payment') {
        $planNombre = trim($_POST['plan_nombre'] ?? 'Plan Industrial SCADA');
        $monto      = floatval($_POST['monto'] ?? 89.00);
        $metodo     = trim($_POST['metodo'] ?? 'Tarjeta de Crédito');
        $titular    = trim($_POST['titular'] ?? ($_SESSION['nombre'] ?? 'Usuario'));
        $moneda     = trim($_POST['moneda'] ?? 'USD');

        $txId = 'TXN-SCADA-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 7));
        $auth = 'AUTH-' . rand(100000, 999999);

        $newTx = [
            'id'           => $txId,
            'fecha'        => date('Y-m-d H:i:s'),
            'plan_nombre'  => $planNombre,
            'monto'        => $monto,
            'moneda'       => $moneda,
            'metodo'       => $metodo,
            'titular'      => $titular,
            'estado'       => 'APROBADA',
            'autorizacion' => $auth,
            'usuario'      => $_SESSION['user']
        ];

        $allTxs = load_transactions();
        array_unshift($allTxs, $newTx);
        save_transactions($allTxs);

        echo json_encode([
            'status'      => 'success',
            'message'     => '¡Pago procesado exitosamente por la Pasarela Bancaria!',
            'transaction' => $newTx
        ]);
        exit;
    }

    // 6. PASARELA DE PAGO: HISTORIAL DE TRANSACCIONES
    if ($request === 'get_transactions') {
        $allTxs = load_transactions();
        echo json_encode(['status' => 'ok', 'data' => $allTxs]);
        exit;
    }

    // 7. CARGA DE PARÁMETROS CSV (Solo Administrador)
    if ($request === 'upload_csv') {
        if (!can('csv_import')) {
            http_response_code(403);
            echo json_encode(['error' => 'Solo ADMIN puede importar parámetros CSV.']);
            exit;
        }

        $csvText = '';
        if (isset($_FILES['csv_file']) && $_FILES['csv_file']['error'] === UPLOAD_ERR_OK) {
            $csvText = file_get_contents($_FILES['csv_file']['tmp_name']);
        } elseif (isset($_POST['csv_raw']) && trim($_POST['csv_raw']) !== '') {
            $csvText = $_POST['csv_raw'];
        }

        if (empty($csvText)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibió datos CSV.']);
            exit;
        }

        $csvText = preg_replace('/^\xEF\xBB\xBF/', '', $csvText);
        $lines = preg_split('/[\r\n]+/', trim($csvText));
        if (count($lines) < 2) {
            http_response_code(400);
            echo json_encode(['error' => 'El archivo debe tener al menos cabecera y 1 fila.']);
            exit;
        }

        $delimiter = (strpos($lines[0], ';') !== false) ? ';' : ',';
        $header = str_getcsv(trim($lines[0]), $delimiter);
        $header = array_map(function($h) { return strtolower(trim($h)); }, $header);

        $parsedParams = [];
        for ($i = 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;
            $row = str_getcsv($line, $delimiter);
            if (count($row) < 4) continue;

            $item = [];
            foreach ($header as $colIdx => $colName) {
                $item[$colName] = isset($row[$colIdx]) ? trim($row[$colIdx]) : '';
            }

            $codigo     = $item['codigo'] ?? ('EQ-' . str_pad($i, 3, '0', STR_PAD_LEFT));
            $nombre     = $item['nombre'] ?? 'Activo SCADA ' . $codigo;
            $parametro  = $item['parametro'] ?? 'Variable ' . $i;
            $valor      = floatval(str_replace(',', '.', $item['valor'] ?? '0'));
            $unidad     = $item['unidad'] ?? 'U';
            $min        = isset($item['min']) && $item['min'] !== '' ? floatval(str_replace(',', '.', $item['min'])) : round($valor * 0.7, 1);
            $max        = isset($item['max']) && $item['max'] !== '' ? floatval(str_replace(',', '.', $item['max'])) : round($valor * 1.3, 1);
            $criticidad = strtoupper($item['criticidad'] ?? '');
            if (!in_array($criticidad, ['CRITICO', 'GENERAL'])) {
                $criticidad = ($valor > $max || $valor < $min) ? 'CRITICO' : 'GENERAL';
            }
            $ubicacion  = $item['ubicacion'] ?? 'Planta Central';

            $parsedParams[] = [
                'codigo'     => $codigo,
                'nombre'     => $nombre,
                'parametro'  => $parametro,
                'valor'      => $valor,
                'unidad'     => $unidad,
                'min'        => $min,
                'max'        => $max,
                'criticidad' => $criticidad,
                'ubicacion'  => $ubicacion,
                'actualizado'=> date('Y-m-d H:i:s')
            ];
        }

        $storedParams = load_parameters();
        $mode = $_POST['mode'] ?? 'replace';
        $finalParams = ($mode === 'append') ? array_merge($storedParams, $parsedParams) : $parsedParams;
        save_parameters($finalParams);

        echo json_encode([
            'status'     => 'success',
            'message'    => 'Parámetros importados correctamente desde CSV.',
            'total'      => count($finalParams),
            'imported'   => count($parsedParams),
            'general'    => count(array_filter($finalParams, function($p){ return $p['criticidad'] === 'GENERAL'; })),
            'critical'   => count(array_filter($finalParams, function($p){ return $p['criticidad'] === 'CRITICO'; })),
            'data'       => $finalParams
        ]);
        exit;
    }

    // 8. RESTABLECER PARÁMETROS
    if ($request === 'reset_params') {
        if (!can('csv_import')) {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            exit;
        }
        $defaults = get_default_parameters();
        save_parameters($defaults);
        echo json_encode(['status' => 'success', 'data' => $defaults, 'message' => 'Parámetros restablecidos a fábrica']);
        exit;
    }

    // 9. OBTENER PARÁMETROS
    if ($request === 'params') {
        $storedParams = load_parameters();
        $userCanCritical = can('view_critical');
        $filtered = array_map(function($p) use ($userCanCritical) {
            $copy = $p;
            if ($p['criticidad'] === 'CRITICO' && !$userCanCritical) {
                $copy['valor'] = null;
                $copy['min'] = null;
                $copy['max'] = null;
                $copy['bloqueado'] = true;
                $copy['mensaje_bloqueo'] = '🔒 Parámetro crítico restringido para rol EMPLEADO';
            } else {
                $copy['bloqueado'] = false;
            }
            return $copy;
        }, $storedParams);

        echo json_encode([
            'status'       => 'ok',
            'rol'          => $_SESSION['rol'],
            'can_critical' => $userCanCritical,
            'total'        => count($filtered),
            'data'         => $filtered
        ]);
        exit;
    }

    // 10. EQUIPOS
    if ($request === 'equipment') {
        $equipment = [
            ['id' => 'eq-001', 'codigo' => 'PZ-LIZ-104', 'nombre' => 'Cabeza de Pozo Lizama 104', 'tipo' => 'CABEZA_POZO', 'ubicacion' => 'Campo Lizama', 'bateria' => 'Batería 02 – Troncal Norte', 'estado' => 'OPERATIVO', 'ultimaConexion' => '2 seg', 'presionActual' => 542.4, 'temperaturaActual' => 68.2, 'caudalActual' => 1240.5, 'nivelActual' => null, 'frecuenciaVfd' => null, 'vibracionActual' => null, 'especificaciones' => ['modelo' => 'Cameron Spool Wellhead 5K', 'fabricante' => 'Schlumberger/Cameron', 'anoInstalacion' => 2021, 'capacidadNominal' => '5,000 PSI / 2,500 BPD', 'protocoloComunicacion' => 'OPC-UA Ethernet']],
            ['id' => 'eq-002', 'codigo' => 'VFD-MOT-201', 'nombre' => 'Variador Frecuencia Bomba ESP #2', 'tipo' => 'VFD', 'ubicacion' => 'Campo Lizama', 'bateria' => 'Subestación Eléctrica Lizama B2', 'estado' => 'OPERATIVO', 'ultimaConexion' => '1 seg', 'presionActual' => 420.0, 'temperaturaActual' => 56.4, 'caudalActual' => 1180.0, 'nivelActual' => null, 'frecuenciaVfd' => 58.4, 'vibracionActual' => 1.4, 'especificaciones' => ['modelo' => 'ABB ACS880 Oilfield', 'fabricante' => 'ABB Industrial', 'anoInstalacion' => 2022, 'capacidadNominal' => '250 HP / 480 VAC', 'protocoloComunicacion' => 'Modbus TCP / IEC 61850']],
            ['id' => 'eq-003', 'codigo' => 'PZ-RUB-018', 'nombre' => 'Cabeza de Pozo Rubiales Pad 18', 'tipo' => 'CABEZA_POZO', 'ubicacion' => 'Campo Rubiales', 'bateria' => 'Pad 18 – Manifold de Recolección', 'estado' => 'ADVERTENCIA', 'ultimaConexion' => '4 seg', 'presionActual' => 894.2, 'temperaturaActual' => 79.1, 'caudalActual' => 2150.0, 'nivelActual' => null, 'frecuenciaVfd' => null, 'vibracionActual' => null, 'especificaciones' => ['modelo' => 'FMC Dual Block 10K', 'fabricante' => 'TechnipFMC', 'anoInstalacion' => 2020, 'capacidadNominal' => '10,000 PSI / 4,000 BPD', 'protocoloComunicacion' => 'WirelessHART']],
            ['id' => 'eq-004', 'codigo' => 'SEP-TRI-03', 'nombre' => 'Separador Trifásico Batería Central', 'tipo' => 'SEPARADOR', 'ubicacion' => 'Campo Rubiales', 'bateria' => 'Planta Tratamiento Rubiales', 'estado' => 'OPERATIVO', 'ultimaConexion' => '3 seg', 'presionActual' => 148.6, 'temperaturaActual' => 62.0, 'caudalActual' => 8420.0, 'nivelActual' => 58.5, 'frecuenciaVfd' => null, 'vibracionActual' => null, 'especificaciones' => ['modelo' => 'ASME VIII 3-Phase Vessel', 'fabricante' => 'NOV', 'anoInstalacion' => 2019, 'capacidadNominal' => '15,000 BLPD / 8.5 MMSCFD', 'protocoloComunicacion' => 'OPC-UA / Foundation Fieldbus']],
            ['id' => 'eq-005', 'codigo' => 'TK-ALM-01', 'nombre' => 'Tanque Fiscal Crudo Diluido TK-101', 'tipo' => 'TANQUE', 'ubicacion' => 'Campo Cusiana', 'bateria' => 'Patio de Tanques Cusiana Sur', 'estado' => 'OPERATIVO', 'ultimaConexion' => '5 seg', 'presionActual' => 14.7, 'temperaturaActual' => 42.5, 'caudalActual' => 3200.0, 'nivelActual' => 72.8, 'frecuenciaVfd' => null, 'vibracionActual' => null, 'especificaciones' => ['modelo' => 'API 650 Welded Steel 50K BBL', 'fabricante' => 'CB&I Storage', 'anoInstalacion' => 2018, 'capacidadNominal' => '50,000 Barriles', 'protocoloComunicacion' => 'Modbus RTU Radar Gauging']],
            ['id' => 'eq-006', 'codigo' => 'BMB-INJ-04', 'nombre' => 'Bomba Booster Despacho de Línea', 'tipo' => 'BOMBA', 'ubicacion' => 'Campo Cusiana', 'bateria' => 'Estación Bombeo Casanare', 'estado' => 'OPERATIVO', 'ultimaConexion' => '2 seg', 'presionActual' => 780.0, 'temperaturaActual' => 51.0, 'caudalActual' => 4800.0, 'nivelActual' => null, 'frecuenciaVfd' => null, 'vibracionActual' => 2.1, 'especificaciones' => ['modelo' => 'Sulzer MSD Multi-Stage', 'fabricante' => 'Sulzer Pumps', 'anoInstalacion' => 2021, 'capacidadNominal' => '1,200 GPM @ 1,100 PSI', 'protocoloComunicacion' => 'Profinet']],
            ['id' => 'eq-007', 'codigo' => 'VFD-MOT-305', 'nombre' => 'Variador Tracción Compresor Gas Flasheo', 'tipo' => 'VFD', 'ubicacion' => 'Campo Casabe', 'bateria' => 'Módulo Recuperación Vapores', 'estado' => 'CRITICO', 'ultimaConexion' => '1 seg', 'presionActual' => 310.5, 'temperaturaActual' => 89.2, 'caudalActual' => 620.0, 'nivelActual' => null, 'frecuenciaVfd' => 64.8, 'vibracionActual' => 4.8, 'especificaciones' => ['modelo' => 'Siemens Sinamics GH180', 'fabricante' => 'Siemens Energy', 'anoInstalacion' => 2023, 'capacidadNominal' => '500 HP / MV-PWM', 'protocoloComunicacion' => 'PROFINET / OPC-UA']],
            ['id' => 'eq-008', 'codigo' => 'PZ-CSB-082', 'nombre' => 'Cabeza de Pozo Casabe Profundo 82', 'tipo' => 'CABEZA_POZO', 'ubicacion' => 'Campo Casabe', 'bateria' => 'Macolla 12 Río Magdalena', 'estado' => 'OPERATIVO', 'ultimaConexion' => '6 seg', 'presionActual' => 610.8, 'temperaturaActual' => 64.0, 'caudalActual' => 980.0, 'nivelActual' => null, 'frecuenciaVfd' => null, 'vibracionActual' => null, 'especificaciones' => ['modelo' => 'Baker Hughes Master Gate 5K', 'fabricante' => 'Baker Hughes', 'anoInstalacion' => 2022, 'capacidadNominal' => '5,000 PSI / H2S Trim', 'protocoloComunicacion' => 'Modbus TCP Wireless']]
        ];

        function noise($v, $p = 0.012) { return round($v * (1 + (mt_rand(-100, 100) / 100) * $p), 1); }
        foreach ($equipment as &$eq) {
            $eq['presionActual']     = noise($eq['presionActual']);
            $eq['temperaturaActual'] = noise($eq['temperaturaActual'], 0.005);
            $eq['caudalActual']      = noise($eq['caudalActual'], 0.015);
            if ($eq['nivelActual'])     $eq['nivelActual']     = noise($eq['nivelActual'], 0.008);
            if ($eq['frecuenciaVfd'])   $eq['frecuenciaVfd']   = noise($eq['frecuenciaVfd'], 0.004);
            if ($eq['vibracionActual']) $eq['vibracionActual'] = noise($eq['vibracionActual'], 0.02);
        }

        echo json_encode(['status' => 'php_fallback', 'data' => $equipment, 'ts' => date('c')]);
        exit;
    }

    // 11. ALERTAS
    if ($request === 'alerts') {
        $alerts = [
            ['id' => 'alt-101', 'equipoId' => 'eq-007', 'codigoEquipo' => 'VFD-MOT-305', 'nombreEquipo' => 'Variador Tracción Compresor Gas Flasheo', 'tipoEquipo' => 'VFD', 'ubicacion' => 'Campo Casabe', 'nivel' => 'CRITICO', 'variableAfectada' => 'Temperatura Operacional VFD', 'valorMedido' => 89.2, 'umbralLimite' => 88.0, 'unidad' => '°C', 'estado' => 'ACTIVA', 'fechaGeneracion' => '2026-10-07 13:28:15', 'observaciones' => 'Pendiente verificación ventiladores celda de potencia.'],
            ['id' => 'alt-102', 'equipoId' => 'eq-003', 'codigoEquipo' => 'PZ-RUB-018', 'nombreEquipo' => 'Cabeza de Pozo Rubiales Pad 18', 'tipoEquipo' => 'CABEZA_POZO', 'ubicacion' => 'Campo Rubiales', 'nivel' => 'ADVERTENCIA', 'variableAfectada' => 'Presión en Cabeza', 'valorMedido' => 894.2, 'umbralLimite' => 850.0, 'unidad' => 'PSI', 'estado' => 'ACTIVA', 'fechaGeneracion' => '2026-10-07 13:31:40', 'observaciones' => 'Contra-presión por estrangulamiento en línea de flujo.'],
            ['id' => 'alt-098', 'equipoId' => 'eq-006', 'codigoEquipo' => 'BMB-INJ-04', 'nombreEquipo' => 'Bomba Booster Despacho de Línea', 'tipoEquipo' => 'BOMBA', 'ubicacion' => 'Campo Cusiana', 'nivel' => 'ADVERTENCIA', 'variableAfectada' => 'Vibración Radial', 'valorMedido' => 4.9, 'umbralLimite' => 4.8, 'unidad' => 'mm/s', 'estado' => 'CERRADA', 'fechaGeneracion' => '2026-10-07 11:15:00', 'fechaCierre' => '2026-10-07 11:42:30', 'atendidaPor' => 'Carlos Mendoza', 'observaciones' => 'Purga de aire y lubricación de rodamientos. Estabilizado a 2.1 mm/s.']
        ];
        echo json_encode(['status' => 'php_fallback', 'data' => $alerts, 'ts' => date('c')]);
        exit;
    }

    // 12. STATUS
    if ($request === 'status') {
        echo json_encode([
            'apache' => true,
            'php'    => PHP_VERSION,
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Apache',
            'user'   => $_SESSION['user'],
            'rol'    => $_SESSION['rol'],
            'ts'     => date('c')
        ]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Endpoint no encontrado']);
    exit;
}

$loggedIn   = isset($_SESSION['user']);
$userRol    = $_SESSION['rol']    ?? '';
$userName   = $_SESSION['nombre'] ?? '';
$userCargo  = $_SESSION['cargo']  ?? '';
$userEmail  = $_SESSION['email']  ?? '';
$userLogin  = $_SESSION['user']   ?? '';

$rolColors = [
    'ADMIN'      => '#ef4444',
    'SUPERVISOR' => '#8b5cf6',
    'EMPLEADO'   => '#10b981',
    'AUDITOR'    => '#06b6d4'
];
$rolIcons = [
    'ADMIN'      => '👑',
    'SUPERVISOR' => '⭐',
    'EMPLEADO'   => '👤',
    'AUDITOR'    => '👁️'
];
$rolColor = $rolColors[$userRol] ?? '#7c3aed';
$rolIcon  = $rolIcons[$userRol]  ?? '👤';
?><!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>SCADA SENA-CIES — <?= $loggedIn ? htmlspecialchars($userName) . ' (' . $userRol . ')' : 'Iniciar Sesión' ?></title>
<meta name="description" content="Sistema SCADA Industrial SENA CIES — Monitoreo con Roles, Carga CSV y Pasarela de Pago"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ══════════════════════════════════════════════════════════════════
   SISTEMA DE DISEÑO DARK INDUSTRIAL · SCADA SENA-CIES 2026
   ══════════════════════════════════════════════════════════════════ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg-950:#08080d; --bg-900:#0d0d15; --bg-850:#12121e; --bg-800:#171726; --bg-700:#1f1f33; --bg-600:#272740;
  --violet-700:#5b21b6; --violet-600:#6d28d9; --violet-500:#7c3aed; --violet-400:#a78bfa; --violet-glow:rgba(124,58,237,.35);
  --green:#22c55e; --green-d:rgba(34,197,94,.12);
  --red:#ef4444;   --red-d:rgba(239,68,68,.12);
  --amber:#f59e0b; --amber-d:rgba(245,158,11,.12);
  --cyan:#06b6d4;  --cyan-d:rgba(6,182,212,.12);
  --text-100:#f8fafc; --text-200:#e2e8f0; --text-300:#cbd5e1; --text-400:#94a3b8; --text-600:#64748b;
  --border:rgba(255,255,255,.08); --border-active:rgba(124,58,237,.45);
  --font:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
}

html{scroll-behavior:smooth;}
body{font-family:var(--font);background:var(--bg-950);color:var(--text-200);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:var(--bg-900);}
::-webkit-scrollbar-thumb{background:var(--bg-600);border-radius:4px;}
::-webkit-scrollbar-thumb:hover{background:var(--violet-500);}

@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.85)}}
@keyframes floatGlow{0%,100%{transform:translate(0,0)}50%{transform:translate(15px,-15px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* ══════════════════════════════════════════════════════════════════
   PANTALLA DE LOGIN
   ══════════════════════════════════════════════════════════════════ */
.login-screen{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;
  background:radial-gradient(circle at 50% 20%, rgba(124,58,237,.18) 0%, transparent 60%),
             radial-gradient(circle at 80% 80%, rgba(6,182,212,.12) 0%, transparent 50%),
             var(--bg-950);
}
.login-blob{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;animation:floatGlow 9s ease-in-out infinite;}
.login-blob-1{width:450px;height:450px;background:#6d28d9;top:-80px;left:-80px;opacity:.2;}
.login-blob-2{width:400px;height:400px;background:#0891b2;bottom:-60px;right:-60px;opacity:.15;animation-delay:4s;}

.login-box{
  background:rgba(18,18,30,.88);backdrop-filter:blur(24px);border:1px solid var(--border-active);border-radius:22px;
  padding:36px;width:100%;max-width:440px;box-shadow:0 30px 90px rgba(0,0,0,.75), 0 0 35px var(--violet-glow);
  position:relative;z-index:2;animation:fadeUp .4s ease;
}
.login-brand{text-align:center;margin-bottom:22px;}
.login-brand-icon{
  width:58px;height:58px;margin:0 auto 14px;background:linear-gradient(135deg,var(--violet-500),#3b82f6);
  border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#fff;
  box-shadow:0 0 30px var(--violet-glow);
}
.login-brand-title{font-size:20px;font-weight:800;color:var(--text-100);letter-spacing:-.02em;}
.login-brand-sub{font-size:11px;color:var(--text-400);font-family:var(--mono);margin-top:4px;}

.role-chips-guide{display:flex;flex-direction:column;gap:8px;background:var(--bg-900);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:20px;}
.rcg-title{font-size:10px;text-transform:uppercase;color:var(--text-400);font-weight:700;letter-spacing:.05em;}
.role-card-mini{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:var(--bg-800);border:1px solid var(--border);transition:all .15s;}
.role-card-mini:hover{border-color:var(--violet-500);background:var(--bg-700);}
.rcm-info{display:flex;flex-direction:column;}
.rcm-name{font-size:11px;font-weight:700;color:var(--text-100);}
.rcm-desc{font-size:9.5px;color:var(--text-400);}
.rcm-btn{background:var(--violet-600);color:#fff;border:none;border-radius:6px;padding:4px 9px;font-size:10px;font-weight:600;cursor:pointer;}
.rcm-btn:hover{background:var(--violet-500);}

.form-group{margin-bottom:14px;}
.form-label{display:block;font-size:11px;font-weight:600;color:var(--text-300);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;}
.form-input{width:100%;padding:11px 14px;border-radius:10px;background:var(--bg-900);border:1px solid var(--border);color:var(--text-100);font-size:13px;font-family:inherit;outline:none;transition:all .2s;}
.form-input:focus{border-color:var(--violet-500);box-shadow:0 0 0 3px rgba(124,58,237,.18);}
.submit-btn{width:100%;padding:13px;border-radius:10px;border:none;cursor:pointer;background:linear-gradient(135deg,var(--violet-600),#3b82f6);color:#fff;font-size:13px;font-weight:700;font-family:inherit;box-shadow:0 6px 20px var(--violet-glow);transition:all .2s;margin-top:6px;}
.submit-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}

/* ══════════════════════════════════════════════════════════════════
   ESTRUCTURA APP
   ══════════════════════════════════════════════════════════════════ */
#app{display:flex;min-height:100vh;}
#sidebar{width:235px;background:var(--bg-900);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;flex-shrink:0;z-index:50;}
.sidebar-head{padding:20px 18px;border-bottom:1px solid var(--border);}
.sb-logo{display:flex;align-items:center;gap:11px;}
.sb-logo-box{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--violet-600),#3b82f6);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;box-shadow:0 0 16px var(--violet-glow);}
.sb-title{font-size:14px;font-weight:800;color:var(--text-100);line-height:1.1;}
.sb-sub{font-size:10px;color:var(--text-400);font-family:var(--mono);}

.sb-menu{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;}
.sb-cat{font-size:9px;text-transform:uppercase;color:var(--text-600);font-weight:700;letter-spacing:.08em;padding:10px 10px 4px;}
.sb-item{
  display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;font-size:12.5px;font-weight:500;
  color:var(--text-400);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .15s;width:100%;text-align:left;
}
.sb-item:hover{background:var(--bg-800);color:var(--text-100);}
.sb-item.active{background:linear-gradient(135deg,rgba(124,58,237,.22),rgba(59,130,246,.15));border-color:var(--border-active);color:var(--violet-400);font-weight:600;}
.sb-item .ico{font-size:15px;width:18px;text-align:center;}
.sb-badge{margin-left:auto;font-size:9.5px;padding:1px 6px;border-radius:10px;font-weight:700;background:var(--red);color:#fff;}
.sb-badge-admin{margin-left:auto;font-size:8.5px;padding:2px 6px;border-radius:5px;font-weight:800;background:rgba(239,68,68,.18);color:#ef4444;border:1px solid rgba(239,68,68,.35);}
.sb-badge-pay{margin-left:auto;font-size:8.5px;padding:2px 6px;border-radius:5px;font-weight:800;background:rgba(34,197,94,.18);color:#22c55e;border:1px solid rgba(34,197,94,.35);}

.sb-user-card{padding:14px;border-top:1px solid var(--border);background:var(--bg-850);margin-top:auto;}
.sb-user-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.sb-avatar{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;flex-shrink:0;}
.sb-user-name{font-size:12px;font-weight:700;color:var(--text-100);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-user-cargo{font-size:10px;color:var(--text-400);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-logout-btn{width:100%;padding:7px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text-400);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;}
.sb-logout-btn:hover{background:var(--red-d);border-color:rgba(239,68,68,.4);color:var(--red);}

#main-wrap{flex:1;display:flex;flex-direction:column;min-width:0;}
#topbar{height:56px;background:var(--bg-900);border-bottom:1px solid var(--border);padding:0 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;}
.top-title{font-size:15px;font-weight:700;color:var(--text-100);}
.top-sub{font-size:11px;color:var(--text-400);}
.top-right{display:flex;align-items:center;gap:12px;}
.badge-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid;}
.clock-text{font-family:var(--mono);font-size:12px;color:var(--text-400);}

/* Role Notice Bar */
.role-notice-bar{padding:9px 24px;font-size:11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid;}
.rnb-ADMIN{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.25);color:#fca5a5;}
.rnb-SUPERVISOR{background:rgba(139,92,246,.08);border-color:rgba(139,92,246,.25);color:#d8b4fe;}
.rnb-EMPLEADO{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.25);color:#86efac;}
.rnb-AUDITOR{background:rgba(6,182,212,.08);border-color:rgba(6,182,212,.25);color:#67e8f9;}

/* Views */
#content{flex:1;padding:22px 24px;display:flex;flex-direction:column;gap:20px;}
.view{display:none;}
.view.active{display:flex;flex-direction:column;gap:18px;}

/* KPI */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:12px;}
.kpi-card{background:var(--bg-900);border:1px solid var(--border);border-radius:14px;padding:16px;transition:border-color .2s;}
.kpi-card:hover{border-color:var(--border-active);}
.kpi-title{font-size:11px;color:var(--text-400);font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between;}
.kpi-val{font-size:24px;font-weight:800;color:var(--text-100);line-height:1;}
.kpi-unit{font-size:12px;color:var(--text-400);font-weight:500;}
.kpi-foot{font-size:10px;color:var(--text-600);margin-top:6px;}

/* Botones de acción */
.btn-action{padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:inherit;border:1px solid transparent;transition:all .15s;text-decoration:none;}
.btn-violet{background:var(--violet-600);color:#fff;}
.btn-violet:hover{background:var(--violet-500);}
.btn-green{background:#16a34a;color:#fff;}
.btn-green:hover{background:#22c55e;}
.btn-outline{border-color:var(--border-active);color:var(--violet-400);background:transparent;}
.btn-outline:hover{background:rgba(124,58,237,.15);}
.btn-amber{border-color:rgba(245,158,11,.35);color:var(--amber);background:transparent;}
.btn-amber:hover{background:var(--amber-d);}
.btn-red{border-color:rgba(239,68,68,.35);color:var(--red);background:transparent;}
.btn-red:hover{background:var(--red-d);}

/* Tablas */
.params-table-container{background:var(--bg-900);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
.table-head-bar{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.pt-table{width:100%;border-collapse:collapse;font-size:12px;}
.pt-table th{padding:10px 14px;text-align:left;background:var(--bg-850);color:var(--text-400);font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);}
.pt-table td{padding:12px 14px;border-bottom:1px solid var(--border);}
.pt-table tr:hover td{background:rgba(255,255,255,.02);}

.badge-criticidad{font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:4px;border:1px solid;}
.badge-criticidad.CRITICO{color:var(--red);background:var(--red-d);border-color:rgba(239,68,68,.35);}
.badge-criticidad.GENERAL{color:var(--green);background:var(--green-d);border-color:rgba(34,197,94,.3);}
.badge-criticidad.ADMIN{color:#ef4444;background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);}
.badge-criticidad.SUPERVISOR{color:#8b5cf6;background:rgba(139,92,246,.1);border-color:rgba(139,92,246,.35);}
.badge-criticidad.EMPLEADO{color:#10b981;background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.35);}
.badge-criticidad.AUDITOR{color:#06b6d4;background:rgba(6,182,212,.1);border-color:rgba(6,182,212,.35);}

.val-locked-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#fca5a5;font-size:11px;font-weight:600;}

/* Equipos Grid */
.eq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:14px;}
.eq-card{background:var(--bg-900);border:1px solid var(--border);border-radius:14px;padding:18px;transition:all .2s;position:relative;cursor:pointer;}
.eq-card:hover{border-color:var(--border-active);transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.35);}
.eq-card.CRITICO{border-left:3px solid var(--red);}
.eq-card.ADVERTENCIA{border-left:3px solid var(--amber);}
.eq-card.OPERATIVO{border-left:3px solid var(--green);}
.status-pill{font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;}
.status-pill.OPERATIVO{background:var(--green-d);color:var(--green);border:1px solid rgba(34,197,94,.3);}
.status-pill.ADVERTENCIA{background:var(--amber-d);color:var(--amber);border:1px solid rgba(245,158,11,.3);}
.status-pill.CRITICO{background:var(--red-d);color:var(--red);border:1px solid rgba(239,68,68,.35);}
.dot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:livePulse 2s infinite;}
.eq-metrics-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;}
.metric-tile{background:var(--bg-800);border:1px solid var(--border);border-radius:8px;padding:9px 10px;}
.metric-tile.restricted{border-style:dashed;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.04);}
.mt-label{font-size:9.5px;color:var(--text-400);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:2px;}
.mt-val{font-size:16px;font-weight:800;color:var(--text-100);line-height:1.1;}
.mt-unit{font-size:10px;color:var(--text-400);font-family:var(--mono);}

/* ══════════════════════════════════════════════════════════════════
   ESTILOS DE LA PASARELA DE PAGO
   ══════════════════════════════════════════════════════════════════ */
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:24px;}
.pricing-card{
  background:var(--bg-900);border:1px solid var(--border);border-radius:18px;padding:24px;
  display:flex;flex-direction:column;position:relative;transition:all .25s;
}
.pricing-card:hover{border-color:var(--border-active);transform:translateY(-3px);box-shadow:0 12px 35px rgba(124,58,237,.15);}
.pricing-card.featured{
  border-color:var(--violet-500);
  background:linear-gradient(180deg, rgba(124,58,237,.08) 0%, var(--bg-900) 100%);
  box-shadow:0 0 30px rgba(124,58,237,.2);
}
.pricing-ribbon{
  position:absolute;top:-10px;right:20px;background:linear-gradient(135deg,var(--violet-600),#3b82f6);
  color:#fff;font-size:9.5px;font-weight:800;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em;
}
.plan-name{font-size:16px;font-weight:800;color:var(--text-100);margin-bottom:6px;}
.plan-desc{font-size:11px;color:var(--text-400);margin-bottom:16px;line-height:1.5;}
.plan-price{font-size:32px;font-weight:900;color:var(--text-100);line-height:1;margin-bottom:4px;}
.plan-price span{font-size:13px;font-weight:500;color:var(--text-400);}
.plan-features{list-style:none;margin:20px 0;display:flex;flex-direction:column;gap:9px;font-size:11.5px;color:var(--text-300);}
.plan-features li{display:flex;align-items:center;gap:8px;}
.plan-features li span{color:var(--green);font-weight:bold;}

/* Tarjeta de Crédito 3D Interactiva */
.card-preview-wrap{perspective:1000px;margin-bottom:20px;}
.interactive-card{
  width:100%;max-width:380px;height:210px;margin:0 auto;border-radius:18px;
  background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
  padding:22px;color:#fff;box-shadow:0 15px 40px rgba(0,0,0,.6), 0 0 25px rgba(124,58,237,.3);
  position:relative;display:flex;flex-direction:column;justify-content:space-between;
  border:1px solid rgba(255,255,255,.2);
}
.card-chip{width:42px;height:32px;background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:6px;border:1px solid rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;color:#78350f;}
.card-network-logo{font-size:18px;font-weight:900;font-style:italic;letter-spacing:-.03em;}
.card-num-display{font-family:var(--mono);font-size:17px;font-weight:600;letter-spacing:2px;text-shadow:0 2px 4px rgba(0,0,0,.4);}
.card-footer-row{display:flex;justify-content:space-between;align-items:flex-end;}
.card-holder-name{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
.card-exp-date{font-family:var(--mono);font-size:12px;font-weight:700;}

/* Factura Digital */
.receipt-box{
  background:#fff;color:#1e293b;border-radius:16px;padding:28px;max-width:540px;width:100%;margin:0 auto;
  box-shadow:0 20px 60px rgba(0,0,0,.8);font-family:var(--font);
}
.receipt-header{text-align:center;border-bottom:2px dashed #cbd5e1;padding-bottom:18px;margin-bottom:18px;}
.receipt-title{font-size:18px;font-weight:900;color:#0f172a;}
.receipt-row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;color:#475569;}
.receipt-row strong{color:#0f172a;}
.receipt-total{border-top:2px solid #0f172a;border-bottom:2px solid #0f172a;padding:10px 0;margin:14px 0;display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#0f172a;}

/* Modal & Toast */
#modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:300;padding:20px;}
.modal-box{background:var(--bg-900);border:1px solid var(--border-active);border-radius:18px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 30px 90px rgba(0,0,0,.85);}
.modal-header{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;}
.modal-body{padding:22px;display:flex;flex-direction:column;gap:16px;}
.close-btn{background:none;border:none;color:var(--text-400);font-size:18px;cursor:pointer;}
.close-btn:hover{color:#fff;}

#toast{position:fixed;bottom:24px;right:24px;background:var(--bg-800);border:1px solid var(--border-active);color:var(--text-100);padding:12px 20px;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.5);font-size:12px;display:none;z-index:9999;animation:fadeUp .25s ease;}

@media(max-width:920px){#sidebar{display:none;}#content{padding:14px;}}
</style>
</head>
<body>

<?php if (!$loggedIn): ?>
<!-- ══════════════════════════════════════════════════════════════════
     VISTA DE INICIO DE SESIÓN
     ══════════════════════════════════════════════════════════════════ -->
<div class="login-screen">
  <div class="login-blob login-blob-1"></div>
  <div class="login-blob login-blob-2"></div>

  <div class="login-box">
    <div class="login-brand">
      <div class="login-brand-icon">SC</div>
      <h1 class="login-brand-title">SCADA SENA-CIES</h1>
      <p class="login-brand-sub">Sistema de Monitoreo · Control de Acceso por Roles</p>
    </div>

    <!-- Guía interactiva de roles -->
    <div class="role-chips-guide">
      <div class="rcg-title">Acceso rápido de prueba:</div>
      
      <div class="role-card-mini">
        <div class="rcm-info">
          <div class="rcm-name">👑 Administrador</div>
          <div class="rcm-desc">Crear usuarios, dar roles, CSV y pagos</div>
        </div>
        <button type="button" class="rcm-btn" onclick="fillLogin('admin','admin123')">Usar</button>
      </div>

      <div class="role-card-mini">
        <div class="rcm-info">
          <div class="rcm-name">⭐ Supervisor / Personal Clave</div>
          <div class="rcm-desc">Acceso a TODOS los parámetros críticos</div>
        </div>
        <button type="button" class="rcm-btn" onclick="fillLogin('supervisor','super2026')">Usar</button>
      </div>

      <div class="role-card-mini">
        <div class="rcm-info">
          <div class="rcm-name">👤 Empleado General</div>
          <div class="rcm-desc">Solo visualiza parámetros generales</div>
        </div>
        <button type="button" class="rcm-btn" onclick="fillLogin('empleado','emp2026')">Usar</button>
      </div>
    </div>

    <?php if ($loginError): ?>
    <div style="background:var(--red-d);border:1px solid rgba(239,68,68,.3);color:var(--red);padding:10px 14px;border-radius:8px;font-size:12px;margin-bottom:14px;">
      ⚠️ <?= htmlspecialchars($loginError) ?>
    </div>
    <?php endif; ?>

    <form method="POST">
      <input type="hidden" name="action" value="login"/>
      <div class="form-group">
        <label class="form-label" for="u_field">Usuario</label>
        <input class="form-input" type="text" id="u_field" name="username" placeholder="ej: admin, supervisor, empleado" required/>
      </div>
      <div class="form-group">
        <label class="form-label" for="p_field">Contraseña</label>
        <input class="form-input" type="password" id="p_field" name="password" placeholder="••••••••" required/>
      </div>
      <button type="submit" class="submit-btn">Ingresar al Sistema</button>
    </form>
  </div>
</div>

<script>
function fillLogin(u,p){
  document.getElementById('u_field').value = u;
  document.getElementById('p_field').value = p;
}
</script>

<?php else: ?>
<!-- ══════════════════════════════════════════════════════════════════
     APLICACIÓN SCADA POST-LOGIN
     ══════════════════════════════════════════════════════════════════ -->
<div id="app">

  <!-- SIDEBAR -->
  <aside id="sidebar">
    <div class="sidebar-head">
      <div class="sb-logo">
        <div class="sb-logo-box">SC</div>
        <div>
          <div class="sb-title">SCADA SENA</div>
          <div class="sb-sub">SPS-01 · CIES 2026</div>
        </div>
      </div>
    </div>

    <nav class="sb-menu">
      <div class="sb-cat">Operación</div>
      <button class="sb-item active" data-tab="dashboard"><span class="ico">📊</span> Dashboard</button>
      <button class="sb-item" data-tab="equipment"><span class="ico">⚙️</span> Equipos Industriales</button>
      <button class="sb-item" data-tab="alerts"><span class="ico">🔔</span> Alertas ISA 18.2 <span class="sb-badge" id="alerts-count">2</span></button>

      <div class="sb-cat">Parámetros & Configuración</div>
      <button class="sb-item" data-tab="params">
        <span class="ico">📋</span> Parámetros del Sistema
        <?php if (!can('view_critical')): ?>
        <span style="margin-left:auto;font-size:9px;color:var(--green)">Solo Generales</span>
        <?php endif; ?>
      </button>

      <?php if (can('csv_import')): ?>
      <button class="sb-item" data-tab="csv">
        <span class="ico">📥</span> Carga CSV (Parámetros)
        <span class="sb-badge-admin">ADMIN</span>
      </button>
      <?php endif; ?>

      <div class="sb-cat">Facturación & Suscripción</div>
      <button class="sb-item" data-tab="payments">
        <span class="ico">💳</span> Pasarela de Pago
        <span class="sb-badge-pay">PRO</span>
      </button>

      <?php if (can('users')): ?>
      <div class="sb-cat">Administración</div>
      <button class="sb-item" data-tab="users">
        <span class="ico">👥</span> Usuarios & Roles
        <span class="sb-badge-admin">ADMIN</span>
      </button>
      <?php endif; ?>

      <div class="sb-cat">Diagnóstico</div>
      <button class="sb-item" data-tab="status"><span class="ico">🔌</span> Estado Servidor</button>
    </nav>

    <div class="sb-user-card">
      <div class="sb-user-row">
        <div class="sb-avatar" style="background:linear-gradient(135deg,<?= $rolColor ?>,<?= $rolColor ?>99)">
          <?= $rolIcon ?>
        </div>
        <div style="min-width:0">
          <div class="sb-user-name"><?= htmlspecialchars($userName) ?></div>
          <div class="sb-user-cargo"><?= htmlspecialchars($userCargo) ?></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="badge-pill" style="color:<?= $rolColor ?>;border-color:<?= $rolColor ?>55;background:<?= $rolColor ?>18;font-size:9.5px;">
          <?= $rolIcon ?> Rol: <?= $userRol ?>
        </span>
        <span style="font-family:var(--mono);font-size:9.5px;color:var(--text-400)">@<?= htmlspecialchars($userLogin) ?></span>
      </div>
      <a href="?logout" style="text-decoration:none">
        <button class="sb-logout-btn">🚪 Cerrar Sesión</button>
      </a>
    </div>
  </aside>

  <!-- CONTENIDO PRINCIPAL -->
  <div id="main-wrap">
    
    <header id="topbar">
      <div>
        <div class="top-title" id="page-heading">Dashboard de Monitoreo</div>
        <div class="top-sub">Planta de Producción e Inyección SPS-01</div>
      </div>
      <div class="top-right">
        <button class="btn-action btn-outline" onclick="switchTab('payments')" style="font-size:11px;padding:4px 10px;">
          💳 Pasarela de Pago
        </button>
        <div class="badge-pill" style="color:var(--green);border-color:rgba(34,197,94,.3);background:var(--green-d)">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block;animation:livePulse 1.8s infinite"></span>
          Sistema Operativo
        </div>
        <div class="badge-pill" style="color:<?= $rolColor ?>;border-color:<?= $rolColor ?>55;background:<?= $rolColor ?>18">
          <?= $rolIcon ?> <?= $userRol ?>
        </div>
        <div class="clock-text" id="live-clock">--:--:--</div>
      </div>
    </header>

    <!-- Barra de aviso de privilegios según Rol -->
    <div class="role-notice-bar rnb-<?= $userRol ?>">
      <?php if ($userRol === 'ADMIN'): ?>
        <span>👑 <strong>Modo Administrador:</strong> Control total. Puedes <strong>crear más usuarios, asignarles roles</strong>, ingresar datos vía CSV y gestionar pagos.</span>
        <div style="display:flex;gap:6px;">
          <button class="btn-action btn-outline" style="padding:2px 8px;font-size:10px;" onclick="switchTab('users')">👥 Gestionar Usuarios</button>
          <button class="btn-action btn-violet" style="padding:2px 8px;font-size:10px;" onclick="switchTab('csv')">📥 Carga CSV</button>
        </div>
      <?php elseif ($userRol === 'SUPERVISOR'): ?>
        <span>⭐ <strong>Rol Supervisor / Personal Clave:</strong> Tienes acceso a los <strong>parámetros más importantes y críticos</strong> (presión, reactores, potencia, alarmas).</span>
        <span style="font-size:10px;opacity:.85">Telemetría Crítica Desbloqueada ✓</span>
      <?php elseif ($userRol === 'EMPLEADO'): ?>
        <span>👤 <strong>Rol Empleado General:</strong> Solo puedes visualizar <strong>parámetros generales</strong> de funcionamiento. Los parámetros críticos están protegidos.</span>
        <span style="font-size:10px;opacity:.85">🔒 Parámetros Críticos Protegidos</span>
      <?php else: ?>
        <span>👁️ <strong>Rol Auditor:</strong> Acceso de solo lectura para trazabilidad y cumplimiento de normas.</span>
      <?php endif; ?>
    </div>

    <main id="content">

      <!-- ╔═════════ VISTA 1: DASHBOARD ═════════╗ -->
      <div class="view active" id="view-dashboard">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Disponibilidad Planta <span style="color:var(--green)">+98.2%</span></div>
            <div class="kpi-val">98.2 <span class="kpi-unit">%</span></div>
            <div class="kpi-foot">Meta industrial: ≥ 95.0%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Tiempo Detección <span style="color:var(--green)">-54 seg</span></div>
            <div class="kpi-val">2.1 <span class="kpi-unit">min</span></div>
            <div class="kpi-foot">Norma ISA 18.2: ≤ 5.0 min</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Activos Monitoreados</div>
            <div class="kpi-val" id="kpi-total-eq">8 <span class="kpi-unit">activos</span></div>
            <div class="kpi-foot" id="kpi-activos-sub">4 campos operativos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Parámetros Cargados</div>
            <div class="kpi-val" id="kpi-total-params">-- <span class="kpi-unit">vars</span></div>
            <div class="kpi-foot" id="kpi-params-foot">Base de datos SCADA</div>
          </div>
        </div>

        <?php if (!can('view_critical')): ?>
        <div style="background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.25);padding:12px 18px;border-radius:12px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">ℹ️</span>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text-100)">Vista de Empleado Operativo</div>
            <div style="font-size:11px;color:var(--text-400)">Estás visualizando únicamente parámetros generales como caudal, nivel de llenado y estado operativo. Los parámetros de alta criticidad requieren credenciales de Supervisor o Administrador.</div>
          </div>
        </div>
        <?php endif; ?>

        <!-- Toolbar Filtros -->
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input type="text" id="eq-search" placeholder="🔍 Buscar por código o nombre..." oninput="filterCards()"
                 style="background:var(--bg-900);border:1px solid var(--border);border-radius:8px;padding:8px 14px;color:#fff;font-size:12px;outline:none;min-width:240px;"/>
          <select id="eq-filter-type" onchange="filterCards()" style="background:var(--bg-900);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:#fff;font-size:12px;outline:none;">
            <option value="">Todos los Tipos de Equipo</option>
            <option value="CABEZA_POZO">Cabezas de Pozo</option>
            <option value="VFD">Variadores VFD</option>
            <option value="SEPARADOR">Separadores</option>
            <option value="TANQUE">Tanques de Almacenamiento</option>
            <option value="BOMBA">Bombas Booster</option>
          </select>
          <div style="margin-left:auto;font-size:11px;color:var(--text-400)" id="eq-count-lbl">8 equipos en línea</div>
        </div>

        <div class="eq-grid" id="dashboard-eq-grid"></div>
      </div>

      <!-- ╔═════════ VISTA 2: EQUIPOS DETALLE ═════════╗ -->
      <div class="view" id="view-equipment">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">Catálogo Maestro de Equipos</h2>
          <p style="font-size:11px;color:var(--text-400)">Detalle de especificaciones e instrumentación en campo</p>
        </div>
        <div class="eq-grid" id="full-eq-grid"></div>
      </div>

      <!-- ╔═════════ VISTA 3: ALERTAS ISA 18.2 ═════════╗ -->
      <div class="view" id="view-alerts">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">Alarmas y Eventos Industriales</h2>
          <p style="font-size:11px;color:var(--text-400)">Gestión conforme a la norma ISA 18.2 para control de procesos</p>
        </div>
        <div id="alerts-container" style="display:flex;flex-direction:column;gap:10px;"></div>
      </div>

      <!-- ╔═════════ VISTA 4: PARÁMETROS DEL SISTEMA ═════════╗ -->
      <div class="view" id="view-params">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">Parámetros Operacionales del Sistema</h2>
            <p style="font-size:11px;color:var(--text-400)">
              <?php if (can('view_critical')): ?>
                Visualizando <strong>TODOS los parámetros</strong> (Generales y Críticos).
              <?php else: ?>
                Visualizando únicamente <strong>parámetros generales</strong>. Parámetros críticos protegidos.
              <?php endif; ?>
            </p>
          </div>
          <?php if (can('csv_import')): ?>
          <div style="display:flex;gap:8px;">
            <a href="?req=download_template" class="btn-action btn-outline">📥 Descargar Plantilla CSV</a>
            <button class="btn-action btn-violet" onclick="switchTab('csv')">⚡ Ingresar Parámetros CSV</button>
          </div>
          <?php endif; ?>
        </div>

        <div class="params-table-container">
          <div class="table-head-bar">
            <span style="font-weight:700;font-size:13px;color:var(--text-100)">Tabla de Variables & Umbrales SCADA</span>
            <span style="font-size:11px;color:var(--text-400)" id="pt-stats">Cargando...</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="pt-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo / Activo</th>
                  <th>Parámetro / Variable</th>
                  <th>Valor Actual</th>
                  <th>Rango Normal</th>
                  <th>Criticidad</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody id="params-table-body"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ╔═════════ VISTA 5: INGRESO CSV (ADMIN) ═════════╗ -->
      <?php if (can('csv_import')): ?>
      <div class="view" id="view-csv">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">Ingreso de Datos y Parámetros desde CSV</h2>
            <p style="font-size:11px;color:var(--text-400)">Módulo exclusivo para el rol de <strong>ADMINISTRADOR</strong>. Permite cargar configuraciones de proceso y umbrales masivos.</p>
          </div>
          <a href="?req=download_template" class="btn-action btn-outline">
            📥 Descargar Plantilla de Ejemplo (.csv)
          </a>
        </div>

        <div class="params-table-container" style="padding:22px;">
          <div class="csv-dropzone" id="csv-dropzone" onclick="document.getElementById('csv-file-input').click()"
               style="border:2px dashed var(--violet-500);border-radius:14px;padding:26px;text-align:center;background:rgba(124,58,237,.05);cursor:pointer;">
            <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none" onchange="handleFileSelected(event)"/>
            <div style="font-size:36px;margin-bottom:8px;">📄</div>
            <div style="font-size:14px;font-weight:700;color:var(--text-100)">Haz clic aquí o arrastra un archivo CSV con los parámetros</div>
            <div style="font-size:11px;color:var(--text-400);margin-top:4px;">Columnas: codigo, nombre, parametro, valor, unidad, min, max, criticidad, ubicacion</div>
          </div>

          <div style="margin-top:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-400)">O pega texto en formato CSV directamente:</label>
              <button class="btn-action btn-outline" style="padding:2px 8px;font-size:10px;" onclick="fillCsvExample()">Cargar Ejemplo</button>
            </div>
            <textarea id="csv-raw-input" rows="5" placeholder="codigo,nombre,parametro,valor,unidad,min,max,criticidad,ubicacion&#10;PZ-LIZ-104,Cabeza Pozo,Presión en Cabeza,542.4,PSI,400,650,CRITICO,Campo Lizama"
                      style="width:100%;background:var(--bg-800);border:1px solid var(--border);border-radius:10px;padding:12px;font-family:var(--mono);font-size:11px;color:#fff;outline:none;resize:vertical;"></textarea>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:16px;">
            <div style="display:flex;gap:10px;align-items:center;">
              <label style="font-size:11px;color:var(--text-400);display:flex;align-items:center;gap:6px;">
                <input type="radio" name="csv_mode" value="replace" checked/> Reemplazar todos
              </label>
              <label style="font-size:11px;color:var(--text-400);display:flex;align-items:center;gap:6px;">
                <input type="radio" name="csv_mode" value="append"/> Agregar a existentes
              </label>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn-action btn-amber" onclick="resetToDefaults()">↺ Restablecer Fábrica</button>
              <button type="button" class="btn-action btn-violet" id="btn-process-csv" onclick="processCsvUpload()">
                🚀 Procesar e Importar CSV
              </button>
            </div>
          </div>

          <div id="csv-result-box" style="margin-top:16px;display:none;"></div>
        </div>
      </div>
      <?php endif; ?>

      <!-- ╔═════════ VISTA 6: PASARELA DE PAGO & SUSCRIPCIONES ═════════╗ -->
      <div class="view" id="view-payments">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">💳 Pasarela de Pago & Suscripciones SCADA</h2>
            <p style="font-size:11px;color:var(--text-400)">Selecciona un plan de licenciamiento industrial y procesa tu pago con seguridad encriptada SSL 256-bit.</p>
          </div>
          <button class="btn-action btn-outline" onclick="loadPaymentTransactions()">📜 Ver Historial de Pagos</button>
        </div>

        <!-- Cuadrícula de Planes -->
        <div class="pricing-grid">
          
          <!-- Plan Empleado -->
          <div class="pricing-card" id="plan-card-1">
            <div class="plan-name">Plan Starter Operativo</div>
            <div class="plan-desc">Ideal para cuadrillas de operarios y visualización de parámetros generales en campo.</div>
            <div class="plan-price">$29 <span>/ mes (USD)</span></div>
            <div style="font-size:10px;color:var(--text-400);margin-bottom:12px;">Equivalente aprox: ~$119.000 COP</div>
            <ul class="plan-features">
              <li><span>✓</span> Hasta 5 Cuentas con Rol Empleado</li>
              <li><span>✓</span> Visualización de Parámetros Generales</li>
              <li><span>✓</span> Monitoreo en Tiempo Real (5 seg)</li>
              <li><span>✓</span> Registro básico de alarmas</li>
              <li style="color:var(--text-600)">✕ Telemetría crítica bloqueada</li>
              <li style="color:var(--text-600)">✕ Sin carga masiva CSV</li>
            </ul>
            <button class="btn-action btn-outline" style="width:100%;justify-content:center;margin-top:auto;"
                    onclick="selectPlan('Plan Starter Operativo', 29.00, 'USD')">
              Seleccionar Plan
            </button>
          </div>

          <!-- Plan Supervisor (Destacado) -->
          <div class="pricing-card featured" id="plan-card-2">
            <div class="pricing-ribbon">⭐ Más Recomendado</div>
            <div class="plan-name" style="color:var(--violet-400)">Plan Industrial Supervisor</div>
            <div class="plan-desc">Para jefes de planta, ingenieros de control y supervisión de variables críticas.</div>
            <div class="plan-price">$89 <span>/ mes (USD)</span></div>
            <div style="font-size:10px;color:var(--text-400);margin-bottom:12px;">Equivalente aprox: ~$359.000 COP</div>
            <ul class="plan-features">
              <li><span>✓</span> 15 Cuentas (Supervisores + Empleados)</li>
              <li><span>✓</span> <strong>Acceso a TODOS los Parámetros Críticos</strong></li>
              <li><span>✓</span> Presión, temperatura reactores, variadores</li>
              <li><span>✓</span> Gestión y Reconocimiento de Alarmas ISA 18.2</li>
              <li><span>✓</span> Histórico de telemetría y tendencias</li>
              <li><span>✓</span> Soporte prioritario 24/7</li>
            </ul>
            <button class="btn-action btn-violet" style="width:100%;justify-content:center;margin-top:auto;"
                    onclick="selectPlan('Plan Industrial Supervisor', 89.00, 'USD')">
              ⚡ Contratar Plan Supervisor
            </button>
          </div>

          <!-- Plan Enterprise -->
          <div class="pricing-card" id="plan-card-3">
            <div class="plan-name">Plan Enterprise Master</div>
            <div class="plan-desc">Solución corporativa completa para administradores con carga masiva y multi-planta.</div>
            <div class="plan-price">$249 <span>/ mes (USD)</span></div>
            <div style="font-size:10px;color:var(--text-400);margin-bottom:12px;">Equivalente aprox: ~$999.000 COP</div>
            <ul class="plan-features">
              <li><span>✓</span> <strong>Usuarios y Roles Ilimitados</strong></li>
              <li><span>✓</span> <strong>Módulo de Carga CSV Masiva Ilimitada</strong></li>
              <li><span>✓</span> Creación libre de roles y permisos RBAC</li>
              <li><span>✓</span> Conectividad OPC-UA, Modbus y Python</li>
              <li><span>✓</span> Facturación electrónica corporativa</li>
              <li><span>✓</span> SLA de disponibilidad 99.9% garantizado</li>
            </ul>
            <button class="btn-action btn-outline" style="width:100%;justify-content:center;margin-top:auto;"
                    onclick="selectPlan('Plan Enterprise Master', 249.00, 'USD')">
              Seleccionar Plan
            </button>
          </div>
        </div>

        <!-- Módulo de Checkout Interactivo -->
        <div class="params-table-container" style="padding:24px;" id="checkout-section">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:20px;">
            <div>
              <div style="font-size:15px;font-weight:800;color:var(--text-100)">Checkout de Pago Seguro</div>
              <div style="font-size:11px;color:var(--text-400)">Plan actual a pagar: <strong id="checkout-plan-lbl" style="color:var(--violet-400)">Plan Industrial Supervisor</strong></div>
            </div>
            <div style="font-size:22px;font-weight:900;color:var(--green)" id="checkout-total-lbl">$89.00 USD</div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;">
            
            <!-- Columna Izquierda: Tarjeta Interactiva 3D Preview -->
            <div>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-400);margin-bottom:12px;">Tarjeta de Crédito / Débito Virtual:</div>
              <div class="card-preview-wrap">
                <div class="interactive-card" id="card-3d">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div class="card-chip">CHIP</div>
                    <div class="card-network-logo" id="card-network-logo">VISA</div>
                  </div>
                  <div class="card-num-display" id="card-num-preview">•••• •••• •••• ••••</div>
                  <div class="card-footer-row">
                    <div>
                      <div style="font-size:8px;text-transform:uppercase;opacity:.8">Titular</div>
                      <div class="card-holder-name" id="card-name-preview"><?= htmlspecialchars(strtoupper($userName)) ?></div>
                    </div>
                    <div>
                      <div style="font-size:8px;text-transform:uppercase;opacity:.8">Expira</div>
                      <div class="card-exp-date" id="card-exp-preview">12/28</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Métodos de Pago alternativos -->
              <div style="background:var(--bg-800);border:1px solid var(--border);border-radius:12px;padding:12px;">
                <div style="font-size:10.5px;font-weight:700;color:var(--text-400);text-transform:uppercase;margin-bottom:8px;">Métodos de Pago Soportados:</div>
                <div style="display:flex;gap:10px;align-items:center;font-size:11px;color:var(--text-300);">
                  <span>💳 Tarjeta Crédito/Débito</span> ·
                  <span>🏦 PSE Colombia</span> ·
                  <span>📱 Nequi / Daviplata</span>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Formulario de Pago -->
            <div>
              <form id="payment-form" onsubmit="event.preventDefault();submitPayment();">
                <input type="hidden" id="pay-plan-name" value="Plan Industrial Supervisor"/>
                <input type="hidden" id="pay-amount" value="89.00"/>
                <input type="hidden" id="pay-currency" value="USD"/>

                <div class="form-group">
                  <label class="form-label">Método de Pago</label>
                  <select class="form-input" id="pay-method" onchange="togglePaymentFields()">
                    <option value="Tarjeta de Crédito / Débito">💳 Tarjeta de Crédito / Débito (Visa, MC, Amex)</option>
                    <option value="PSE Transferencia Bancaria">🏦 PSE — Débito Bancario (Bancolombia, Davivienda, etc.)</option>
                    <option value="Nequi / Daviplata">📱 Nequi / Daviplata (Transferencia Móvil)</option>
                  </select>
                </div>

                <div id="card-fields-group">
                  <div class="form-group">
                    <label class="form-label">Nombre del Titular</label>
                    <input class="form-input" type="text" id="pay-card-name" value="<?= htmlspecialchars($userName) ?>" oninput="updateCardPreview()" required/>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Número de Tarjeta</label>
                    <input class="form-input" type="text" id="pay-card-num" placeholder="4532 8920 1824 9021" maxlength="19" oninput="formatCardNumber(this)" required/>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                      <label class="form-label">Expiración (MM/AA)</label>
                      <input class="form-input" type="text" id="pay-card-exp" placeholder="12/28" maxlength="5" oninput="updateCardPreview()" required/>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Código CVV</label>
                      <input class="form-input" type="password" id="pay-card-cvv" placeholder="•••" maxlength="4" required/>
                    </div>
                  </div>
                </div>

                <div id="pse-fields-group" style="display:none;">
                  <div class="form-group">
                    <label class="form-label">Selecciona tu Banco</label>
                    <select class="form-input">
                      <option>Bancolombia</option>
                      <option>Banco de Bogotá</option>
                      <option>Davivienda</option>
                      <option>Banco BBVA</option>
                      <option>Nequi</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tipo de Persona</label>
                    <select class="form-input">
                      <option>Persona Natural</option>
                      <option>Persona Jurídica (Empresa)</option>
                    </select>
                  </div>
                </div>

                <div id="nequi-fields-group" style="display:none;text-align:center;padding:14px;background:var(--bg-800);border-radius:10px;margin-bottom:12px;">
                  <div style="font-size:12px;color:var(--text-200);margin-bottom:6px;">Ingresa tu número celular registrado en <strong>Nequi</strong>:</div>
                  <input class="form-input" type="text" placeholder="300 123 4567" style="max-width:240px;margin:0 auto;text-align:center;font-size:15px;"/>
                  <div style="font-size:10px;color:var(--text-400);margin-top:6px;">Recibirás una notificación push para autorizar el cobro.</div>
                </div>

                <button type="submit" class="submit-btn" id="btn-pay-now" style="margin-top:10px;">
                  🔒 Pagar con Seguridad Bancaria SSL 256-bit
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Historial de Transacciones Registradas -->
        <div class="params-table-container" style="margin-top:10px;">
          <div class="table-head-bar">
            <span style="font-weight:700;font-size:13px;color:var(--text-100)">📜 Historial de Pagos & Facturas Emitidas</span>
            <span style="font-size:11px;color:var(--text-400)" id="tx-count-lbl">Cargando...</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="pt-table">
              <thead>
                <tr>
                  <th>ID Transacción</th>
                  <th>Fecha & Hora</th>
                  <th>Plan Contratado</th>
                  <th>Monto</th>
                  <th>Método de Pago</th>
                  <th>Estado</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody id="tx-table-body"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ╔═════════ VISTA 7: GESTIÓN DE USUARIOS Y ROLES (ADMIN) ═════════╗ -->
      <?php if (can('users')): ?>
      <div class="view" id="view-users">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">👥 Gestión de Usuarios y Asignación de Roles</h2>
            <p style="font-size:11px;color:var(--text-400)">Como Administrador, puedes crear nuevos usuarios, asignarles roles en tiempo real y controlar sus accesos.</p>
          </div>
          <button class="btn-action btn-violet" onclick="openCreateUserModal()">
            ➕ Crear Nuevo Usuario
          </button>
        </div>

        <!-- Matriz de Roles -->
        <div class="params-table-container">
          <div class="table-head-bar">
            <span style="font-weight:700;font-size:13px;color:var(--text-100)">Catálogo de Usuarios Registrados en SCADA</span>
            <span style="font-size:11px;color:var(--text-400)" id="users-count-lbl">Cargando usuarios...</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="pt-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre Completo</th>
                  <th>Cargo / Área</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Actual</th>
                  <th>Cambiar Rol (En Vivo)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="users-table-body"></tbody>
            </table>
          </div>
        </div>

        <!-- Matriz Explicativa de Permisos -->
        <div class="params-table-container" style="margin-top:10px;">
          <div class="table-head-bar">
            <span style="font-weight:700;font-size:13px;color:var(--text-100)">Resumen de Privilegios por Rol</span>
          </div>
          <table class="pt-table">
            <thead>
              <tr>
                <th>Capacidad del Sistema</th>
                <th style="text-align:center"><span class="badge-criticidad ADMIN">👑 ADMIN</span></th>
                <th style="text-align:center"><span class="badge-criticidad SUPERVISOR">⭐ SUPERVISOR</span></th>
                <th style="text-align:center"><span class="badge-criticidad EMPLEADO">👤 EMPLEADO</span></th>
                <th style="text-align:center"><span class="badge-criticidad AUDITOR">👁️ AUDITOR</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Crear Usuarios y Asignar Roles</strong></td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--text-600)">—</td>
                <td style="text-align:center;color:var(--text-600)">—</td>
                <td style="text-align:center;color:var(--text-600)">—</td>
              </tr>
              <tr>
                <td><strong>Ingreso de Parámetros desde CSV</strong></td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--text-600)">—</td>
                <td style="text-align:center;color:var(--text-600)">—</td>
                <td style="text-align:center;color:var(--text-600)">—</td>
              </tr>
              <tr>
                <td><strong>Visualizar Parámetros Críticos/Importantes</strong></td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--red);font-weight:bold">🔒 Bloqueado</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
              </tr>
              <tr>
                <td><strong>Visualizar Parámetros Generales</strong></td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
              </tr>
              <tr>
                <td><strong>Pasarela de Pago y Suscripciones</strong></td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
                <td style="text-align:center;color:var(--green);font-weight:bold">✓ Sí</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <?php endif; ?>

      <!-- ╔═════════ VISTA 8: ESTADO CONEXIÓN ═════════╗ -->
      <div class="view" id="view-status">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text-100)">Diagnóstico de Servidor & Conexión</h2>
          <p style="font-size:11px;color:var(--text-400)">Servidor Apache / PHP en XAMPP Local</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;max-width:540px;" id="status-cards-box"></div>
      </div>

    </main>
  </div>
</div>

<!-- Modal Genérico / Equipo / Factura / Crear Usuario -->
<div id="modal-wrap" onclick="if(event.target===this)closeModal()">
  <div class="modal-box" id="main-modal-box">
    <div class="modal-header">
      <div style="font-size:16px;font-weight:800;color:var(--text-100)" id="modal-title">—</div>
      <button class="close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" id="modal-content"></div>
  </div>
</div>

<!-- Toast Notificaciones -->
<div id="toast"></div>

<script>
/* ══════════════════════════════════════════════════════════════════
   LÓGICA JAVASCRIPT: ROLES, PAGOS, CSV Y USUARIOS
   ══════════════════════════════════════════════════════════════════ */
const USER_ROLE    = <?= json_encode($userRol) ?>;
const CAN_CRITICAL = <?= json_encode(can('view_critical')) ?>;
const CAN_CSV      = <?= json_encode(can('csv_import')) ?>;
const CAN_USERS    = <?= json_encode(can('users')) ?>;

let EQUIPOS = [];
let PARAMETROS = [];
let ALERTAS = [];
let USUARIOS = [];
let TRANSACCIONES = [];

// Reloj en vivo
setInterval(() => {
  const el = document.getElementById('live-clock');
  if(el) el.textContent = new Date().toLocaleTimeString('es-CO');
}, 1000);

// Navegación
const TAB_TITLES = {
  dashboard: 'Dashboard de Monitoreo',
  equipment: 'Catálogo Maestro de Equipos',
  alerts: 'Alarmas y Eventos Industriales',
  params: 'Parámetros Operacionales',
  csv: 'Ingreso de Parámetros desde CSV',
  payments: 'Pasarela de Pago & Suscripciones',
  users: 'Gestión de Usuarios & Roles',
  status: 'Diagnóstico de Servidor'
};

document.querySelectorAll('.sb-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tabId) {
  document.querySelectorAll('.sb-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + tabId));
  const h = document.getElementById('page-heading');
  if(h) h.textContent = TAB_TITLES[tabId] || 'SCADA SENA';
  if(tabId === 'users') loadUsersList();
  if(tabId === 'payments') loadPaymentTransactions();
  if(tabId === 'status') renderStatusView();
}

// Cargar Datos
async function loadEquipos() {
  try {
    const res = await fetch('?req=equipment');
    const json = await res.json();
    EQUIPOS = json.data || [];
    renderDashboardEquipos(EQUIPOS);
    renderFullEquipos(EQUIPOS);
  } catch (err) { console.error(err); }
}

async function loadParametros() {
  try {
    const res = await fetch('?req=params');
    const json = await res.json();
    PARAMETROS = json.data || [];
    renderParametrosTable(PARAMETROS);
    document.getElementById('kpi-total-params').textContent = PARAMETROS.length;
  } catch (err) { console.error(err); }
}

async function loadAlertas() {
  try {
    const res = await fetch('?req=alerts');
    const json = await res.json();
    ALERTAS = json.data || [];
    renderAlerts(ALERTAS);
  } catch (err) { console.error(err); }
}

// ══════════════════════════════════════════════════════════════════
// GESTIÓN DE USUARIOS Y ASIGNACIÓN DE ROLES (ADMIN)
// ══════════════════════════════════════════════════════════════════
async function loadUsersList() {
  if (!CAN_USERS) return;
  try {
    const res = await fetch('?req=get_users');
    const json = await res.json();
    USUARIOS = json.data || [];
    renderUsersTable(USUARIOS);
  } catch (err) { console.error(err); }
}

function renderUsersTable(list) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  document.getElementById('users-count-lbl').textContent = `${list.length} usuarios registrados`;

  tbody.innerHTML = list.map(u => {
    const isSelf = u.username === '<?= $userLogin ?>';
    const isMainAdmin = u.username === 'admin';

    return `
      <tr>
        <td style="font-family:var(--mono);font-weight:700;color:var(--violet-400)">@${u.username}</td>
        <td><strong style="color:var(--text-100)">${u.nombre}</strong> ${isSelf ? '<span style="font-size:9.5px;color:var(--violet-400);">(Tú)</span>' : ''}</td>
        <td style="font-size:11px;color:var(--text-300)">${u.cargo || '—'}</td>
        <td style="font-size:11px;color:var(--text-400)">${u.email || '—'}</td>
        <td><span class="badge-criticidad ${u.rol}">${u.rol}</span></td>
        <td>
          <select onchange="updateUserRole('${u.username}', this.value)" style="background:var(--bg-800);border:1px solid var(--border);border-radius:6px;color:#fff;padding:4px 8px;font-size:11px;outline:none;" ${isMainAdmin ? 'disabled title="El administrador principal no puede ser modificado"' : ''}>
            <option value="ADMIN" ${u.rol==='ADMIN'?'selected':''}>👑 ADMIN</option>
            <option value="SUPERVISOR" ${u.rol==='SUPERVISOR'?'selected':''}>⭐ SUPERVISOR</option>
            <option value="EMPLEADO" ${u.rol==='EMPLEADO'?'selected':''}>👤 EMPLEADO</option>
            <option value="AUDITOR" ${u.rol==='AUDITOR'?'selected':''}>👁️ AUDITOR</option>
          </select>
        </td>
        <td>
          ${(!isMainAdmin && !isSelf) ? `
            <button class="btn-action btn-red" style="padding:3px 8px;font-size:10px;" onclick="deleteUser('${u.username}')">
              🗑️ Eliminar
            </button>` : `<span style="color:var(--text-600);font-size:10px;">Protegido</span>`}
        </td>
      </tr>`;
  }).join('');
}

// Modal Crear Usuario
function openCreateUserModal() {
  document.getElementById('modal-title').textContent = '➕ Crear Nuevo Usuario en SCADA';
  document.getElementById('modal-content').innerHTML = `
    <form id="create-user-form" onsubmit="event.preventDefault();submitCreateUser();">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Nombre de Usuario (Login)</label>
          <input class="form-input" type="text" id="nu-username" placeholder="ej: jgomez" required/>
        </div>
        <div class="form-group">
          <label class="form-label">Rol Asignado</label>
          <select class="form-input" id="nu-rol">
            <option value="SUPERVISOR">⭐ SUPERVISOR (Parámetros Críticos)</option>
            <option value="EMPLEADO" selected>👤 EMPLEADO (Solo Generales)</option>
            <option value="ADMIN">👑 ADMIN (Control Total & CSV)</option>
            <option value="AUDITOR">👁️ AUDITOR (Solo Lectura)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre Completo</label>
        <input class="form-input" type="text" id="nu-nombre" placeholder="ej: Ing. Javier Gómez" required/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Cargo o Posición</label>
          <input class="form-input" type="text" id="nu-cargo" placeholder="ej: Ingeniero de Campo"/>
        </div>
        <div class="form-group">
          <label class="form-label">Correo Electrónico</label>
          <input class="form-input" type="email" id="nu-email" placeholder="j.gomez@scada-cies.edu.co"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña de Acceso</label>
        <input class="form-input" type="password" id="nu-pass" placeholder="••••••••" required/>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button type="button" class="btn-action btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn-action btn-violet">Guardar Usuario</button>
      </div>
    </form>`;
  document.getElementById('modal-wrap').style.display = 'flex';
}

async function submitCreateUser() {
  const fd = new FormData();
  fd.append('username', document.getElementById('nu-username').value.trim());
  fd.append('nombre', document.getElementById('nu-nombre').value.trim());
  fd.append('cargo', document.getElementById('nu-cargo').value.trim());
  fd.append('email', document.getElementById('nu-email').value.trim());
  fd.append('password', document.getElementById('nu-pass').value);
  fd.append('rol', document.getElementById('nu-rol').value);

  try {
    const res = await fetch('?req=create_user', { method: 'POST', body: fd });
    const json = await res.json();
    if (res.ok && json.status === 'success') {
      showToast('✅ ' + json.message);
      closeModal();
      loadUsersList();
    } else {
      alert('Error: ' + (json.error || 'No se pudo crear el usuario.'));
    }
  } catch (err) { alert('Error de red: ' + err.message); }
}

async function updateUserRole(username, newRole) {
  const fd = new FormData();
  fd.append('username', username);
  fd.append('new_role', newRole);

  try {
    const res = await fetch('?req=update_role', { method: 'POST', body: fd });
    const json = await res.json();
    if (res.ok && json.status === 'success') {
      showToast('✅ ' + json.message);
      loadUsersList();
    } else {
      alert('Error: ' + (json.error || 'No se pudo actualizar el rol.'));
    }
  } catch (err) { alert('Error: ' + err.message); }
}

async function deleteUser(username) {
  if (!confirm(`¿Estás seguro de eliminar al usuario @${username}?`)) return;
  const fd = new FormData();
  fd.append('username', username);

  try {
    const res = await fetch('?req=delete_user', { method: 'POST', body: fd });
    const json = await res.json();
    if (res.ok && json.status === 'success') {
      showToast('Usuario eliminado.');
      loadUsersList();
    } else {
      alert('Error: ' + (json.error || 'No se pudo eliminar.'));
    }
  } catch (err) { alert('Error: ' + err.message); }
}

// ══════════════════════════════════════════════════════════════════
// PASARELA DE PAGO INTERACTIVA
// ══════════════════════════════════════════════════════════════════
function selectPlan(nombre, precio, moneda) {
  document.getElementById('checkout-plan-lbl').textContent = nombre;
  document.getElementById('checkout-total-lbl').textContent = `$${precio.toFixed(2)} ${moneda}`;
  document.getElementById('pay-plan-name').value = nombre;
  document.getElementById('pay-amount').value = precio.toFixed(2);
  document.getElementById('pay-currency').value = moneda;

  document.getElementById('checkout-section').scrollIntoView({ behavior: 'smooth' });
  showToast(`Plan "${nombre}" seleccionado para checkout.`);
}

function togglePaymentFields() {
  const m = document.getElementById('pay-method').value;
  document.getElementById('card-fields-group').style.display = m.includes('Tarjeta') ? 'block' : 'none';
  document.getElementById('pse-fields-group').style.display  = m.includes('PSE') ? 'block' : 'none';
  document.getElementById('nequi-fields-group').style.display= m.includes('Nequi') ? 'block' : 'none';
}

function formatCardNumber(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  let parts = [];
  for (let i = 0; i < v.length; i += 4) { parts.push(v.substring(i, i + 4)); }
  input.value = parts.join(' ');
  updateCardPreview();
}

function updateCardPreview() {
  const num = document.getElementById('pay-card-num').value.trim() || '•••• •••• •••• ••••';
  const name = document.getElementById('pay-card-name').value.trim() || 'TITULAR DE LA TARJETA';
  const exp = document.getElementById('pay-card-exp').value.trim() || '12/28';

  document.getElementById('card-num-preview').textContent = num;
  document.getElementById('card-name-preview').textContent = name.toUpperCase();
  document.getElementById('card-exp-preview').textContent = exp;

  const logo = document.getElementById('card-network-logo');
  if (num.startsWith('5')) { logo.textContent = 'MASTERCARD'; }
  else if (num.startsWith('3')) { logo.textContent = 'AMEX'; }
  else { logo.textContent = 'VISA'; }
}

async function submitPayment() {
  const btn = document.getElementById('btn-pay-now');
  btn.textContent = '⏳ Verificando con la Pasarela Bancaria...';
  btn.disabled = true;

  const planName = document.getElementById('pay-plan-name').value;
  const monto    = document.getElementById('pay-amount').value;
  const metodo   = document.getElementById('pay-method').value;
  const titular  = document.getElementById('pay-card-name').value;
  const moneda   = document.getElementById('pay-currency').value;

  const fd = new FormData();
  fd.append('plan_nombre', planName);
  fd.append('monto', monto);
  fd.append('metodo', metodo);
  fd.append('titular', titular);
  fd.append('moneda', moneda);

  setTimeout(async () => {
    try {
      const res = await fetch('?req=process_payment', { method: 'POST', body: fd });
      const json = await res.json();
      btn.textContent = '🔒 Pagar con Seguridad Bancaria SSL 256-bit';
      btn.disabled = false;

      if (res.ok && json.status === 'success') {
        showReceiptModal(json.transaction);
        loadPaymentTransactions();
      } else {
        alert('Error en pasarela: ' + (json.error || 'Rechazo bancario.'));
      }
    } catch (err) {
      btn.textContent = '🔒 Pagar con Seguridad Bancaria SSL 256-bit';
      btn.disabled = false;
      alert('Error de conexión: ' + err.message);
    }
  }, 1400);
}

function showReceiptModal(tx) {
  document.getElementById('modal-title').textContent = '🧾 Factura Digital / Comprobante de Pago Aprobado';
  document.getElementById('modal-content').innerHTML = `
    <div class="receipt-box">
      <div class="receipt-header">
        <div style="font-size:32px;margin-bottom:6px;">✅</div>
        <div class="receipt-title">RECIBO DE PAGO SCADA SENA-CIES</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Transacción Aprobada por Pasarela Bancaria</div>
      </div>
      <div class="receipt-row"><span>ID Transacción:</span> <strong>${tx.id}</strong></div>
      <div class="receipt-row"><span>Código Autorización:</span> <strong>${tx.autorizacion}</strong></div>
      <div class="receipt-row"><span>Fecha & Hora:</span> <strong>${tx.fecha}</strong></div>
      <div class="receipt-row"><span>Titular / Empresa:</span> <strong>${tx.titular}</strong></div>
      <div class="receipt-row"><span>Método de Pago:</span> <strong>${tx.metodo}</strong></div>
      <div class="receipt-row"><span>Plan Activado:</span> <strong>${tx.plan_nombre}</strong></div>
      
      <div class="receipt-total">
        <span>TOTAL PAGADO:</span>
        <span>$${parseFloat(tx.monto).toFixed(2)} ${tx.moneda}</span>
      </div>

      <div style="font-size:10px;color:#94a3b8;text-align:center;margin-top:14px;line-height:1.4;">
        Este recibo certifica la suscripción activa al sistema SCADA SENA-CIES. Guarda este comprobante para soporte técnico y auditoría.
      </div>

      <div style="display:flex;justify-content:center;gap:10px;margin-top:18px;">
        <button class="btn-action btn-violet" onclick="window.print()">🖨️ Imprimir Factura</button>
        <button class="btn-action btn-outline" onclick="closeModal()">Cerrar</button>
      </div>
    </div>`;
  document.getElementById('modal-wrap').style.display = 'flex';
}

async function loadPaymentTransactions() {
  try {
    const res = await fetch('?req=get_transactions');
    const json = await res.json();
    TRANSACCIONES = json.data || [];
    renderTransactionsTable(TRANSACCIONES);
  } catch (err) { console.error(err); }
}

function renderTransactionsTable(list) {
  const tbody = document.getElementById('tx-table-body');
  if (!tbody) return;
  document.getElementById('tx-count-lbl').textContent = `${list.length} transacciones registradas`;

  tbody.innerHTML = list.map(tx => `
    <tr>
      <td style="font-family:var(--mono);font-weight:700;color:var(--violet-400)">${tx.id}</td>
      <td style="font-size:11px;color:var(--text-400)">${tx.fecha}</td>
      <td><strong style="color:var(--text-100)">${tx.plan_nombre}</strong></td>
      <td style="font-weight:700;color:var(--green)">$${parseFloat(tx.monto).toFixed(2)} ${tx.moneda}</td>
      <td style="font-size:11px;color:var(--text-300)">${tx.metodo}</td>
      <td><span class="badge-criticidad GENERAL">${tx.estado}</span></td>
      <td>
        <button class="btn-action btn-outline" style="padding:2px 8px;font-size:10px;" onclick='showReceiptModal(${JSON.stringify(tx)})'>
          🧾 Ver Recibo
        </button>
      </td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════
// VISTAS DE EQUIPOS Y PARÁMETROS
// ══════════════════════════════════════════════════════════════════
function renderDashboardEquipos(list) {
  const container = document.getElementById('dashboard-eq-grid');
  if (container) container.innerHTML = list.map(eq => createEquipmentCardHtml(eq)).join('');
}

function renderFullEquipos(list) {
  const container = document.getElementById('full-eq-grid');
  if (container) container.innerHTML = list.map(eq => createEquipmentCardHtml(eq)).join('');
}

function createEquipmentCardHtml(eq) {
  const caudalHtml = `<div class="metric-tile"><span class="mt-label">Caudal Producción</span><div class="mt-val">${Math.round(eq.caudalActual).toLocaleString()} <span class="mt-unit">BPD</span></div></div>`;
  const nivelHtml = eq.nivelActual != null ? `<div class="metric-tile"><span class="mt-label">Nivel de Tanque</span><div class="mt-val">${eq.nivelActual.toFixed(1)} <span class="mt-unit">%</span></div></div>` : `<div class="metric-tile"><span class="mt-label">Enlace de Red</span><div class="mt-val" style="color:var(--green)">100 <span class="mt-unit">%</span></div></div>`;

  let presionHtml = CAN_CRITICAL ? `
    <div class="metric-tile">
      <span class="mt-label">Presión Crítica</span>
      <div class="mt-val" style="color:${eq.presionActual > 800 ? 'var(--red)' : 'var(--text-100)'}">
        ${eq.presionActual.toFixed(1)} <span class="mt-unit">PSI</span>
      </div>
    </div>` : `
    <div class="metric-tile restricted" title="Requiere rol Supervisor o Admin">
      <span class="mt-label">Presión Crítica</span>
      <div style="font-size:11px;color:#fca5a5;font-weight:700;display:flex;align-items:center;gap:4px;margin-top:2px;">🔒 Restringido</div>
    </div>`;

  let tempHtml = CAN_CRITICAL ? `
    <div class="metric-tile">
      <span class="mt-label">Temperatura</span>
      <div class="mt-val" style="color:${eq.temperaturaActual > 80 ? 'var(--red)' : 'var(--text-100)'}">
        ${eq.temperaturaActual.toFixed(1)} <span class="mt-unit">°C</span>
      </div>
    </div>` : `
    <div class="metric-tile restricted" title="Requiere rol Supervisor o Admin">
      <span class="mt-label">Temperatura</span>
      <div style="font-size:11px;color:#fca5a5;font-weight:700;display:flex;align-items:center;gap:4px;margin-top:2px;">🔒 Restringido</div>
    </div>`;

  return `
    <div class="eq-card ${eq.estado}" onclick="openEquipmentModal('${eq.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span class="status-pill ${eq.estado}"><span class="dot"></span>${eq.estado}</span>
        <span style="font-family:var(--mono);font-size:9.5px;color:var(--text-400)">${eq.tipo.replace('_',' ')}</span>
      </div>
      <div style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--violet-400)">${eq.codigo}</div>
      <div style="font-size:13px;font-weight:800;color:var(--text-100);margin:2px 0 3px">${eq.nombre}</div>
      <div style="font-size:10.5px;color:var(--text-400)">📍 ${eq.ubicacion} · ${eq.bateria}</div>
      <div class="eq-metrics-grid">${presionHtml}${tempHtml}${caudalHtml}${nivelHtml}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--text-600);border-top:1px solid var(--border);padding-top:8px;">
        <span>Conexión: <strong style="color:var(--text-400)">${eq.ultimaConexion}</strong></span>
        <span style="color:var(--violet-400);font-weight:600">Ver Detalles →</span>
      </div>
    </div>`;
}

function renderParametrosTable(params) {
  const tbody = document.getElementById('params-table-body');
  if (!tbody) return;
  const totalGen = params.filter(p => p.criticidad === 'GENERAL').length;
  const totalCrit = params.filter(p => p.criticidad === 'CRITICO').length;
  document.getElementById('pt-stats').textContent = `${params.length} variables registradas (${totalCrit} Críticas · ${totalGen} Generales)`;

  tbody.innerHTML = params.map(p => {
    let valorDisplay = p.bloqueado ? `<span class="val-locked-pill">🔒 Protegido (Empleado)</span>` : `<strong style="${p.valor>p.max||p.valor<p.min?'color:var(--red)':'color:var(--text-100)'}">${p.valor.toFixed(1)} ${p.unidad}</strong>`;
    let rangoDisplay = p.bloqueado ? '—' : `${p.min} - ${p.max} ${p.unidad}`;
    return `
      <tr>
        <td style="font-family:var(--mono);color:var(--violet-400);font-weight:600">${p.codigo}</td>
        <td><strong style="color:var(--text-100)">${p.nombre}</strong></td>
        <td>${p.parametro}</td>
        <td>${valorDisplay}</td>
        <td style="font-family:var(--mono);font-size:11px;color:var(--text-400)">${rangoDisplay}</td>
        <td><span class="badge-criticidad ${p.criticidad}">${p.criticidad}</span></td>
        <td style="color:var(--text-400);font-size:11px">${p.ubicacion}</td>
      </tr>`;
  }).join('');
}

function renderAlerts(alerts) {
  const container = document.getElementById('alerts-container');
  if (!container) return;
  const activeAlerts = alerts.filter(a => a.estado === 'ACTIVA');
  const badge = document.getElementById('alerts-count');
  if (badge) badge.textContent = activeAlerts.length;

  container.innerHTML = alerts.map(a => `
    <div style="background:var(--bg-900);border:1px solid var(--border);border-left:3px solid ${a.nivel==='CRITICO'?'var(--red)':'var(--amber)'};border-radius:12px;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge-criticidad ${a.nivel}">${a.nivel}</span>
          <strong style="color:var(--text-100);font-size:13px">${a.codigoEquipo} — ${a.nombreEquipo}</strong>
        </div>
        <span style="font-size:10px;font-family:var(--mono);color:var(--text-400)">${a.fechaGeneracion}</span>
      </div>
      <div style="font-size:11.5px;color:var(--text-300);">
        Variable: <strong>${a.variableAfectada}</strong> · Medido: <strong style="color:var(--red)">${a.valorMedido} ${a.unidad}</strong> (Límite: ${a.umbralLimite} ${a.unidad})
      </div>
      <div style="font-size:11px;color:var(--text-400);margin-top:2px;">📍 ${a.ubicacion} · Obs: ${a.observaciones}</div>
    </div>
  `).join('');
}

function openEquipmentModal(eqId) {
  const eq = EQUIPOS.find(e => e.id === eqId);
  if (!eq) return;

  document.getElementById('modal-title').textContent = `${eq.nombre} (${eq.codigo})`;
  let criticalSection = CAN_CRITICAL ? `
    <div style="background:var(--bg-800);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:10px;">
      <div style="font-size:11px;font-weight:700;color:var(--violet-400);margin-bottom:6px;">⭐ TELEMETRÍA CRÍTICA (${USER_ROLE})</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div>Presión: <strong>${eq.presionActual.toFixed(1)} PSI</strong></div>
        <div>Temperatura: <strong>${eq.temperaturaActual.toFixed(1)} °C</strong></div>
        ${eq.frecuenciaVfd ? `<div>Frecuencia VFD: <strong>${eq.frecuenciaVfd.toFixed(1)} Hz</strong></div>` : ''}
        ${eq.vibracionActual ? `<div>Vibración: <strong>${eq.vibracionActual.toFixed(1)} mm/s</strong></div>` : ''}
      </div>
    </div>` : `
    <div style="background:rgba(239,68,68,.08);border:1px dashed rgba(239,68,68,.3);border-radius:10px;padding:14px;margin-top:10px;color:#fca5a5;font-size:11.5px;">
      🔒 <strong>Parámetros Críticos Restringidos:</strong> Tu cuenta con rol <strong>${USER_ROLE}</strong> solo tiene permisos de visualización general.
    </div>`;

  document.getElementById('modal-content').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="metric-tile"><span class="mt-label">Caudal General</span><div class="mt-val">${Math.round(eq.caudalActual).toLocaleString()} <span class="mt-unit">BPD</span></div></div>
      <div class="metric-tile"><span class="mt-label">Estado</span><div class="mt-val" style="color:var(--green)">${eq.estado}</div></div>
    </div>
    ${criticalSection}
    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;font-size:11px;color:var(--text-300);line-height:1.6;">
      • Modelo: <strong>${eq.especificaciones.modelo}</strong> (${eq.especificaciones.anoInstalacion})<br>
      • Fabricante: <strong>${eq.especificaciones.fabricante}</strong> · Protocolo: <strong>${eq.especificaciones.protocoloComunicacion}</strong>
    </div>`;
  document.getElementById('modal-wrap').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-wrap').style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════
// CARGA CSV
// ══════════════════════════════════════════════════════════════════
function fillCsvExample() {
  document.getElementById('csv-raw-input').value = `codigo,nombre,parametro,valor,unidad,min,max,criticidad,ubicacion
PZ-LIZ-104,Cabeza Pozo Lizama 104,Presión en Cabeza,560.2,PSI,400,650,CRITICO,Campo Lizama
PZ-LIZ-104,Cabeza Pozo Lizama 104,Caudal Extracción,1310.0,BPD,800,1600,GENERAL,Campo Lizama
VFD-MOT-201,Variador ESP 2,Frecuencia Inversor,59.2,Hz,40,65,CRITICO,Campo Lizama
TK-ALM-01,Tanque Fiscal Cusiana,Nivel Llenado,78.4,%,15,90,GENERAL,Campo Cusiana`;
  showToast('Ejemplo CSV cargado.');
}

function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('csv-raw-input').value = ev.target.result;
    showToast(`Archivo "${file.name}" cargado.`);
  };
  reader.readAsText(file);
}

async function processCsvUpload() {
  const raw = document.getElementById('csv-raw-input').value.trim();
  if (!raw) { alert('Ingresa o selecciona datos CSV.'); return; }

  const mode = document.querySelector('input[name="csv_mode"]:checked')?.value || 'replace';
  const fd = new FormData();
  fd.append('csv_raw', raw);
  fd.append('mode', mode);

  try {
    const res = await fetch('?req=upload_csv', { method: 'POST', body: fd });
    const json = await res.json();
    const box = document.getElementById('csv-result-box');
    box.style.display = 'block';

    if (res.ok && json.status === 'success') {
      box.innerHTML = `<div style="background:var(--green-d);border:1px solid rgba(34,197,94,.3);color:var(--green);padding:14px;border-radius:10px;font-size:12px;">✓ <strong>${json.message}</strong> (${json.imported} importados · ${json.total} total)</div>`;
      showToast('✅ Parámetros importados.');
      loadParametros();
    } else {
      box.innerHTML = `<div style="background:var(--red-d);border:1px solid rgba(239,68,68,.3);color:var(--red);padding:14px;border-radius:10px;font-size:12px;">❌ Error: ${json.error}</div>`;
    }
  } catch (err) { alert('Error: ' + err.message); }
}

async function resetToDefaults() {
  if (!confirm('¿Restablecer parámetros de fábrica?')) return;
  try {
    const res = await fetch('?req=reset_params');
    const json = await res.json();
    if (json.status === 'success') { showToast('Parámetros restablecidos.'); loadParametros(); }
  } catch (err) { console.error(err); }
}

function filterCards() {
  const q = document.getElementById('eq-search').value.toLowerCase();
  const t = document.getElementById('eq-filter-type').value;
  const filtered = EQUIPOS.filter(eq => {
    const matchQ = eq.codigo.toLowerCase().includes(q) || eq.nombre.toLowerCase().includes(q);
    const matchT = !t || eq.tipo === t;
    return matchQ && matchT;
  });
  renderDashboardEquipos(filtered);
  document.getElementById('eq-count-lbl').textContent = `${filtered.length} equipos`;
}

async function renderStatusView() {
  const box = document.getElementById('status-cards-box');
  if (!box) return;
  try {
    const res = await fetch('?req=status');
    const s = await res.json();
    box.innerHTML = `
      <div style="background:var(--bg-900);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:13px;font-weight:700;color:var(--text-100)">Servidor Apache / XAMPP</div><div style="font-size:11px;color:var(--green)">En línea y operativo</div></div>
        <span style="font-size:22px">🟢</span>
      </div>
      <div style="background:var(--bg-900);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:13px;font-weight:700;color:var(--text-100)">Motor PHP con RBAC y Pasarela</div><div style="font-size:11px;color:var(--green)">Versión ${s.php}</div></div>
        <span style="font-size:22px">🟢</span>
      </div>
      <div style="background:var(--bg-900);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:13px;font-weight:700;color:var(--text-100)">Base de Usuarios Persistente</div><div style="font-size:11px;color:var(--violet-400)">usuarios_guardados.json</div></div>
        <span style="font-size:22px">👥</span>
      </div>`;
  } catch (err) { console.error(err); }
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

// Inicialización
loadEquipos();
loadParametros();
loadAlertas();
if (CAN_USERS) loadUsersList();
loadPaymentTransactions();
setInterval(() => { loadEquipos(); }, 6000);
</script>

<?php endif; ?>
</body>
</html>
