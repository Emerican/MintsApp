var populate_form = function( section, data )
{
  var form = section.find('form');

  for( var key in data )
  {
    var value = data[key];

    if( key == "avatar_path" )
    {
      form.find('.avatar_path_image').remove();
      form.find('.avatar_image').remove();
      form.find('.field.avatar').append('<img class="avatar_path_image" src="'+value+'">');
    }
    else
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
  }
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
    html_tabs_buttons += '<button action="switch_tab" data-target="'+pg.uuid+'">' + pg.name + '</button>';

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
      if( !item.weekdays || item.weekdays.indexOf( Mints.u.weekday() ) != -1 )
      {
        var color_class= "";
        if ( /0,3|0.3/i.test(item.name) ){ color_class = "color3" }
        if ( /0,5|0.5/i.test(item.name) ){ color_class = "color5" }
        if ( /0,7|0.7/i.test(item.name) ){ color_class = "color7" }
        pg_output +=  '<li><button class="'+ color_class +'" data-target="' + item.uuid + '" action="add_product"><div class="name">'+ item.name +'</div><div class="price">€'+ item.price +'</div><div class="color_label"></div></button>' + "</li>";
      }

    });

    html_tabs += '<ul class="product_group" data-product_group="'+ pg.uuid +'">' + pg_output + "</ul>";

  });

  return { tab_buttons: html_tabs_buttons, tabs: html_tabs };

}

var open_bills = function( argument )
{

  return Mints["bills"].get().filter(function(i) {
    return i.closed != "true";
  });
}

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

var data_load_actions = {
  main: function( section )
  {
    var bill_buttons = open_bills().map(function(b)
    {

      total_price = ( b.purchases().map(function(p)
      {
        var product = Mints.products.get( p.product_id );
        return parseFloat( product.price ) * 100 * p.count;

      }).reduce(function(pv, cv) { return pv + cv; }, 0) ) /100;

      return '<button action="section/edit_order" data-target="' + b.uuid + '"><div class="name">bill</div><div class="price">€'+total_price+'</div></button>'
    });
    section.find('.open_bills').html( bill_buttons.join("") );
  },
  add_clients: function(section)
  {
    section.find('select.client_groups').html( get_list_options('client_groups') );
  },
  add_products: function(section)
  {
    section.find('select.product_groups').html( get_list_options('product_groups') );
  },
  add_discounts: function(section)
  {
    section.find('select.client_groups').html( get_list_options('client_groups',true) );
    section.find('select.product_groups').html( get_list_options('product_groups',true) );
  },
  browse_discounts: function(section)
  {
    section.find('.contents').html( Mints.u.resource_list("discounts") );
  },
  browse_products: function(section)
  {
    section.find('.contents').html( Mints.u.resource_list("products") );
  },
  browse_product_groups: function(section)
  {
    section.find('.contents').html( Mints.u.resource_list("product_groups") );
  },
  browse_clients: function(section)
  {
    section.find('.contents').html( Mints.u.resource_list("clients") );
    Nfc.on('tag_read', function()
    {
      var client = Mints.clients.search_by_card( Nfc.tag );

      trigger_action("section/edit_clients", client.uuid);

      Nfc.unbind('tag_read');
    });
  },
  browse_client_groups: function(section)
  {
    section.find('.contents').html( Mints.u.resource_list("client_groups") );
  },
  edit_clients: function(section)
  {
    section.find('select.client_groups').html( get_list_options( 'client_groups' ) );
    populate_form( section, Mints.clients.get( section.attr('data-source') ) );
  },
  edit_products: function(section)
  {
    section.find('select.product_groups').html( get_list_options( 'product_groups' ) );
    populate_form( section, Mints.products.get( section.attr('data-source') ) );
  },
  edit_product_groups: function(section)
  {
    populate_form( section, Mints.product_groups.get( section.attr('data-source') ) );
  },
  edit_client_groups: function(section)
  {
    populate_form( section, Mints.client_groups.get( section.attr('data-source') ) );
  },
  order_common: function(section)
  {
    section.find('.client_data, .product_list, .amount').html("");
    Mints.navigation.hide();
    section.find('.client_data').html('<div id="client"><span class="shop_client_name">Tims Mints' + '<img id="shop_avatar" width="85px" height="100px"src="img/logo.png"></span></div>');

    var categories = section.find('.categories');
    var content = section.find('.contents');
    var product_list_response = product_list();
    section.find('.contents .tabs').html( product_list_response.tabs );
    section.find('.categories .tab_buttons').html( product_list_response.tab_buttons );

    section.find('.categories .tab_buttons button:first-child').trigger("click");
  },
  new_order: function(section)
  {
    this.order_common( section );

    Nfc.on('tag_read', function()
    {
      var client = Mints.clients.search_by_card( Nfc.tag );
      if(client)
      {
        this.add_client(section, client);
      }

      Nfc.unbind('tag_read');
    });
  },
  add_client: function(section, client)
  {
    section.find('img').remove();
    section.find('avatar_path').remove();
    section.find('.client_data').html('<input type="hidden" name="client_id" value="'+ client.uuid +'"><span class="shop_client_name">'+ client.name + ' ' + client.surname  +' <img id="shop_avatar" width="150px" height="200"src="'+ client.avatar_path + '"></span>');
    button_actions.update_product_discounts_in_bill();
  },
  edit_order: function(section)
  {
    this.order_common( section );
    var bill = Mints.bills.get( section.attr('data-source') );
    var order_form = section.find('form');
    var client_id = order_form.find('input[name="client_id"]').val();
    populate_form( section, bill );



    bill.purchases().forEach(function(p)
    {
      var product = Mints.products.get( p.product_id );


      var client = client_id ? Mints.clients.get(client_id) : null;
      product.discount = Mints.u.discount( product, client );
      order_form.find('.product_list').append( product_template( product, p.count, p.uuid ) );
    });



    order_form.find('.total .amount').html( Mints.u.calculate_total( order_form ) );
  },

};
