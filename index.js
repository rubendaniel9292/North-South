//scritp de inicio para PM2
module.exports = {
  apps: [
    {
      name: 'CRM NORTH SOUTH',
      script: 'dist/main.js',
      node_args: '--max-old-space-size=1024', // Limita cada instancia a 1GB de RAM
      env: {
        NODE_ENV: 'production',
      },
      instances: 2,
      exec_mode: 'cluster',
    },
  ],
};
