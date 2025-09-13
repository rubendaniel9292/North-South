// Configuración optimizada para producción con cluster mode
// Aprovecha múltiples cores con load balancing automático
module.exports = {
  apps: [
    {
      name: 'api-north-south',
      script: 'dist/main.js',
      instances: 2, // 2 instancias para 2 vCPUs, balanceando RAM
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      max_restarts: 5, // Límite de reintentos para evitar crash loops
      min_uptime: '10s', // Tiempo mínimo antes de considerar startup exitoso
      node_args: '--max-old-space-size=896', // Ajustado para 2 instancias (896MB * 2 = ~1.8GB)
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
      max_memory_restart: '800M', // Reinicia si una instancia supera 800MB
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
};