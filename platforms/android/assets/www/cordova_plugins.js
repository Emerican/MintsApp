cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.chariotsolutions.nfc.plugin/www/phonegap-nfc.js",
        "id": "com.chariotsolutions.nfc.plugin.NFC",
        "runs": true
    },
    {
        "file": "plugins/com.toluhta.immersify/www/ImmersiveModePlugin.js",
        "id": "com.toluhta.immersify.Immersify",
        "clobbers": [
            "Immersify"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.chariotsolutions.nfc.plugin": "0.6.1",
    "com.toluhta.immersify": "0.1.0"
}
// BOTTOM OF METADATA
});