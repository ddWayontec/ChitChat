var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let express = require('express');
app.use(express.static(__dirname + '/'));

http.listen(3000, function(){
    console.log('listening on *:3000');
});

var usersOnline = 0;
var usersArr = [];
var messageArr = [];

io.on('connection', function(socket){
    usersOnline++;
    io.emit('update users', usersOnline);

    var isUnique = true;
    var uniqueName;
    do {
        isUnique = true;
        uniqueName = 'Anonymous' + Math.floor(Math.random() * 500);
        for(var i=0; i<usersArr.length; i++) {
            if(uniqueName === usersArr[i]) {
                isUnique = false;
            }
        }
    } while(isUnique === false)
    uniqueName = '<span style=color: black>' + uniqueName + '</span>';
    socket.nickname = uniqueName;
    socket.emit('new user', uniqueName);

    usersArr.push(uniqueName);
    io.emit('update userlist', usersArr);

    socket.emit('update messagelist', messageArr);

    socket.on('chat message', function(data){
        if(data.msg.includes('/nickcolor')) {
            var mssg = data.msg;
            mssg = mssg.split(" ")[1]; //unsafe if client message isnt perfect
            newNick = '<span style=color:' + mssg + '>' + data.name + '</span>';
            usersArr.splice( usersArr.indexOf(socket.nickname), 1 );
            socket.nickname = newNick;
            usersArr.push(newNick);
            io.emit('update userlist', usersArr);
            socket.emit('new color', newNick);
        }
        else if(data.msg.includes('/nick')) {
            var mssg = data.msg;
            mssg = mssg.split(" ")[1]; //unsafe if client message isnt perfect
            var color = data.name;
            color = color.split(":")[1];
            color = color.split("\"")[0];
            mssg = '<span style=color:' + color + '>' + mssg + '</span>';
            var alreadyExists = false;
            for(var i=0; i<usersArr.length; i++) {
                if(mssg === usersArr[i]) {
                    alreadyExists = true;
                }
            }
            if(alreadyExists === false) {
                usersArr.splice( usersArr.indexOf(socket.nickname), 1 );
                socket.nickname = mssg;
                socket.emit('new user', mssg);
                usersArr.push(mssg);
                io.emit('update userlist', usersArr);
            }
        }
        else {
            var date = new Date();
            var time = date.toLocaleTimeString();
            messageArr.push(time + ' ' + data.name + ' - ' + data.msg);
            socket.broadcast.emit('chat message', time + ' ' + data.name + ' - ' + data.msg);
            socket.emit('chat message', "<b>" + time + ' ' + data.name + ' - ' + data.msg + "</b>")
        }
    });

    socket.on('disconnect', function(){
        usersOnline--;
        io.emit('update users', usersOnline);
        usersArr.splice( usersArr.indexOf(socket.nickname), 1 );
        io.emit('update userlist', usersArr);
    });
});