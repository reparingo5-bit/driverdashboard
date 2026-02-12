module.exports = {
  apps: [{
    name: 'driver-management',
    script: 'server.js',
    cwd: '/var/www/driver-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/driver-management-error.log',
    out_file: '/var/log/pm2/driver-management-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
