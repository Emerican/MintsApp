
var nfclistener = {
 // Application Constructor
 initialize: function() {
 this.bindEvents();
 console.log("Starting NFC Reader app");
 },
 // Bind Event Listeners
 bindEvents: function() {
 document.addEventListener('deviceready', this.onDeviceReady, false);
 },
 // deviceready Event Handler
 onDeviceReady: function() {
 //app.receivedEvent('deviceready');
 nfc.addTagDiscoveredListener(
 nfclistener.onNfc, // tag successfully scanned
 function (status) { // listener successfully initialized
 nfclistener.display("Tap a tag to read its id number.");
 },
 function (error) { // listener fails to initialize
 nfclistener.display("NFC reader failed to initialize " +
 JSON.stringify(error));
 }
 );
 },

 onNfc: function(nfcEvent) {
 var tag = nfcEvent.tag;
 alert("Read tag: " + nfc.bytesToHexString(tag.id));
 },

 /*display: function(message) {
 var label = document.createTextNode(message),
 lineBreak = document.createElement("br");
 messageDiv.appendChild(lineBreak); // add a line break
 messageDiv.appendChild(label); // add the text
 },*/


 clear: function() {
 messageDiv.innerHTML = "";
 },


};

nfclistener.initialize();
