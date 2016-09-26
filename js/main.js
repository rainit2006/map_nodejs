$(function() {

  var socket = io();
  var map;

  var connected = false;

  var logon = false;

  var SECONDS = 5000;
  //var SECONDS_POSITION = 2000;
  //var SECONDS_DRAW = 5000;
  var IMAGENUM = 20;
  var myLatLng = {lat: 35.6311403, lng: 139.788367}; //TFTビル
  var myUser = {
    id: null,
    username: null,
    profileImage: null,
    position:myLatLng
  };

  var CompanyUser = {
    id: 0,
    username:'本社',
    profileImage:"company",
    position: myLatLng
  }
  var Users = [];


  var userLogon = sessionStorage.getItem('userLogon');
  if(userLogon){
    myUser = JSON.parse(sessionStorage.getItem('myUser'));
    $('#logonPage').hide();
    $('#userLogon').hide();
    //$('#userLogon').trigger('click');
    $('#HomePage').show();
    logon = true;

    init();
    console.log("refresh  "+myUser.username);
  }




/////////////Logon Page//////////////////////
  $('#enter').click(function(){
      logonPocess();
  });

  // $(window).keydown(function (event) {
  //   if (event.which === 13) {
  //     if (!logon) {
  //       logonPocess();
  //     }
  //   }
  // });

  function logonPocess(){
    var password = cleanInput($('.passwordInput').val().trim());
    if(password === ""){
      $('#result').empty().append('<p>your password is wrong!</p>');
      return;
    }
    socket.emit('an user access', password);
    $('#result').empty().append('<p>please wait....</p>');
    showImageList();
  }

  /////////////User Logon Page//////////////////////

function showImageList(){
  var selectedImgID = Math.floor( Math.random() * 20 ) ;
  $("#imageSeleted").empty().append("<h3>Please select your favorite profile image.</h3><img src='img/"+selectedImgID+".png'>");
  myUser.profileImage = selectedImgID;

  var node = "";
  for(var i = 0; i<IMAGENUM; i++){
      node += "<li id='img"+i+"'><img src='img/"+i+".png'></li>";
  }
  $("#imageList").empty().append("<ul>"+node+"</ul>");


  $("#imageList li").on('click', function(){
      var imgID = (this.id).substr(3);

      $("#imageSeleted").empty().append("<h3>Please select your favorite profile image.</h3><img src='img/"+imgID+".png'>");
      myUser.profileImage = imgID;
  });
}




  $('#logon').click(function(){
          username = cleanInput($('.usernameInput').val().trim());
          if (username) {
              sessionStorage.setItem('userLogon', 'true');
              $('#userLogon').fadeOut("slow");
              $('#HomePage').show();
              myUser.username = username;
              sessionStorage.setItem('myUser', JSON.stringify(myUser));
              init();
          }
  });

  function init(){
      updatePosition();
      initMap();
      if(map != null){
          drawMarks();
      }

      $('#infoPanel').empty().append("<p><span id='My'><img src='img/"+myUser.profileImage+".png'>"+myUser.username+"</span></p><p>My positon is (lat: "+myUser.position.lat+", lng:"+myUser.position.lng+")");
      socket.emit('add user', myUser);

      //update my position every 1 sec and update google map.
      setInterval(updatePosition, SECONDS);
      //setInterval(drawMarks, SECONDS_DRAW);
  }


  ///////////////HomePage/////////////////////
  $('#chatEnter').click(function(){
      sendMessage(myUser, socket);
  });

  // Draw users list.
  function drawUsers(){
      if((Users == null)||(Users.length == 0)){
          $('.userView').empty().append("There are no users now.");
      }else{
          var node = "<p>There are "+(Users.length -1)+" other users.</p>";
          for(var i=0; i<Users.length; i++){
              if(Users[i].username != myUser.username){
                  node += "<span class='userspan' id='"+Users[i].username+"'><img src='img/"+Users[i].profileImage+".png'>"+Users[i].username+"</span>";
              }
          }
          $('.userView').empty().append(node);
      }
  }

  $(document).on('click', '#My', function(){
      if(map != null){
          map.setCenter(myUser.position.lat, myUser.position.lng);
      }
  });

  $(document).on( 'click', '.userspan', function() {
    //alert( 'WORKS!' );
    var username = $(this).attr('id');
    var user = findByName(username);
    if(map != null){
      map.setCenter(user.position.lat, user.position.lng);
      map.drawRoute({
           origin: [myUser.position.lat, myUser.position.lng],
           destination: [user.position.lat, user.position.lng],
           travelMode: 'driving',
           strokeColor: '#131540',
           strokeOpacity: 0.6,
           strokeWeight: 6
       });
    }
 });

 function findByName(username){
   for(var i = 0; i < Users.length; i++){
     if(Users[i].username == username){
        return Users[i];
     }
   }
 }

  // Socket events
  socket.on('access result', function(data){
      if(data.result == 0){
          $('#result').empty().append('<p>your password is wrong!</p>');
          return;
      }else{
          $('#logonPage').fadeOut("slow");
          $('#userLogon').show();
          Users = data.users;
          drawUsers();
      }
  });

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to our chat room.";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
    Users = data.users;
    drawUsers();
  });
  // Whenever the server emits 'new message', update the chat body

  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log('user joined:'+data.user.username);
    log(data.user.username + ' joined');

    if((Users == null)||(Users.length == 0)){
      Users.push(data.user);
    }else{
      var i ;
      for(i= 0; i < Users.length; i++){
          if(Users[i].username == data.user.username){
              Users[i] = data.user;
              break;
          }
      }
      if(i>= Users.length){
          Users.push(data.user);
      }
    }

    addParticipantsMessage(data);
    drawUsers();
  });

  ///update user position.
  socket.on('update position', function (data) {
      //console.log('update position', data.username);
     if(Users == null) {
        console.log('ERR: update postion. but Users is null.');
        Users.push(data);
     }else{
         $.each(Users, function(index){
            if(Users[index].username == data.username){
                Users[index] = data;
                return;
            }
         });
     }
  });

  socket.on('user left', function(data){
     for(var i=0; i<Users.length; i++){
        if(Users[i].username == data.username){
            Users.splice(i, 1);
        }
     }
     drawUsers();
  });

  ///////////Google Map///////////////////////
  function initMap(){
        map = new GMaps({
          div: '#map',
          lat: myUser.position.lat,
          lng: myUser.position.lng,
          zoom: 9,
          click: function(e){
            map.cleanRoute();
          }
        });

        console.log("initMap finished.");
  }

  function updatePosition(){
          GMaps.geolocate({
              success: function(position) {
                myUser.position = {lat: position.coords.latitude, lng:position.coords.longitude };
                sessionStorage.setItem('myUser', JSON.stringify(myUser));
              },
              error: function(error) {
                console.log('Geolocation failed: '+error.message);
              },
              not_supported: function() {
                console.log("Your browser does not support geolocation");
              },
              always: function() {
              }
          });
          // if(map != null){
          //     map.setCenter(myUser.position.lat, myUser.position.lng);
          // }
          if(myUser.position != null){
              //console.log('emit my position');
              socket.emit('update position', myUser);
          }
          if(map != null){
              drawMarks();
          }
  }

  function drawMarks(){
        //console.log('drawMarks');
        //console.log('Users:'+Users.length);
        if(map == null) return;
        map.removeMarkers();

        var myImage = {
            url:'img/'+myUser.profileImage+'.png',
            scaledSize: new google.maps.Size(30, 30),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(0, 0)
        };

        map.addMarker({
           lat: myUser.position.lat,
           lng: myUser.position.lng,
           icon: myImage,
           title: myUser.username,
           click: function(e){
             //map.setCenter(e.position);
             console.log(e.title + " is clicked.");
           }
         });

        if(CompanyUser != null){
          var image = {
              url:'img/'+CompanyUser.profileImage+'.png',
              scaledSize: new google.maps.Size(30, 30),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(0, 0)
          };
          map.addMarker({
             lat: CompanyUser.position.lat,
             lng: CompanyUser.position.lng,
             icon: image,
             title: CompanyUser.username,
             click: function(e){
                 //map.setCenter(e.position);
                 console.log("CompanyUser is clicked.");
                 map.drawRoute({
                      origin: [myUser.position.lat, myUser.position.lng],
                      destination: [CompanyUser.position.lat, CompanyUser.position.lng],
                      travelMode: 'driving',
                      strokeColor: '#131540',
                      strokeOpacity: 0.6,
                      strokeWeight: 6
                  });
             }
           });
        }

        if(Users != null){
            for(var i = 0; i < Users.length; i++){
                var user = Users[i];
                if(user == null){
                  console.log('ERR: User is null');
                  continue;
                }
                if(user.position == null){
                  console.log('ERR: User position is null');
                  continue;
                }
                var image = {
                    url:'img/'+user.profileImage+'.png',
                    scaledSize: new google.maps.Size(30, 30),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(0, 0)
                };

                map.addMarker({
                   lat: user.position.lat,
                   lng: user.position.lng,
                   icon: image,
                   title: user.username,
                   click: function(e){
                     //map.setCenter(e.position);
                     console.log(e.title + " is clicked.");
                     map.drawRoute({
                          origin: [myUser.position.lat, myUser.position.lng],
                          destination: [user.position.lat, user.position.lng],
                          travelMode: 'driving',
                          strokeColor: '#131540',
                          strokeOpacity: 0.6,
                          strokeWeight: 6
                      });
                   }
                });
            } //for(var i...)
        }
  }

});
