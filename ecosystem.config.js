/**
 * ============================================================
 * PM2 Ecosystem Configuration
 * ============================================================
 * Optimized for VPS with 1GB RAM
 * 
 * Commands:
 * - pm2 start ecosystem.config.js
 * - pm2 restart ecosystem.config.js
 * - pm2 stop ecosystem.config.js
 * - pm2 logs
 * - pm2 monit
 * - pm2 save (save process list)
 * - pm2 startup (auto-start on boot)
 * ============================================================
 */

module.exports = {
    apps: [
        {
            // Main Application
            name: 'otp-bot',
            script: './src/app.js',

            // Instances & Clustering
            instances: 1, // Set to 1 for 1GB RAM VPS, or 'max' for auto-scaling
            exec_mode: 'cluster', // Use 'fork' if you don't need clustering

            // Environment Variables
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            env_development: {
                NODE_ENV: 'development',
                PORT: 3001,
            },

            // Memory Management (CRITICAL for 1GB VPS)
            max_memory_restart: '400M', // Restart if memory exceeds 400MB
            node_args: '--max-old-space-size=512', // Limit V8 heap to 512MB

            // Auto Restart Configuration
            watch: false, // Don't watch in production (saves memory)
            ignore_watch: ['node_modules', 'logs', 'backups'],

            // Restart Behavior
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Error Handling
            exp_backoff_restart_delay: 100,

            // Logging
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Advanced Features
            kill_timeout: 5000,
            listen_timeout: 3000,
            shutdown_with_message: true,

            // Health Monitoring
            wait_ready: true,

            // Process Management
            cron_restart: '0 3 * * *', // Restart daily at 3 AM (optional)

            // Environment-specific settings
            instance_var: 'INSTANCE_ID',

            // Source Map Support
            source_map_support: true,
        },

        // Background Jobs (optional - if you need separate cron processor)
        {
            name: 'otp-bot-cron',
            script: './src/cron/index.js',
            instances: 1,
            exec_mode: 'fork',
            cron_restart: '0 0 * * *', // Restart daily at midnight
            max_memory_restart: '200M',
            autorestart: true,
            watch: false,
            error_file: './logs/pm2-cron-error.log',
            out_file: './logs/pm2-cron-out.log',
        },
    ],

    // Deploy Configuration (optional - for automated deployment)
    deploy: {
        production: {
            user: 'ubuntu',
            host: 'your-server-ip',
            ref: 'origin/main',
            repo: 'git@github.com:yourusername/otp-telegram-bot.git',
            path: '/home/ubuntu/otp-bot',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-deploy-local': '',
            'post-setup': 'npm install',
        },
    },
};

/**
 * ============================================================
 * MEMORY OPTIMIZATION TIPS for 1GB VPS
 * ============================================================
 * 
 * 1. Keep instances = 1 or 2 maximum
 * 2. Set max_memory_restart to 400-500MB max
 * 3. Use node_args to limit V8 heap
 * 4. Disable watch in production
 * 5. Regular cron_restart to prevent memory leaks
 * 6. Monitor with: pm2 monit
 * 7. Check memory: free -m
 * 8. Optimize code:
 *    - Use connection pooling
 *    - Close database connections
 *    - Clear intervals/timeouts
 *    - Avoid memory leaks in event listeners
 * 
 * ============================================================
 * MONITORING COMMANDS
 * ============================================================
 * 
 * pm2 list               # List all processes
 * pm2 monit              # Real-time monitoring
 * pm2 logs               # View logs
 * pm2 logs --lines 100   # Last 100 lines
 * pm2 flush              # Clear logs
 * pm2 restart all        # Restart all apps
 * pm2 stop all           # Stop all apps
 * pm2 delete all         # Delete all apps
 * pm2 describe otp-bot   # Detailed info
 * 
 * ============================================================
 */