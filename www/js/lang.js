window.Lang = {
  section_names: function( section )
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
        return "Pievienot lietotāju grupu"
      break;
      case "browse_users":
        return "Meklēt lietotājus"
      break;
      case "browse_groups":
        return "Meklēt lietotāju grupu"
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
  }
}
