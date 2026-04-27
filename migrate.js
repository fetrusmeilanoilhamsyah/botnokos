'use strict';

require('dotenv').config();
const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        console.log('🚀 Starting Database Migration...');
        
        const sqlPath = path.join(__dirname, 'src', 'database', 'migrations', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon but be careful with functions/triggers
        // For simplicity with this specific init.sql, we can execute it as one block 
        // if the driver supports it, or handle it carefully.
        // pg-pool's query usually handles multiple statements if they are separated by ;
        
        await query(sql);
        
        console.log('✅ Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
