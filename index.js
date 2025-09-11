//scritp de inicio para PM2
module.exports = {
  apps: [
    {
      name: 'CRM NORTH SOUTH',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 2,
      exec_mode: 'cluster',
    },
  ],
};
