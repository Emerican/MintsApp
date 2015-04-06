window.ImmersiveMode = {
  // Application Constructor
  initialize: function()
  {
    this.bindEvents();
    console.log("Immersify is running");
  },
  // Bind Event Listeners
  bindEvents: function()
  {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    document.addEventListener('resume', this.onResume,false);
    document.addEventListener('pause', this.onPause, false);
  },
  // deviceready Event Handler
  onDeviceReady: function()
  {
    Immersify.enableSticky();
  },
  onResume: function()
  {
    Immersify.enableSticky();
  },
  onPause: function(){
    Immersify.disable();
  },

};

ImmersiveMode.initialize();
