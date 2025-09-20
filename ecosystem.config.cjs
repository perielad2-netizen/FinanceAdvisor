module.exports = {
  apps: [
    {
      name: 'trader-advisor',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=trader-advisor-db --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true
    }
  ]
}