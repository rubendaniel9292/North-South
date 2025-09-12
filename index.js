// Configuración simplificada temporal para diagnosticar 502
// Luego de comprobar estabilidad se puede volver a cluster.
module.exports = {
  apps: [
    {
      name: 'api-north-south',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      node_args: '--max-old-space-size=1024',
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      time: true,
      env: { NODE_ENV: 'production' },
    },
  ],
};