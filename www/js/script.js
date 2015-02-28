
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

  container.on('submit', 'form',function()
  {
    var form = jQuery(this);
    var action = target.attr('action') || target.find('button, .button').attr('action');
    var resource_id = target.attr('resource_uuid') || target.find('[name="uuid"]').val();
    var resource_name = action.split('/')[1];

    switch( action.split('/')[0] )
    {
      case 'new':
        Mints[resource_name].new( form.serialize() );
      break;

      case 'set':
        Mints[resource_name].get(resource_id).set( form.serialize() );
      break;

    }

    // handle data refresh in .on('change',function(){}) event
    target.parents('section').trigger('change');
    return false;
  });

  $("#new_client_group_btn").click( function()
         {
          var client_group_name = jQuery("#group_name").val();
          Mints.client_groups.new({name:client_group_name});
        }
      );


  $("#new_user_btn").click(function()
      {
        var client_name = jQuery("#name").val();
        var client_surname = jQuery("#surname").val();
        var client_phone = jQuery("#phone").val();
        var client_email = jQuery("#email").val();

        Mints.clients.new({card_id:null,name:client_name,surname:client_surname,client_group_id:null,phone:client_phone,email:client_email,postpay:true});
      }
  );

  $("#new_product_btn").click(function()
  {
    var product_name = jQuery("#product_name").val();
    var product_price = jQuery("#product_price").val();

    if(!$.isNumeric(product_price) || product_price.length == 0 || product_name.length == 0 ){
      alert("Atstāti tukši lauki, vai nav korekti ievadīta cena.");
    }else{
      Mints.products.new({product_group_id:null,name:product_name,price:product_price,description:"default"});
      alert("produkts pievienots");
          }
  }
  );

  $("#new_product_group_btn").click(function()
  {
    var product_group_name = jQuery("#product_group_name").val();

    Mints.product_groups.new({name:product_group_name});

  }
  );


});
