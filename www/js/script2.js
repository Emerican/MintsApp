
jQuery(function()
{

  var container = jQuery('body');

  container.on('focus', 'input.nfc', function()
  {
    var target = jQuery(this);
    Nfc.unbind('tag_read');
    Nfc.on('tag_read', function()
    {
      target.val( Nfc.tag );
      Nfc.unbind('tag_read');
    });
  });




});
