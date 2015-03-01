jQuery(function()
{

  var container = jQuery('body');
  var back_button = container.find('button[action="back"]');
  var navigation = container.find('nav');

  var section_history = [];
  var current_section = "main";
  var last_section = current_section;

  var section_change = function(section_name, data_target)
  {
    current_section = section_name;
    navigation.trigger('change');
    jQuery('section').hide();
    jQuery("#"+section_name).attr('data-source', data_target).trigger('data_load').show();

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
        case "products":
        case "client_groups":
        case "product_groups":
          resource_data = item.name
        break;
        case "clients":
          resource_data = item.name + " " + item.surname
        break;
      }
      html_output +=  "<li><span>" + resource_data + '</span><button data-target="' + item.uuid + '" action="section/edit_' + resource_name + '">Labot</button>' + "</li>";
    });

    return "<ul>" + html_output + "</ul>";
  }
  var populate_form = function( section, data )
  {
    var form = section.find('form');

    for( var key in data )
    {
      var value = data[key];

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
  }

  var notice = function(msg)
  {
    container.addClass( "show_notice" );
    container.find('.notice .text').html( msg );
    setTimeout(function()
    {
      container.removeClass( "show_notice" );
    }, 5000);
  }

  var trigger_action = function( action, data_target )
  {
    var prevent_default = false;

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
    calculate_total( order_form );
  }

  var calculate_total = function( order_form )
  {
    var total = 0;
    order_form.find('.purchase_item').each(function()
    {
      var item = jQuery(this);
      var price = parseFloat( item.attr('data-price') )*100;
      var count = parseInt( item.find('input.count').val() );

      total += price * count/100;
    });

    order_form.find('.total .amount').html( total );
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

    calculate_total( order_form );
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
      case "browse_products":
        content.html( resource_list("products") );
      break;
      case "browse_product_groups":
        content.html( resource_list("product_groups") );
      break;
      case "browse_clients":
        content.html( resource_list("clients") );
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

        Nfc.unbind('tag_read');
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
        }
        else
        {
          Mints[resource_name].new( form.serializeObject() );
        }

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
        var content = form.parent().find('.content');
        content.html( resource_list( resource_name, search_result ) );
      break;

    }


    // handle data refresh in .on('change',function(){}) event
    form.parents('section').trigger('change');

  });

});
