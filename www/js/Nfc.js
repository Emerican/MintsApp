
window.Nfc = {
  // Application Constructor
  initialize: function()
  {
    this.bindEvents();
    console.log("Starting NFC Reader app");
  },
  // Bind Event Listeners
  bindEvents: function()
  {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  debug: function()
  {
    Nfc.tag = "dcc76400";
    Nfc.trigger( 'tag_read' );
  },
  // deviceready Event Handler
  onDeviceReady: function()
  {
    //app.receivedEvent('deviceready');
    nfc.addTagDiscoveredListener( Nfc.onNfc, function (status)
    {
      // listener successfully initialized
    }, function (error)
    {
      // listener fails to initialize
      alert( "NFC reader failed to initialize " + JSON.stringify(error) );
    });
  },
  onNfc: function(nfcEvent)
  {
    Nfc.tag = nfc.bytesToHexString(nfcEvent.tag.id);
    Nfc.trigger( 'tag_read' );
  },
  events: {},
  on: function( type, handler )
	{
		if( !this.events )
		{
			this.events = {};
		}
		if( !(type in this.events) )
		{
			this.events[ type ] = [];
		}
		this.events[ type ].push( handler );
	},
  trigger: function( type, args )
	{
		if( this.events[type] )
		{
			for( var i = 0; i < this.events[type].length; i++ )
			{
				this.events[type][i].apply( this, args || [] );
			}
		}
	},
  unbind: function( type )
  {
    this.events[type] == null;
  },
  tag: null

};

Nfc.initialize();
