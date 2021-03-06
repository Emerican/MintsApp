var section_change = function(section_name, data_target)
{
  Nfc.unbind('tag_read');
  var address = "#"+section_name+( data_target ? "/"+data_target : "" );
  Mints.current_section = section_name;
  Mints.navigation.trigger('change');
  history.pushState(null, null, address);
  jQuery('section').hide();
  jQuery("#"+section_name).attr('data-source', data_target).trigger('data_load').show();
  if(typeof ImmersiveMode !== 'undefined')
  {
    ImmersiveMode.initialize();
  }
};

var product_template = function(p, count, purchase_id)
{
  return '<tr class="purchase_item" data-source="'+ p.uuid +'" >'+

    '<input type="hidden" name="purchase_self_id" value="'+ ( purchase_id ? purchase_id : "") +'">'+
    '<input type="hidden" name="product_id" value="'+ p.uuid +'">'+
    '<input type="hidden" name="count" value="'+ count +'">'+
    '<input type="hidden" name="price" value="' + p.price + '">'+
    '<input type="hidden" name="discount" value="'+p.discount+'">'+

    '<td class="count">'+ count +'</td>'+
    '<td class="product_name"> '+ p.name +'</td>'+
    '<td class="price"> '+ ( p.price * (100 - p.discount) / 100 ) + "€" + ' </td>'+
    '<td class="discount">'+ ( p.discount ? ("-" + p.discount +'%') : "" ) + ' </td>'+

  '</tr>'
};

var button_actions = {
  calculator: function(action, value, target)
  {
    var calculator = jQuery(".calculator");
    var input = calculator.find(".amount_input");
    switch (action) {
      case "add":
        var current_val = input.val();
        if ( /\./.test(current_val) && (value == "." || current_val.split(".")[1].length > 1) )
        {
          return;
        }
        input.val( current_val  + "" + value );
        calculator.trigger("change");
      break;
      case "overwrite":
        input.val( value );
        calculator.trigger("change");
      break;
      case "backspace":
        var str = input.val();
        input.val( str.substring(0, str.length - 1) );
        calculator.trigger("change");
      break;
      case "exact":
        input.val( calculator.find(".amount_due").text() );
        calculator.trigger("change");
      break;
      case "confirm":
        calculator.unbind("change");
        var form = jQuery( "#"+calculator.attr("data-target") );
        form.find('input[name="sub_action"]').val( "cash" );
        form.trigger("submit");
        calculator.hide();

      break;
      case "show":
        calculator.show();
        calculator.attr("data-target", value);
        calculator.find(".amount_due").html( Mints.u.calculate_total( jQuery("#"+value) ) );

        calculator.on("change",function()
        {
          var change = parseFloat( input.val() ) - parseFloat( calculator.find(".amount_due").html() );
          calculator.find(".change").html( change >= 0 ? change : "" );
        });
      break;
      case "close":
        calculator.hide();
      break;
    }



  },
  section: function(section_name, data_target, target)
  {
    if(section_name =="new_order")
    {
      Mints.section_history = ["main"];
    }
    else if(section_name == "main")
    {
      Mints.section_history = [];
    }
    else
    {
      Mints.section_history.push( Mints.current_section );
    }

    section_change( section_name, data_target, target );
  },
  back: function(section_name, data_target, target)
  {
    jQuery("nav").show();
    section_change( Mints.section_history.pop() );
  },
  add_product: function(section_name, data_target, target)
  {
    button_actions.add_products_to_bill( section_name, data_target, target );
  },
  switch_tab: function(section_name, data_target, target)
  {
    var section = jQuery( '#'+section_name );
    section.find( '.tab_buttons > *' ).removeClass('active');
    section.find( '.tab_buttons [data-target="'+ data_target +'"]' ).addClass('active');
    section.find( '.tabs > *' ).hide();
    section.find( '.tabs [data-product_group="'+data_target+'"]' ).show();
  },
  add_products_to_bill: function( section_name, data_source, target )
  {
    var section = jQuery( '#'+section_name );
    var order_form = section.find('form');
    var client_id = order_form.find('input[name="client_id"]').val();
    var product_in_list = order_form.find('[data-source="'+ data_source +'"]');
    if( product_in_list.length == 0 )
    {
      // var product_count = order_form.find('.purchase_item').length;
      var client = client_id ? Mints.clients.get(client_id) : null;
      var product = Mints.products.get( data_source );
      product.discount = Mints.u.discount( product, client );
      order_form.find('.product_list').append( product_template( product, 1 ) );
    }
    else
    {
      var count = parseInt( product_in_list.find('input[name="count"]').val() );
      button_actions.update_products_in_bill( product_in_list, count+1 );
    }

    order_form.find('.total .amount').html( Mints.u.calculate_total( order_form ) );
  },
  update_product_discounts_in_bill: function( )
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

    button_actions.update_products_in_bill();
    order_form.find('.total .amount').html( Mints.u.calculate_total( order_form ) );
  },
  update_products_in_bill: function( product_in_list, new_count )
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
      item.find('td.count').html( count );
      item.find('td.discount').html( discount ? "-" + discount + "%" : "" );
      item.find('td.price').html( ( count * price * (100 - discount) / 100 ) / 100 + "€" );
    });

  },
  delete: function(resources, data_target, target )
  {
    var res = Mints[resources].get( target.parents('section').attr("data-source") );
    res.remove();

    button_actions.section(resources);
  }
}
