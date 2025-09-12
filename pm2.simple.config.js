// Configuración mínima para aislar error 502
// Uso: pm2 start pm2.simple.config.js --env production

module.exports = {
  apps: [
    {
      name: 'api-north-south-simple',
      script: 'dist/main.js',
      instances: 1,          // una sola instancia para simplificar
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      // Aumentamos un poco el heap para evitar OOM inmediatos
      node_args: '--max-old-space-size=1024',
      // Logs básicos
      out_file: './logs/simple-out.log',
      error_file: './logs/simple-err.log',
      time: true,
    },
  ],
};
