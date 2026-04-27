'use strict';

/**
 * ============================================================
 * scenes/index.js — Scene Aggregator
 * ============================================================
 */

const { startScene }    = require('./start.scene');
const { profileScene }  = require('./profile.scene');
const { orderScene }    = require('./order.scene');
const { topupScene }    = require('./topup.scene');
const { historyScene }  = require('./history.scene');
const { adminScene }    = require('./admin.scene');
const { referralScene } = require('./referral.scene');
const { topUsersScene } = require('./top_users.scene');

module.exports = {
    startScene,
    profileScene,
    orderScene,
    topupScene,
    historyScene,
    adminScene,
    referralScene,
    topUsersScene,
    // Semua scene dalam array (untuk didaftarkan ke Stage sekaligus)
    allScenes: [
        startScene, 
        profileScene, 
        orderScene, 
        topupScene, 
        historyScene, 
        adminScene, 
        referralScene,
        topUsersScene
    ],
};
