// Configuración optimizada para producción con cluster mode
// Aprovecha múltiples cores con load balancing automático
module.exports = {
  apps: [
    {
      name: 'api-north-south',
      script: 'dist/main.js',
      instances: 1, // Solo 1 instancia para maximizar memoria disponible
      exec_mode: 'fork', // Fork mode para una sola instancia
      watch: false,
      autorestart: true,
      max_restarts: 5, // Límite de reintentos para evitar crash loops
      min_uptime: '10s', // Tiempo mínimo antes de considerar startup exitoso
      node_args: '--max-old-space-size=2048', // 2GB de memoria para manejar 300 pólizas
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true, // Combina logs de todas las instancias
      env: { 
        NODE_ENV: 'production',
        PORT: 3000 // Puerto explícito para cluster
      },
      // Configuración de graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Configuración de monitoreo
      pmx: true,
      // Configuración de memoria
      max_memory_restart: '1800M', // Reinicia si supera 1.8GB (dejando margen de seguridad)
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
};