$(function() {
  var map;
  var IMAGENUM = 20;
  var myLatLng = {lat: -33.9, lng: 151.2};
  var myUser = {
    id: null,
    name: null,
    profileImage: null,
    position:null
  };

  showImageList();

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
  });

  $('#logon').click(function(){
          username = cleanInput($('.usernameInput').val().trim());
          if (username) {
              $('#userLogon').fadeOut("slow");
              $('#HomePage').show();
              myUser.name = username;
              $('#infoPanel').empty().append("<p>"+myUser.name+"</p>");

              //socket.emit('new player add', myUser);
              initMap();
          }
  });

  // Prevents input from having injected markup
  function cleanInput (input) {
      return $('<div/>').text(input).text();
  }

  //////////////////////////////////////////////
  ///////////////HomePage//////////////////////
  //////////////////////////////////////////////
  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  $('#logon').click(function(){
      sendMessage();
  }

  // Sends a chat message
  function sendMessage () {
    var message = $('#inputMessage').val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $('#inputMessage').val('');
      addChatMessage({
        username: myUser.name,
        profileImage:myUser.profileImage,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  function addChatMessage (data, options) {
      // Don't fade the message in if there is an 'X was typing'
      var $typingMessages = getTypingMessages(data);
      options = options || {};
      if ($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
      }

      var $usernameDiv = $('<span class="username"/><img src="image/"+data.profileImage+".png">')
        .text(data.username)
        .css('color', getUsernameColor(data.username));
      var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

      var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .append($usernameDiv, $messageBodyDiv);

      addMessageElement($messageDiv, options);
  }


  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
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
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
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

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  /////// Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
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
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  ///////////Google Map///////////////////////
  function initMap(){
        map = new GMaps({
          div: '#map',
          lat: -33.9,
          lng: 151.2,
          zoom: 9
        });

        var beaches = [
        ['Bondi Beach0', -33.890542, 151.274856, 4],
        ['Coogee Beach1', -33.923036, 151.259052, 5],
        ['Cronulla Beach2', -34.028249, 151.157507, 3],
        ['Manly Beach3', -33.80010128657071, 151.28747820854187, 2],
        ['Maroubra Beach4', -33.950198, 151.259302, 1]
        ];

        var markers = [];
        for(var i = 0; i < beaches.length; i++){
            var image = {
                url:'img/'+i+'.png',
                scaledSize: new google.maps.Size(30, 30),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(0, 0)
            };
            var beach = beaches[i];
            map.addMarker({
               lat: beach[1],
               lng: beach[2],
               icon: image,
               title: beach[0],
               click: function(e){
                 //map.setCenter(e.position);
                 console.log(e.title + " is clicked.");
               }
             });
        } //for(var i...)
  }

});
