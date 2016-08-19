var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname + '/../client'));

http.listen(3000, function() {
      console.log("server listen");
 })

// Chatroom
var PASSWORD = "aaa";
var Users = [];
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  //when an user enter password, check password. if password is valid, give users list to client.
  socket.on('an user access', function(data){
     if(data == PASSWORD){
        socket.emit('access result', {result: 1, users: Users});
     }else{
        socket.emit('access result', {result: 0, users: null});
     }
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', data);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (data) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = data.username;
    Users.push({username: data.username, profileImage: data.profileImage});
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      user: data,
      numUsers: numUsers});

    console.log('add user:'+data.username+'; num:'+numUsers);

  });

  //update users position
  socket.on('update position', function (data) {
    //console.log('update postion.'+data.username+', {'+data.position.lat+','+data.position.lng+'}');
    socket.broadcast.emit('update position', data);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      console.log('user disconneted.'+socket.username+'; num:'+numUsers);
      --numUsers;
      for(var i=0; i< Users.length; i++){
          if(Users[i].username == socket.username){
              Users.splice(i,1);
          }
      }

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
