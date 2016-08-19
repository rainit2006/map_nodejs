$(function() {

  var socket = io();
  var map;

  var connected = false;
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  var SECONDS = 3000;
  //var SECONDS_POSITION = 2000;
  //var SECONDS_DRAW = 5000;
  var IMAGENUM = 20;
  var FADE_TIME = 150; // ms
  var myLatLng = {lat: 35.6311403, lng: 139.788367}; //TFTビル
  var myUser = {
    id: null,
    username: null,
    profileImage: null,
    position:myLatLng
  };

  var testUser = {
    id: 0,
    username:'test',
    profileImage:18,
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

    init();
    console.log("refresh  "+myUser.username);
  }




/////////////Logon Page//////////////////////
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


  $('#enter').click(function(){
      //send to server.
      var password = cleanInput($('.passwordInput').val().trim());
      socket.emit('an user access', password);
      $('#result').empty().append('<p>please wait....</p>');
      showImageList();
  });

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

      $('#infoPanel').empty().append("<p>"+myUser.username+"</p><p>My positon is (lat: "+myUser.position.lat+", lng:"+myUser.position.lng+")");
      socket.emit('add user', myUser);

      //update my position every 1 sec and update google map.
      setInterval(updatePosition, SECONDS);
      //setInterval(drawMarks, SECONDS_DRAW);
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
      return $('<div/>').text(input).text();
  }

  ///////////////HomePage/////////////////////
  $('#chatEnter').click(function(){
      sendMessage();
  });

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sends a chat message
  function sendMessage () {
    var message = $('#inputMessage').val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $('#inputMessage').val('');
      var sendData = {
        username: myUser.username,
        profileImage:myUser.profileImage,
        message: message
      };
      addChatMessage(sendData);
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', sendData);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  function addChatMessage (data, options) {
      options = options || {};

      var $usernameDiv = $('<img src="img/'+data.profileImage+'.png"><span class="username"/>')
        .text(data.username)
        .css('color', getUsernameColor(data.username));
      var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

      var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .append($usernameDiv, $messageBodyDiv);

      addMessageElement($messageDiv, options);
    }

    function addMessageElement (el, options) {
      var $el = $(el);

      // Setup default options
      if (!options) {
        options = {};
      }
      if (typeof options.fade === 'undefined') {
        options.fade = true;
      }
      if (typeof options.prepend === 'undefined') {
        options.prepend = false;
      }

      // Apply options
      if (options.fade) {
        $el.hide().fadeIn(FADE_TIME);
      }
      if (options.prepend) {
        $('.messages').prepend($el);
      } else {
        $('.messages').append($el);
      }
      $('.messages')[0].scrollTop = $('.messages')[0].scrollHeight;
    }


    // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
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
          if((Users == null)||(Users.length == 0)){
              $('#userView').empty().append("There are no users now.");
          }else{
              var node = "There are "+Users.length+" users.";
              for(var i=0; i<Users.length; i++){
                  node += "<span><img src='img/"+Users[i].profileImage+".png'>"+Users[i].username+"</span>";
              }
              $('#userView').empty().append(node);
          }
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
  });
  // Whenever the server emits 'new message', update the chat body

  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log('user joined:'+data.user.username);
    log(data.user.username + ' joined');
    Users.push(data.user);
    addParticipantsMessage(data);
  });

  ///update user position.
  socket.on('update position', function (data) {
      //console.log('update position', data.username);
     if(Users == null) {
        console.log('ERR: update postion. but Users is null.');
        Users.push(data);
     }else{
         $.each(Users, function(){
            if(this.username == data.username){
                this.position = data.position;
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
  });

  ///////////Google Map///////////////////////
  function initMap(){
        map = new GMaps({
          div: '#map',
          lat: myUser.position.lat,
          lng: myUser.position.lng,
          zoom: 9
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
          if(map != null){
              map.setCenter(myUser.position.lat, myUser.position.lng);
          }
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

        if(testUser != null){
          var image = {
              url:'img/'+testUser.profileImage+'.png',
              scaledSize: new google.maps.Size(30, 30),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(0, 0)
          };
          map.addMarker({
             lat: testUser.position.lat,
             lng: testUser.position.lng,
             icon: image,
             title: testUser.username,
             click: function(e){
                 //map.setCenter(e.position);
                 console.log("testUser is clicked.");
                 map.drawRoute({
                      origin: [myUser.position.lat, myUser.position.lng],
                      destination: [testUser.position.lat, testUser.position.lng],
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
