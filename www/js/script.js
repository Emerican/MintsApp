jQuery(function()
{

  var container = jQuery('body');
  var back_button = container.find('button[action="back"]');
  var navigation = container.find('nav');

  var section_history = [];
  var current_section = "main";
  var last_section = current_section;

  var takePicture = function( target )
  {
    if(navigator.camera)
    {
      navigator.camera.getPicture(function(imageData)
      {
        target.find('.avatar_path_image').remove();
        target.find('.avatar_image').remove();
        var img = target.find('img');
        if( img.length == 0 )
        {
          target.append('<img width="150" class="avatar_image" src="'+ "data:image/jpeg;base64," + imageData +'">');
        }
        else
        {
          img.attr('src', "data:image/jpeg;base64," + imageData );
        }
      },
      function(e)
      {
        console.log("Error getting picture: " + e);
        document.getElementById('camera_status').innerHTML = "Error getting picture.";
      },
      {
        quality: 80,
        targetWidth: 600,
        targetHeight: 800,
        destinationType: navigator.camera.DestinationType.DATA_URL
      });
    }

  };

  var section_change = function(section_name, data_target)
  {
    current_section = section_name;
    navigation.trigger('change');
    jQuery('section').hide();
    jQuery("#"+section_name).attr('data-source', data_target).trigger('data_load').show();
    ImmersiveMode.initialize();
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

  var product_list = function( resources )
  {
    var items = resources || Mints.products.get();

    var html_output = "";
    items.forEach(function(item)
    {
      html_output +=  '<li><button data-target="' + item.uuid + '" action="add/product">'+ item.name +'</button>' + "</li>";
    });

    return "<ul>" + html_output + "</ul>";
  }

  var resource_list = function( resource_name, resources )
  {
    var items = resources || Mints[resource_name].get();

    var html_output = "";
    items.forEach(function(item)
    {
      var resource_data = "";
      switch ( resource_name )
      {
        case "discounts":
          resource_data = item.client_group().name + " " + item.product_group().name + " " + item.amount;
        break;
        case "products":
        case "client_groups":
        case "product_groups":
          resource_data = item.name;
        break;
        case "clients":
          resource_data = item.name + " " + item.surname;
        break;
      }
      html_output +=  '<li><button data-target="' + item.uuid + '" action="section/edit_' + resource_name + '">' + resource_data + '</button>' + "</li>";
    });

    return "<ul>" + html_output + "</ul>";
  }
  var populate_form = function( section, data )
  {
    var form = section.find('form');

    for( var key in data )
    {
      var value = data[key];

      if( key != "avatar_path" )
      {

        var input = form.find('[name="' + key + '"]')
        if( input.is('select') )
        {
          input.find('[value="' + value + '"]').prop('selected', true);
        }
        else
        {
          input.val( value );
        }
      }
      else
      {
        form.find('.avatar_path_image').remove();
        form.find('.avatar_image').remove();
        form.find('.field.avatar').append('<img class="avatar_path_image" src="'+value+'">');
      }


    }
  }

  var trigger_action = function( action, data_target )
  {
    var prevent_default = false;
    Nfc.unbind('tag_read');

    switch( action.split('/')[0] )
    {
      case 'section':

        var section_name = action.split('/')[1];
        section_history.push( current_section );
        section_change( section_name, data_target );
      break;
      case 'back':
        section_change( section_history.pop() );
      break;
      case "add":
        if( action.split('/')[1] == 'product' )
        {
          add_products_to_bill( data_target );
        }
      break;

      default:
        prevent_default = true;

    }
    return prevent_default;
  }

  var add_products_to_bill = function( data_source )
  {
    var order_form = jQuery('#new_order form');
    var product_in_list = order_form.find('[data-source="'+ data_source +'"]');
    if( product_in_list.length == 0 )
    {
      var product_count = order_form.find('.purchase_item').length;
      var product = Mints.products.get( data_source );
      order_form.find('.product_list').append('<div class="purchase_item" data-source="'+ product.uuid +'" data-price="'+ product.price +'">'+
        '<input type="hidden" name="product_id" value="'+ product.uuid +'">'+
        '<input class="count" type="hidden" name="count" value="1">'+
        '<span class="product_name">'+ product.name + ' x ' +'</span>'+
        '<span class="count">1</span>'+
      '</div>');
    }
    else
    {
      var count = parseInt( product_in_list.find('input.count').val() );
      product_in_list.find('input.count').val( count + 1 );
      product_in_list.find('span.count').html( count + 1 );
    }

    order_form.find('.total .amount').html( Mints.u.calculate_total( order_form ) );
  }


  container.on('click', '.product_list .purchase_item', function()
  {
    var target = jQuery(this);
    var order_form = target.parents('form');
    var count = parseInt( target.find('input.count').val() );
    if( count > 1 )
    {
      target.find('input.count').val( count - 1 );
      target.find('span.count').html( count - 1 );
    }
    else
    {
      target.remove();
    }
    order_form.find('.total .amount').html( Mints.u.calculate_total( order_form ) );
  });

  container.on('data_load', 'section', function()
  {
    var section = jQuery(this);
    var section_id = section.attr('id');
    var content = section.find('.contents');
    var data_source = section.attr('data-source');
    switch (section_id)
    {
      case "add_clients":

        section.find('select').html( get_list_options('client_groups') );

      break;
      case "add_products":

        section.find('select').html( get_list_options('product_groups') );

      break;
      case "add_discounts":

        section.find('select.client_groups').html( get_list_options('client_groups') );
        section.find('select.product_groups').html( get_list_options('product_groups') );

      break;
      case "browse_discounts":
        content.html( resource_list("discounts") );
      break;
      case "browse_products":
        content.html( resource_list("products") );
      break;
      case "browse_product_groups":
        content.html( resource_list("product_groups") );
      break;
      case "browse_clients":
        content.html( resource_list("clients") );
        Nfc.on('tag_read', function()
        {
          var client = Mints.clients.search_by_card( Nfc.tag );

          trigger_action("section/edit_clients", client.uuid);

          Nfc.unbind('tag_read');
        });
      break;
      case "browse_client_groups":
        content.html( resource_list("client_groups") );
      break;
      case "edit_clients":
        section.find('select').html( get_list_options( 'client_groups' ) );
        populate_form( section, Mints.clients.get( data_source ) );
      break;
      case "edit_products":
        section.find('select').html( get_list_options( 'product_groups' ) );
        populate_form( section, Mints.products.get( data_source ) );
      break;
      case "edit_product_groups":
        populate_form( section, Mints.product_groups.get( data_source ) );
      break;
      case "edit_client_groups":
        populate_form( section, Mints.client_groups.get( data_source ) );
      break;
      case "new_order":
        content.html( product_list() );

        Nfc.on('tag_read', function()
        {
          var client = Mints.clients.search_by_card( Nfc.tag );
          if(client)
          {
            section.find('.client_data').html('<input type="hidden" name="client_id" value="'+ client.uuid +'"><span>'+ client.name + ' ' + client.surname  +'</span>');
          }

          Nfc.unbind('tag_read');
        });

      break;
    }

  });

  navigation.on('change',function()
  {
    back_button.toggle( section_history.length > 0 );
    navigation.find('.title').html( Lang.section_names(current_section) );

  }).trigger('change');


  container.on('click', '.add_avatar_button', function()
  {
    takePicture( jQuery(this).parent() );
  });

  container.on('click', 'button, .button', function()
  {
    var target = jQuery(this);

    return trigger_action( target.attr('action'), target.attr('data-target') );
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
        if (resource_name == 'bills' )
        {
          var form_obj = form.serializeObject();
          var bill = Mints[resource_name].new( {client_id:form_obj.client_id} );

          for(var i = 0; i < form_obj.product_id.length; i++)
          {
            Mints.purchases.new( { product_id:form_obj.product_id[i], count: form_obj.count[i], bill_id: bill.uuid } );
          }

          Mints[resource_name].on('sync', function()
          {
            Mints.u.notice( "Izveidots" );
            Mints[resource_name].unbind('sync');
            trigger_action( "section/main" );
            form.find('.client_data, .product_list, .amount').html("");
          });
        }
        else
        {
          var form_data = form.serializeObject();
          var avatar_image = form.find('.avatar_image');
          if( avatar_image.length > 0 )
          {
            form_data.avatar = avatar_image.attr('src');
          }

          Mints[resource_name].new( form_data );

          Mints[resource_name].on('sync', function()
          {
            Mints.u.notice( "Izveidots" );
            Mints[resource_name].unbind('sync');
            trigger_action( "section/browse_" + resource_name );
            form.find('input, textarea').val("");
            form.find('img').remove();
          });

        }

      break;

      case 'update':

        var form_data = form.serializeObject();
        var avatar_image = form.find('.avatar_image');
        if( avatar_image.length > 0 )
        {
          form_data.avatar = avatar_image.attr('src');
        }

        Mints[resource_name].get(resource_id).set( form_data );
        Mints[resource_name].on('sync', function()
        {
          Mints.u.notice( "Saglabāts" );
          Mints[resource_name].unbind('sync');
          trigger_action( "section/browse_" + resource_name );
        });
      break;

      case 'search':
        var search_result = Mints[resource_name].search( form.serializeObject().search );
        var content = form.parent().find('.contents');
        content.html( resource_list( resource_name, search_result ) );
      break;

    }


    // handle data refresh in .on('change',function(){}) event
    form.parents('section').trigger('change');

  });

});
