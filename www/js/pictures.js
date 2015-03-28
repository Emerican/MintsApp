function takePicture() {
    navigator.camera.getPicture(function(imageData) {
    var img = document.getElementById('camera_image');
    img.style.visibility = "visible";
    img.style.display = "block";
    img.src = "data:image/jpeg;base64," + imageData;
    document.getElementById('camera_status').innerHTML = "Success";
    },
    function(e) {
       console.log("Error getting picture: " + e);
        document.getElementById('camera_status').innerHTML = "Error getting picture.";
        },
        { quality: 80, destinationType: navigator.camera.DestinationType.DATA_URL});
      };
