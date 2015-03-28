function takePicture() {
    navigator.camera.getPicture(function(uri) {
    var img = document.getElementById('camera_image');
    img.style.visibility = "visible";
    img.style.display = "block";
    img.src = uri;
    document.getElementById('camera_status').innerHTML = "Success";
    },
    function(e) {
       console.log("Error getting picture: " + e);
        document.getElementById('camera_status').innerHTML = "Error getting picture.";
        },
        { quality: 50, destinationType: navigator.camera.DestinationType.FILE_URI});
      };
