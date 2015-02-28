
jQuery(function()
{

  var container = jQuery('body');
  var buttons = container.find('button, .button');
  var back_button = container.find('button[action="back"]');
  var navigation = container.find('nav');

  var section_history = [];
  var current_section = "main";
  var last_section = current_section;

  var object
  var section_change = function(section_name)
  {
    current_section = section_name;
    navigation.trigger('change');
    jQuery('section').hide();
    jQuery("#"+section_name).trigger('load_data').show();

  };

  var section_names = function( section )
  {
    switch(section)
    {
      case "main":
        return "Sākums"
      break;
      case "products":
        return "Produkti"
      break;
      case "add_product":
        return "Pievienot produktu"
      break;
      case "add_product_group":
        return "Pievienot produkta grupu"
      break;
      case "browse_product":
        return "Meklēt produktu"
      break;
      case "browse_product_group":
        return "Meklēt produkta grupu"
      break;
      case "users":
        return "Lietotāji"
      break;
      case "add_user":
        return "Pievienot lietotāju"
      break;
      case "add_group":
        return "Pievienot lietotāja grupu"
      break;
      case "browse_users":
        return "Meklēt lietotājus"
      break;
      case "browse_groups":
        return "Meklēt lietotāja grupu"
      break;
      case "settings":
        return "Iestatījumi"
      break;
      case "reports":
        return "Atskaites"
      break;
      case "new_order":
        return "Pasūtījumi"
      break;
      default:
        return section;
    }
  };

  container.find( 'section' ).on('data_load', function()
  {
    var section = jQuery(this);
    var section_id = section.attr('id');

    switch (section_id)
    {
      case "":
      // handle data here
      break;
    }


  });

  navigation.on('change',function()
  {
    back_button.toggle( section_history.length > 0 );
    navigation.find('.title').html( section_names(current_section) );

  }).trigger('change');;


  buttons.on('click',function()
  {
    var target = jQuery(this);
    var action = target.attr('action');

    var prevent_default = true;

    switch( action.split('/')[0] )
    {
      case 'section':

        var section_name = action.split('/')[1];
        section_history.push( current_section );
        section_change( section_name );

      break;
      case 'back':
        section_change( section_history.pop() );
      break;

      case 'new':
      case 'set':
        prevent_default = false;
      break;

    }
    return !prevent_default;
  });

  container.on('submit', 'form',function(e)
  {
    e.preventDefault();
    var form = jQuery(this);
    var action = form.attr('action') || form.find('button, .button').attr('action');
    var resource_id = form.attr('resource_uuid') || form.find('[name="uuid"]').val();
    var resource_name = action.split('/')[1];
    console.log( form.serializeObject() );
    switch( action.split('/')[0] )
    {
      case 'new':
        Mints[resource_name].new( form.serializeObject() );
      break;

      case 'set':
        Mints[resource_name].get(resource_id).set( form.serializeObject() );
      break;

    }


    // handle data refresh in .on('change',function(){}) event
    form.parents('section').trigger('change');
    //return false;
  });


});
