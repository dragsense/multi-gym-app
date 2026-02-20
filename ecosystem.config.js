module.exports = {
  apps: [
    {
      name: "vivast-prod",
      script: "dist/backend/src/main.js",
      cwd: "/app/backend",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/app/backend/logs/pm2-error.log",
      out_file: "/app/backend/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
    },
    {
      name: "vivast-staging",
      script: "dist/backend/src/main.js",
      cwd: "/app/backend",
      env: {
        NODE_ENV: "staging",
      },
      error_file: "/app/backend/logs/pm2-error.log",
      out_file: "/app/backend/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
    },
  ],
  deploy: {
    prod: {
      user: "ubuntu",
      host: "35.84.225.108",
      ref: "origin/main",
      repo: "git@octa_github.com:Octathorn/vivast.git",
      path: "/var/www/vivast_io_usr/data/www/vivast.io",
      // Use WSL path (no spaces) or copy key to ~/.ssh/vivast-dev.pem
      key: process.env.HOME + "/.ssh/vivast-dev.pem",
      "post-setup": "touch ../shared/.env ../shared/.env.prod ../shared/.env.dev ../shared/.env.shared",
      "post-deploy": "sh ./deploy.sh",
    },
    staging: {
      user: "ubuntu",
      host: "35.84.225.108",
      ref: "origin/testing",
      repo: "git@octa_github.com:Octathorn/vivast.git",
      path: "/var/www/vivast_io_usr/data/www/vivast.io/staging",
      key: process.env.HOME + "/.ssh/vivast-dev.pem",
      "post-setup": "touch ../shared/.env ../shared/.env.prod ../shared/.env.dev ../shared/.env.shared",
      "post-deploy": "sh ./deploy.sh",
    },
  },
};
