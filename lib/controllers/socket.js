'use strict';

var mongoose = require('mongoose'),
    Message = require('../models/message'),
    User = require('../models/user'),
    io = require('socket.io');

function chat (server) {

  var socket = io(server);

  socket.on('connection', function(userSocket){

  //socket and userSocket must be diff

      //POPULATE CLIENT SIDE CHATBOX WITH PAST 50 POSTS
    userSocket.on("populate", function(alert){

      Message.find().sort({timestamp: -1}).limit(20).populate("user").exec(function(err, queryResults){
        // result list displays in reverse so have to iterate in reverse
        // limits fetched items to 50 on reload of page
        var queryLength;
        if (queryResults.length < 20) {
          queryLength = queryResults.length;
        } else {
          queryLength = 20;
        }

        // repopulates front end / angular with db-saved msgs
        for (var i = 0; i < queryLength; i++){
          var msgFromDB = queryResults.pop();
          //console.log(msgFromDB.user.name);
          var msg = {
            user: {name: msgFromDB.user.name},
            content: msgFromDB.message,
            image: msgFromDB.imageUrl
          };
          //console.log(msg);
          socket.emit('chat message', msg);
        }
      });
    });

    //console.log('a user connected');
    userSocket.on('post message', function(msg){

      //saves msg to database
      User.findOne({name: msg.user.name}, function(err, msgUserRef) {
        var newMessage = new Message({user: msgUserRef, message: msg.content, imageUrl: msg.image, timestamp: new Date()});
        newMessage.save();

        //emits msg to front end
        socket.emit('chat message', msg);
      });

    });
  });

}

exports.chat = chat;