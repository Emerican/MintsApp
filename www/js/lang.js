window.Lang = {
  section_names: function( section )
  {

    var values =
    {
      "main": "Sākums",
      "products": "Produkti",
      "add_products": "Pievienot produktu",
      "add_product_groups": "Pievienot produkta grupu",
      "browse_product": "Produktu saraksts",
      "browse_product_groups": "Produktu grupu saraksts",
      "clients": "Lietotāji",
      "add_clients": "Pievienot lietotāju",
      "add_client_groups": "Pievienot lietotāju grupu",
      "browse_clients": "Klientu saraksts",
      "browse_client_groups": "Lietotāju grupu saraksts",
      "settings": "Iestatījumi",
      "reports": "Atskaites",
      "new_order": "Jauns pasūtījums",
      "edit_order": "Labot pasūtījumu",
      "edit_clients": "Labot klientu",
      "browse_products": "Meklēt produktus",
      "edit_products": "Labot produktus",
      "edit_product_groups": "Labot produktu grupas",
      "edit_client_groups": "Labot klientu grupas",
      "browse_discounts": "Atlaides",
      "edit_discounts": "Labot atlaides",
      "add_discounts": "Pievienot atlaidi",
    };

    return values[section] ? values[section] : section;
  }
}
