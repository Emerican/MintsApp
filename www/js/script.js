jQuery(function()
{

  var container = jQuery('body');
  var navigation = Mints.navigation = container.find('nav');

  Mints.section_history = [];
  Mints.current_section = "main";

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

  container.on('click', '.product_list .purchase_item', function()
  {
    var target = jQuery(this);
    var order_form = target.parents('form');
    var count = parseInt( target.find('input[name="count"]').val() );
    if( count > 1 )
    {
      button_actions.update_products_in_bill( target, count-1 );
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

    if( data_load_actions[ section_id ] )
    {
      data_load_actions[ section_id ]( section );
    }

  });

  navigation.on('change',function()
  {
    container.find('button[action="back"]').toggle( Mints.section_history.length > 0 );
    navigation.find('.title').html( Lang.section_names(Mints.current_section) );

  }).trigger('change');

  container.on("input",".section_search input",function()
  {
    var target = jQuery(this);
    var re = new RegExp(target.val().trim(), "i");
    var items = target.parents(".contents").find(".product_group li");

    items.hide().filter(function(item)
    {
      return re.test( jQuery(this).find(".name").text() );
    }).show();

  });

  container.on('click', '.add_avatar_button', function()
  {
    takePicture( jQuery(this).parent() );
  });

  container.on('click', 'button, .button', function()
  {
    var target = jQuery(this);

    return Mints.u.trigger_action( target.attr('action'), target.attr('data-target'), target );
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
          Mints[resource_name].on('sync', function()
          {
            Mints.u.notice( "Izveidots" );
            Mints[resource_name].unbind('sync');
            Mints.u.trigger_action( "section/new_order" );
          });

          var bill = Mints[resource_name].new( {
            client_id:form_obj.client_id,
            closed: form_obj.sub_action != "save",
            paid_with: form_obj.sub_action != "save" ?  form_obj.subaction : ""
          } );

          if( Object.prototype.toString.call( form_obj.product_id ) === '[object Array]' ) {
            for(var i = 0; i < form_obj.product_id.length; i++)
            {
              Mints.purchases.new( { product_id:form_obj.product_id[i], count: form_obj.count[i], bill_id: bill.uuid } );
            }
          }
          else
          {
            Mints.purchases.new( { product_id:form_obj.product_id, count: form_obj.count, bill_id: bill.uuid } );
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
            tMints.u.rigger_action( "section/browse_" + resource_name );
            form.find('input, textarea').val("");
            form.find('img').remove();
          });
          Mints[resource_name].new( form_data );
        }

      break;

      case 'update':
        if (resource_name == 'bills' )
        {
          var form_data = form.serializeObject();

          Mints[resource_name].on('sync', function()
          {
            Mints.u.notice( "Saglabāts" );
            Mints[resource_name].unbind('sync');
            Mints.u.trigger_action( "section/main" );
          });
          Mints[resource_name].get(resource_id).set( form_data );

          if( Object.prototype.toString.call( form_data.product_id ) === '[object Array]' ) {
            for(var i = 0; i < form_data.product_id.length; i++)
            {
              if( form_data.purchase_self_id[i] )
              {
                Mints.purchases.get( form_data.purchase_self_id[i] ).set( { product_id:form_data.product_id[i], count: form_data.count[i], bill_id: form_data.uuid } )
              }
              else
              {
                Mints.purchases.new( { product_id:form_data.product_id[i], count: form_data.count[i], bill_id: form_data.uuid } );
              }

            }
          }
          else
          {
            if( form_data.purchase_self_id )
            {
                Mints.purchases.get( form_data.purchase_self_id ).set( { product_id:form_data.product_id, count: form_data.count, bill_id: form_data.uuid } );
            }
            else
            {
              Mints.purchases.new( { product_id:form_data.product_id, count: form_data.count, bill_id: form_data.uuid } );
            }

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
            Mints.u.notice( "Saglabāts" );
            Mints[resource_name].unbind('sync');
            Mints.u.trigger_action( "section/browse_" + resource_name );
          });
          Mints[resource_name].get(resource_id).set( form_data );
        }

      break;

      case 'search':
        var search_result = Mints[resource_name].search( form.serializeObject().search );
        var content = form.parent().find('.contents');
        content.html( Mints.u.resource_list( resource_name, search_result ) );
      break;

    }


    // handle data refresh in .on('change',function(){}) event
    form.parents('section').trigger('change');

  });
  container.on('click', 'button[name="sub_action"]',function(e)
  {
    var target = jQuery(this);
    target.parents("form").find('input[name="sub_action"]').val( target.attr("value") );
  });

  container.on('click', '.nfc', function()
  {
    var target = jQuery(this);
    Mints.u.notice( "Gatavs kartei" );

    Nfc.unbind('tag_read');

    Nfc.on('tag_read', function()
    {
      target.find("input").val( Nfc.tag );
      target.find(".input_val").html( Nfc.tag );
      Nfc.unbind('tag_read');
    });
  });

  setTimeout(function(argument) {
    container.find("section#main").trigger("data_load");
  },1500);

});
