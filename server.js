const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://192.168.1.163:19000',
    methods: ['GET', 'POST'],
  },
});


io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`)

  socket.on("joinService", ({roomID}) => {
    console.log('user joined service');
    console.log(roomID);
    socket.join(roomID);
  })
  socket.on("send", ({amount, account_number, purpose, sender, roomID}, callback) => {
    console.log(amount, purpose);

   Transaction.create({amount: amount, purpose: purpose});
    //main logic
    User.findOne({account_number}).then(user => {
      if (!user) return callback({error: 'Sorry not permitted'});

      const account_balance = user.account_balance + amount;

      User.findOneAndUpdate(
        {account_number},
        {$set: {account_balance}},
        {new: true},
        (err) => {
          if (err) return callback({error:"Not updated"});
          //Update the senders account
          User.findOne({email: sender}).then((sentBy) => {
            const newSenderBalance = sentBy.account_balance - amount;

            //Update the senders account balance
            User.findOneAndUpdate(
              {account_number: sentBy.account_number},
              {$set: {account_balance: +newSenderBalance}},
              {new: true},
              () => {
                //Broadcast to roomID
                socket.broadcast.to(roomID).emit('moneySent', {
                  amount,
                  purpose,
                  user,
                  receiver: user.email,
                  sender,
                });
              }
            );
          });

        }
      );
    });
  })

  socket.on("request", ({amount, account_number, purpose, sender, roomID}, callback) => {
    console.log(amount, purpose);
    User.findOne({account_number}).then(user => {
      if (!user) return callback({error: 'Sorry not permited'});

      const account_balance = user.account_balance - amount;

      User.findOneAndUpdate(
        {account_number},
        {$set: {account_balance}},
        {new: true},
        (err) => {
            if (err) return callback({error: 'Not updated'});

            User.findOne({email: sender}).then((sentBy) => {
              const newSenderBalance = sentBy.account_balance + amount;

              User.findOneAndUpdate(
                {account_number: sentBy.account_number},
                {$set: {account_balance: +newSenderBalance}},
                {new: true},
                () => {

                  socket.broadcast.to(roomID).emit('moneyReceived', {
                    amount,
                    purpose,
                    user,
                    receiver: user.email,
                    sender,
                  });
                }
              )
            })
        }
      )
    })
});
})



// io.on('connection', (socket) => {
//   console.log(`User connected to ${socket.id}`);

//   socket.on("joinService", ({roomID}) => {
//     console.log('user joined service');
//     console.log(roomID);
//     socket.join(roomID);
//     //Find user update account balance and also receiver balance
//     User.findOne({account_number})
//     .then(user => {
//       if (!user) return callbackify({error: 'Sorry not permited'});

//       //Get user account and update balance
//       const account_balance = user.account_balance + amount;

//       //Update
//       User.findOneAndUpdate(
//         {account_number},
//         {$set: {account_balance}},
//         {new: true},
//         err => {
//           if (err) return callback({error: 'Not updated'})

//           //Update senders account_balance
//           User.findOne({email: sender}).
//           then((sentBy) => {
//             const newSenderBalance = sentBy.account_balance - amount;

//             //Update senders account_balance
//             User.findOneAndUpdate(
//               {account_number: sentBy.account_number},
//               {$set: {account_balance: +newSenderBalance}},
//               {new: true},
//               () => {
//                 //Broadcast to every user using roomId
//                 socket.broadcast.to(roomID).emit('moneySent', {
//                   amount,
//                   purpose,
//                   user,
//                   receiver: user.email,
//                   sender,
//                 })
//               }
//             )
//           })
//         }
//       )
//     })
//   })
// })



const mongoose = require('mongoose');
const config = require('config');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { callbackify } = require('util');
const User = require('./models/User');
const Transaction = require('./models/Transaction');



//Init app


//Bodyparse middleware
app.use(express.json());


//Load environment variables
dotenv.config({path: "./config.env"});


//const server = http.createServer(app);

//const {Server} = require('socket.io');
//const io = new Server(server);
//const server = require('http').Server(app)
//const io = socketio(server, { cors: 'exp://192.168.1.163:19000'});
//const io = socketio(server).sockets;

//Dev loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Db config
const db = config.get('mongoURI');

//Connect to MongoDB
mongoose.connect(db, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true,
useFindAndModify: false })
.then(() => console.log('MongoDb Connected '))
.catch((err) => console.log(err));

app.get("/", (req, res) => res.send("The home page has been hit."));
app.use("/api/users", require('./routes/api/users'));
app.use("/api/auth", require("./routes/api/auth"));

app.get("users", async (req, res) => {
  let result = await send({endpoint: 'users'});
  const users = result.data;
  console.log(users);

  const user = users[0];
  let result2 = await send({endpoint: `cards/user/${user.token}`});
  const cards = result2.data;
  console.log('CARDS FOR USWE [0]', cards);

   let balance = await send({ endpoint: `/balances/${user.token}` });
   console.log(balance)


  res.json({
    // users: users,
    cards: cards,
    balance: balance
  
  });
})

//Web socket
//require('./middleware/socket3')(app, io, db);

// io.on("connection", function (socket) {
//   socket.on("joinService", ({roomID}) => {
//       console.log("user joined")
//   });
// });

const port = process.env.PORT || 5000; 
server.listen(port, () => `Server started on port ${port}`)