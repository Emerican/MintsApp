jQuery(function()
{

  var container = jQuery('body');
  var buttons = container.find('button, .button');
  var back_button = container.find('button[action="back"]');
  var navigation = container.find('nav');

  var section_history = [];
  var current_section = "main";
  var last_section = current_section;

  var section_change = function(section_name)
  {
    current_section = section_name;
    navigation.trigger('change');
    jQuery('section').hide();
    jQuery("#"+section_name).trigger('data_load').show();

  };

  var get_list_options = function( resource_name )
  {
    var list_opts = "";
    var list = Mints[resource_name].get();

    list.forEach(function(item)
    {
      list_opts += '<option value="' + item.uuid + '">' + item.name + '</option>'
    });
    return list_opts;
  }

  var notice = function(msg)
  {
    container.addClass( "show_notice" );
    container.find('.notice .text').html( msg );
    setTimeout(function()
    {
      container.addClass( "show_notice" );
    }, 5000);
  }

  var trigger_action = function( action )
  {
    var prevent_default = false;

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

      default:
        prevent_default = true;

    }
    return !prevent_default;
  }

  container.on('data_load', 'section', function()
  {
    var section = jQuery(this);
    var section_id = section.attr('id');

    switch (section_id)
    {
      case "add_user":

        section.find('select').html( get_list_options('client_groups') );

      break;
      case "add_product":

        section.find('select').html( get_list_options('product_groups') );

      break;
    }

  });

  navigation.on('change',function()
  {
    back_button.toggle( section_history.length > 0 );
    navigation.find('.title').html( Lang.section_names(current_section) );

  }).trigger('change');;


  buttons.on('click',function()
  {
    var target = jQuery(this);
    var action = target.attr('action');

    return trigger_action( action );
  });

  container.on('submit', 'form',function(e)
  {
    e.preventDefault();

    var form = jQuery(this);
    var action = form.attr('action') || form.find('button, .button').attr('action');
    var resource_id = form.attr('resource_uuid') || form.find('[name="uuid"]').val();
    var resource_name = action.split('/')[1];

    switch( action.split('/')[0] )
    {
      case 'new':
        Mints[resource_name].new( form.serializeObject() );
        Mints[resource_name].on('sync', function()
        {
          notice( "Izveidots" );
        });
      break;

      case 'update':
        Mints[resource_name].get(resource_id).set( form.serializeObject() );
        Mints[resource_name].on('sync', function()
        {
          notice( "Saglabāts" );
          trigger_action( "section/browse_" + resource_name );
        });
      break;

      case 'search':
        var search_result = Mints[resource_name].search( form.serializeObject().search );
        // do something with search result
      break;

    }


    // handle data refresh in .on('change',function(){}) event
    form.parents('section').trigger('change');

  });

});
