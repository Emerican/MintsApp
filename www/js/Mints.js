jQuery(function()
{

  var container = jQuery('body');

  // the database structure
  var resources = [ "bills", "client_groups", "clients", "discounts", "payments", "product_groups", "products", "purchases"];

  var has_many = {
    product_groups: ["products","discounts"],
    client_groups: ["clients","discounts"],
    clients: ["payments","bills"],
    bills: ["purchases"]
  };

  var belongs_to = {
    bills:['clients'],
    clients:['client_groups'],
    payments:['clients'],
    products:['product_groups'],
    purchases:['bills','products'],
    discounts: ['clients','client_groups','products','product_groups']
  };

  var has_one = {
    // purchases:[]
  };

  var resource_params = {};
  var resource_search = {};

  resources.forEach(function(res)
  {
    resource_params[res] = ['uuid','created_at','updated_at','synced','syncing'];
    resource_search[res] = [];
  });

  resource_params.bills = resource_params.bills.concat(
    ['client_id','closed','paid_with']
  );
  resource_params.client_groups = resource_params.client_groups.concat(
    ['name']
  );
  resource_params.clients = resource_params.clients.concat(
    ['card_id','name','surname','client_group_id','phone','email','postpay','avatar', 'avatar_path']
  );
  resource_params.discounts = resource_params.discounts.concat(
    ['client_id','client_group_id','product_id','product_group_id','amount','weekdays','happy_hours']
  );
  resource_params.payments = resource_params.payments.concat(
    ['client_id','amount']
  );
  resource_params.product_groups = resource_params.product_groups.concat(
    ['name']
  );
  resource_params.products = resource_params.products.concat(
    ['product_group_id','name','price','description','special_offer','weekdays']
  );
  resource_params.purchases = resource_params.purchases.concat(
    ['product_id','bill_id','count','discount','price']
  );

  resource_search.client_groups = resource_search.client_groups.concat(
    ['name']
  );
  resource_search.clients = resource_search.clients.concat(
    ['name','surname','phone','email']
  );
  resource_search.product_groups = resource_search.product_groups.concat(
    ['name']
  );
  resource_search.products = resource_search.products.concat(
    ['name']
  );


  // bind event handlers to resources
  window.Mints = {
    debug: true,
    data_store: {},
    active_transfers: [],
    utilities:{
      trigger_action: function( action, data_target, original_target )
      {
        var action_name = action.split('/')[0];
        if (button_actions[action_name])
        {
          var target_section = action.split('/')[1] || original_target.parents("section").attr("id");
          button_actions[action_name]( target_section , data_target, original_target );
          return false;
        }
        else
        {
          return true;
        }
      },
      weekday: function()
      {
        var wkday = new Date().getDay();
        return wkday == 0 ? 7 : wkday;
      },
      sort_by_name: function(arr)
      {
        if ( arr[0].name )
        {
          return arr.sort(function(a,b)
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

          });
        }
        else
        {
          return arr;
        }
      },
      resource_list: function( resource_name, resources )
      {
        var items = resources || Mints[resource_name].get();

        var html_output = "";
        Mints.u.sort_by_name(items).forEach(function(item)
        {
          var resource_data = "";
          var color_class= "";
          switch ( resource_name )
          {
            case "discounts":
              resource_data = item.client_group().name + " " + item.product_group().name + " " + item.amount;
            break;
            case "products":

              if ( /0,3|0.3/i.test(item.name) ){ color_class = "color3" }
              if ( /0,5|0.5/i.test(item.name) ){ color_class = "color5" }
              if ( /0,7|0.7/i.test(item.name) ){ color_class = "color7" }
              resource_data = '<div class="name">'+ item.name +'</div><div class="price">€'+ item.price +'</div><div class="color_label"></div>';
            break;
            case "client_groups":
            case "product_groups":
              resource_data = item.name;
            break;
            case "clients":
              resource_data = item.name + " " + item.surname;
            break;
          }
          html_output +=  '<li><button class="'+ color_class +'" data-target="' + item.uuid + '" action="section/edit_' + resource_name + '">' + resource_data + '</button>' + "</li>";
        });

        return "<ul>" + html_output + "</ul>";
      },
      discount: function( product, client )
      {
        if( product.special_offer )
        {
          return 0;
        }
        var max_discount = 0;
        var all_product_discounts = product.product_group().discounts();

        // get all discounts for product_group that have no client_group
        if( all_product_discounts )
        {
          var product_discounts = all_product_discounts.filter(function(d){ return d.client_group_id.length == 0 });
          product_discounts.forEach(function(d)
          {
            max_discount = Math.max( max_discount, d.amount );
          });
        }

        if( client && client.client_group_id )
        {
          if( all_product_discounts  )
          {
            // get all discounts for product_group joint with client_group
            var joint_discounts = all_product_discounts.filter(function(d){ return d.client_group_id == client.client_group_id  });
            joint_discounts.forEach(function(d)
            {
              max_discount = Math.max( max_discount, d.amount );
            });
          }

          // get all discounts for client_group that have no product_group
          var all_client_discounts = client.client_group().discounts();
          if(all_client_discounts)
          {
            var client_discounts = all_client_discounts.filter(function(d){ return d.product_group_id.length == 0 });
            client_discounts.forEach(function(d)
            {
              max_discount = Math.max( max_discount, d.amount );
            });
          }

        }

        return max_discount;
      },
      calculate_total: function( order_form )
      {
        var total = 0;
        order_form.find('.purchase_item').each(function()
        {
          var item = jQuery(this);
          var discount = parseInt( item.find('input[name="discount"]').val() );
          var price = parseFloat( item.find('input[name="price"]').val() )*100;
          var count = parseInt( item.find('input[name="count"]').val() );

          total += count * price * ( 100 - discount ) / 100 ;
        });

        return total/100;
      },
      alert: function( msg )
      {
        alert(msg);
      },
      notice: function(msg, level, time)
      {
        level = level || "info";
        time = time || 1000;

        if( level != "debug" || Mints.debug )
        {
          var notice = container.find(".notice."+level);
          notice.addClass( "show_notice" );
          notice.find('.text').html( msg );
          setTimeout(function()
          {
            notice.removeClass( "show_notice" );
            // notice.find('.text').html( "" );
          }, time);
        }

      },
      singular:function( name )
      {
        return name.substring(0, name.length - 1);
      },
      connection: function( resource, id, type, callback )
      {
        var resource_id = "";
        var sub_resource = "";
        var data={};

        if( id && !Mints.data_store[resource][id].new )
        {
          resource_id = "/" + id;
        }
        if (resource.indexOf('/') != -1 )
        {
          sub_resource = "/" + resource.split('/')[1];
          resource = resource.split('/')[0];
        }

        if( type == 'post' )
        {
          data[ Mints.u.singular(resource) ] = Mints.data_store[resource][id];

          if(id && !Mints.data_store[resource][id].new )
          {
            data._method = "patch";
          }

          data.utf8 = "✓";
        }

        if( type == 'delete' )
        {
          type = 'post';
          data.utf8 = "✓";
          data._method = "delete";
        }

        var transfer = jQuery.ajax(
        {
          url: serverAdress+"/"+ resource + resource_id + sub_resource +".json",
          type: type,
          dataType: "json",
          data: data,
          success: function( json )
          {
            if( type == 'post' )
            {
              Mints.data_store[resource][id].synced = true;
              Mints.data_store[resource][id].syncing = false;
              Mints.data_store[resource][id].new = false;
            }
            callback( json );
            Mints.active_transfers = Mints.active_transfers.filter(function(i){ return i.readyState != 4 });
          },
          error:function (xhr, ajaxOptions, thrownError)
  				{
            if( type == 'post' )
            {
              Mints.data_store[resource][id].syncing = false;
            }

            Mints.u.notice("Nevar pieslēgties serverim. Pārbaudiet interneta savienojumu!", "alert", 5000);
  				}
        });
        Mints.active_transfers.push( transfer );
      },
      create_relations: function(resource,data_from_store)
      {
        var res = resource.class_name;

        var data = {};
        for( name in data_from_store )
        {
          data[name] = data_from_store[name];
        }

        data.set = function(params)
        {
          var self = this;
          var ds_res = Mints.data_store[res][self['uuid']];
          resource_params[res].forEach(function(param)
          {
            if( params && params[param] )
            {
              self[param] = ds_res[param] = html_sanitize(params[param]);
            }
          });

          self.synced = ds_res.synced = false;

          resource.sync();
        };

        data.remove = function()
        {
          var self = this;
          var ds_res = Mints.data_store[res][self['uuid']];
          self.synced = ds_res.synced = false;
          self.delete = ds_res.delete = true;
          resource.sync();
        };

        if (has_many[res])
        {
          has_many[res].forEach(function(rel)
          {
            data[rel] = function( )
            {
              var result_set = [];

              for(var id in Mints.data_store[rel])
              {
                var item = Mints.data_store[rel][id];
                if( item[ Mints.u.singular(res) + "_id" ] == this.uuid )
                {
                  result_set.push(Mints.u.create_relations(Mints[rel],item));
                }
              };

              return result_set.length ? result_set : null;

            };
            data['new_'+ Mints.u.singular( rel ) ] = function( params )
            {
              var new_obj = params || {};
              new_obj[ Mints.u.singular( res ) + "_id" ] = this.uuid;
              return Mints[rel].new( new_obj );

            };
          });
        }
        if (has_one[res])
        {
          has_one[res].forEach(function(rel)
          {
            data[Mints.u.singular(rel)] = function(){

              var result = null;
              for( var i in Mints.data_store[rel] )
              {
                var item = Mints.data_store[rel][i];

                if( item[ Mints.u.singular(res) + "_id" ] == this.uuid )
                {
                  result = Mints.u.create_relations(Mints[rel],item);
                  break;
                }

              }

              return result;

            };
          });
        }
        if (belongs_to[res])
        {
          belongs_to[res].forEach(function(rel)
          {
            data[Mints.u.singular(rel)] = function(){
              var rel_res_id = this[ Mints.u.singular(rel) + "_id" ];
              var item = Mints.data_store[rel][ rel_res_id ];
              return item ? Mints.u.create_relations(Mints[rel],item) : null;
            };
          });
        }

        return data;
      },
      save_to_data: function(resource, data)
      {
        var ds = Mints.data_store[resource.class_name];

        if( data.avatar_path )
        {
          data.avatar_path = serverAdress + data.avatar_path;
        }

        if( typeof data.synced == 'undefined' )
        {
          data.synced = true;
        }

        if( !ds[data.uuid] )
        {
          ds[data.uuid] = data;
        }
        else
        {
          var d_local = new Date( ds[data.uuid].updated_at );
          var d_server = new Date(data.updated_at);

          if (d_local > d_server)
          {
            ds[data.uuid].synced = false;
          }
          else if (d_local < d_server)
          {
            ds[data.uuid] = data;
          }
        }
        Mints[resource.class_name].trigger('change');
        return ds[data.uuid];
      },
      search_in_object: function(obj, string, class_name)
      {
        var found = false;
        for(var key in obj)
        {
          if ( resource_search[class_name].indexOf(key) != -1 && obj[key].search(new RegExp(string, "i")) != -1 )
          {
            found = true;
            break;
          }
        }
        return found;
      }
    }
  };
  Mints.u = Mints.utilities;

  resources.forEach(function(res)
  {
    window.Mints[res] = {};
    var ns = window.Mints[res];

    ns.class_name = res;
    Mints.data_store[res] = {};
    ns.events = {};

    /**
  	 * on()
     event handlers
  	 */
  	ns.on = function( type, handler )
  	{
  		if( !this.events )
  		{
  			this.events = {};
  		}
  		if( !(type in this.events) )
  		{
  			this.events[ type ] = [];
  		}
  		this.events[ type ].push( handler );
  	};

  	/**
  	 * trigger()
     event handlers
  	 */
  	ns.trigger = function( type, args )
  	{
  		if( this.events[type] )
  		{
  			for( var i = 0; i < this.events[type].length; i++ )
  			{
  				this.events[type][i].apply( this, args || [] );
  			}
  		}
  	};

    /**
  	 * unbind()
     event handlers
  	 */
    ns.unbind = function( type )
    {
      this.events[type] == null;
    };

    /**
  	 * get()
     load from data_store
  	 */
    ns.get = function(id)
    {
      var self = this;
      var ds = Mints.data_store[self.class_name];
      var result = [];

      if( !id )
      {
        for(var id in ds )
        {
          result.push( Mints.u.create_relations(self,ds[id]) );
        };
      }
      else
      {
        result = Mints.u.create_relations( self,ds[id] );
      }

      return result;
    };

    /**
  	 * load()
     load from server
  	 */
    ns.load = function(id)
    {
      var self = this;
      var result = [];
      Mints.u.connection(self.class_name, id, "get", function(data)
      {
        if( Object.prototype.toString.call( data ) === '[object Array]' )
        {
          data.forEach(function(item)
          {
            result.push( Mints.u.save_to_data( self, item ) );
          });
        }
        else
        {
          result = Mints.u.save_to_data( self, data );
        }

        self.trigger('load');
      });
    };


    /**
  	 * sync()
     sync to sever changed objects
  	 */
    ns.sync = function()
    {
      var self = this;
      var ds = Mints.data_store[self.class_name];
      for( var id in ds )
      {

        if( !ds[id].synced && !ds[id].syncing )
        {
          ds[id].syncing = true;
          if( ds[id].delete )
          {
            Mints.u.connection( self.class_name, id, "delete", function()
            {
              delete ds[id];
              Mints.u.notice( "Izdzēsts" );
              self.trigger('synced');
              self.trigger('deleted');
            });
          }
          else
          {
            Mints.u.connection( self.class_name, id, "post", function()
            {
              self.trigger('synced');
              self.trigger('sync');
            });
          }

        }
      }
    };

    /**
  	 * new()
     create new object
  	 */
    ns.new = function( params )
    {
      var self = this;

      var new_object = { new: true };
      resource_params[this.class_name].forEach(function(param)
      {
        if(param == 'uuid')
        {
          new_object[param] = UUID.generate();
        }
        else if( params && params[param] )
        {
          new_object[param] = html_sanitize( params[param] );
        }
        else
        {
          new_object[param] = null;
        }

      });
      var result = Mints.u.save_to_data( self, new_object );

      self.trigger('new');
      self.sync();

      return result;
    };

    /**
  	 * search()
    search for object
  	 */
    if( resource_search[ns.class_name].length )
    {
      ns.search = function( search_str )
      {
        var self = this;
        var ds = Mints.data_store[self.class_name];
        var result = [];

        for(var id in ds )
        {
          if( Mints.u.search_in_object( ds[id], search_str, self.class_name ) )
          {
            result.push( Mints.u.create_relations(self,ds[id]) );
          }

        };

        return result;
      };
    }

    /**
  	 * search_by_card()
    search by card for clients
  	 */
    if( ns.class_name == 'clients' )
    {
      ns.search_by_card = function( search_str )
      {
        var self = this;
        var ds = Mints.data_store[self.class_name];
        var result;

        for(var id in ds )
        {
          if( ds[id].card_id == search_str  )
          {
            result = Mints.u.create_relations(self,ds[id]);
            break;
          }

        };

        return result;
      };
    }

  });

  resources.forEach(function(res)
  {
    Mints[res].load();
  });

});
