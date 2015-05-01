jQuery(function()
{

  var container = jQuery('body');
  var back_button = container.find('button[action="back"]');
  var navigation = container.find('nav');

  var section_history = [];
  var current_section = "main";

  var weekday = function()
  {
    var wkday = new Date().getDay();
    return wkday == 0 ? 7 : wkday;
  }

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
    if(typeof ImmersiveMode !== 'undefined')
    {
      ImmersiveMode.initialize();
    }
  };

  var get_list_options = function( resource_name, blank )
  {
    var list_opts = "";
    var list = Mints[resource_name].get();

    if(blank)
    {
      list_opts += '<option></option>';
    }
    list.forEach(function(item)
    {
      list_opts += '<option value="' + item.uuid + '">' + item.name + '</option>'
    });
    return list_opts;
  }

  var product_list = function( resources )
  {
    var product_groups = Mints.product_groups.get();

    var html_tabs_buttons = "";
    var html_tabs = "";

    product_groups.forEach(function(pg)
    {
      var items = pg.products();
      var pg_output = "";
      html_tabs_buttons += '<button action="switch_tab/new_order" data-target="'+pg.uuid+'">' + pg.name + '</button>';

      items.sort(function(a,b)
      {
        if (a.name > b.name)
        {
          return 1;
        }
        if (a.name < b.name)
        {
          return -1;
        }
        return 0;

      }).forEach(function(item)
      {
        if( !item.weekdays || item.weekdays.indexOf( weekday() ) != -1 )
        {
          var color_class= "";
          if ( /0,3|0.3/i.test(item.name) ){ color_class = "color3" }
          if ( /0,5|0.5/i.test(item.name) ){ color_class = "color5" }
          if ( /0,7|0.7/i.test(item.name) ){ color_class = "color7" }
          pg_output +=  '<li><button class="'+ color_class +'" data-target="' + item.uuid + '" action="add/product">'+ item.name +'</button>' + "</li>";
        }

      });

      html_tabs += '<ul class="product_group" data-product_group="'+ pg.uuid +'">' + pg_output + "</ul>";

    });

    return '<div class="tab_buttons">' + html_tabs_buttons + '</div><div class="tabs">'+html_tabs+'</div>';
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
          input.find('option').prop('selected', false);
          if(typeof value === "string" )
          {
            input.find('[value="' + value + '"]').prop('selected', true);
          }
          else if( value != null && typeof value === "object" )
          {
            value.forEach(function(v)
            {
              input.find('[value="' + v + '"]').prop('selected', true);
            });
          }

        }
        else if( input.is('[type="checkbox"]') )
        {
          input.find('[value="' + value + '"]').prop('checked', true);
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
        if(section_name =="new_order")
        {
          section_history = ["main"];
          section_change (section_name,data_target);
        }
        else if(section_name == "main")
        {
          section_history = [];
          section_change (section_name,data_target);
        }
        else if(current_section != section_name)
        {
          section_history.push( current_section );
          section_change( section_name, data_target );
        }
        else
        {
          section_history.push( current_section);
          section_change( section_name, data_target);

        }
      break;
      case 'back':
        jQuery("nav").show();
        section_change( section_history.pop() );
      break;
      case "add":
        if( action.split('/')[1] == 'product' )
        {
          add_products_to_bill( data_target );
        }
      break;
      case "switch_tab":
        var section_name = action.split('/')[1];

        container.find( '#'+section_name+' .tab_buttons > *' ).removeClass('active');
        container.find( '#'+section_name+' .tab_buttons [data-target="'+ data_target +'"]' ).addClass('active');
        container.find( '#'+section_name+' .tabs > *' ).hide();
        container.find( '#'+section_name+' .tabs [data-product_group="'+data_target+'"]' ).show();


      break;
      default:
        prevent_default = true;

    }
    return prevent_default;
  }

  var add_products_to_bill = function( data_source )
  {
    var order_form = jQuery('#new_order form');
    var client_id = order_form.find('input[name="client_id"]').val();
    var product_in_list = order_form.find('[data-source="'+ data_source +'"]');
    if( product_in_list.length == 0 )
    {
      var product_count = order_form.find('.purchase_item').length;
      var client = client_id ? Mints.clients.get(client_id) : null;
      var product = Mints.products.get( data_source );
      product.discount = Mints.u.discount( product, client );
      order_form.find('.product_list').append('<div class="purchase_item" data-source="'+ product.uuid +'" >'+

        '<input type="hidden" name="product_id" value="'+ product.uuid +'">'+
        '<input type="hidden" name="count" value="1">'+
        '<input type="hidden" name="price" value="' + product.price + '">'+
        '<input type="hidden" name="discount" value="'+product.discount+'">'+

        '<span class="product_name">'+ product.name + ' x ' +'</span>'+
        '<span class="count">1</span>'+
        '<span class="price"> '+ ( product.price * (100 - product.discount) / 100 ) + "€" + ' </span>'+
        '<span class="discount">'+ ( product.discount ? ("-" + product.discount +'%') : "" ) + ' </span>'+

      '</div>');
    }
    else
    {
      var count = parseInt( product_in_list.find('input[name="count"]').val() );
      update_products_in_bill( product_in_list, count+1 );
    }

    order_form.find('.total .amount').html( Mints.u.calculate_total( order_form ) );
  }

  var update_product_discounts_in_bill = function( )
  {
    var order_form = jQuery('#new_order form');
    var client_id = order_form.find('input[name="client_id"]').val();
    var client = Mints.clients.get(client_id);
    var products =  order_form.find(".purchase_item");
    if(products)
    {
      products.each(function()
      {
        var item = jQuery(this);
        var product = Mints.products.get( item.attr("data-source") );
        var discount = Mints.u.discount( product, client );

        item.find('input[name="discount"]').val(discount);
      });
    }

    update_products_in_bill();
  }

  var update_products_in_bill = function( product_in_list, new_count )
  {
    product_in_list = product_in_list || jQuery('#new_order form').find(".purchase_item");
    if(new_count)
    {
      product_in_list.find('input[name="count"]').val( new_count );
    }

    product_in_list.each(function()
    {
      var item = jQuery(this);
      var count = parseInt( item.find('input[name="count"]').val() );
      var discount = parseInt(  item.find('input[name="discount"]').val() );
      var price = parseFloat( item.find('input[name="price"]').val() ) * 100;
      item.find('span.count').html( count );
      item.find('span.discount').html( discount ? "-" + discount + "%" : "" );
      item.find('span.price').html( ( count * price * (100 - discount) / 100 ) / 100 + "€" );
    });

  }

  container.on('click', '.product_list .purchase_item', function()
  {
    var target = jQuery(this);
    var order_form = target.parents('form');
    var count = parseInt( target.find('input[name="count"]').val() );
    if( count > 1 )
    {
      update_products_in_bill( target, count-1 );
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

        section.find('select.client_groups').html( get_list_options('client_groups') );

      break;
      case "add_products":

        section.find('select.product_groups').html( get_list_options('product_groups') );

      break;
      case "add_discounts":

        section.find('select.client_groups').html( get_list_options('client_groups',true) );
        section.find('select.product_groups').html( get_list_options('product_groups',true) );

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
        section.find('select.client_groups').html( get_list_options( 'client_groups' ) );
        populate_form( section, Mints.clients.get( data_source ) );
      break;
      case "edit_products":
        section.find('select.product_groups').html( get_list_options( 'product_groups' ) );
        populate_form( section, Mints.products.get( data_source ) );
      break;
      case "edit_product_groups":
        populate_form( section, Mints.product_groups.get( data_source ) );
      break;
      case "edit_client_groups":
        populate_form( section, Mints.client_groups.get( data_source ) );
      break;
      case "new_order":

        navigation.hide();
        section.find('.client_data').html('<div id="client_facecontrol"><span class="shop_client_name">Tims Mints' + '<img id="shop_avatar" width="170px" height="200"src="img/logo.png"</span></div>');



        content.html( product_list() );

        Nfc.on('tag_read', function()
        {
          var client = Mints.clients.search_by_card( Nfc.tag );
          if(client)
          {
            section.find('img').remove();
            section.find('avatar_path').remove();
            section.find('.client_data').html('<input type="hidden" name="client_id" value="'+ client.uuid +'"><span class="shop_client_name">'+ client.name + ' ' + client.surname  +' <img id="shop_avatar" width="150px" height="200"src="'+ client.avatar_path + '"></span>');
            update_product_discounts_in_bill();
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

          Mints[resource_name].on('sync', function()
          {
            Mints.u.notice( "Izveidots" );
            Mints[resource_name].unbind('sync');
            trigger_action( "section/new_order" );
            form.find('.client_data, .product_list, .amount').html("");
          });
          for(var i = 0; i < form_obj.product_id.length; i++)
          {
            Mints.purchases.new( { product_id:form_obj.product_id[i], count: form_obj.count[i], bill_id: bill.uuid } );
          }
        }
        else
        {
          var form_data = form.serializeObject();
          if( typeof form_data.weekdays == "string" )
          {
            form_data.weekdays = [form_data.weekdays];
          }
          var avatar_image = form.find('.avatar_image');
          if( avatar_image.length > 0 )
          {
            form_data.avatar = avatar_image.attr('src');
          }



          Mints[resource_name].on('sync', function()
          {
            Mints.u.notice( "Izveidots" );
            Mints[resource_name].unbind('sync');
            trigger_action( "section/browse_" + resource_name );
            form.find('input, textarea').val("");
            form.find('img').remove();
          });
          Mints[resource_name].new( form_data );
        }

      break;

      case 'update':

        var form_data = form.serializeObject();
        if( typeof form_data.weekdays == "string" )
        {
          form_data.weekdays = [form_data.weekdays];
        }
        var avatar_image = form.find('.avatar_image');
        if( avatar_image.length > 0 )
        {
          form_data.avatar = avatar_image.attr('src');
        }

        Mints[resource_name].on('sync', function()
        {
          Mints.u.notice( "Saglabāts" );
          Mints[resource_name].unbind('sync');
          trigger_action( "section/browse_" + resource_name );
        });
        Mints[resource_name].get(resource_id).set( form_data );
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
