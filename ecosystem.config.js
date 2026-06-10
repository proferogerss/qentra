module.exports = {
  apps: [{
    name: 'qentra',
    script: 'src/server.js',
    cwd: '/var/www/qentra/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/pm2/qentra-error.log',
    out_file: '/var/log/pm2/qentra-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
