const express = require('express');
const router = express.Router();
const bcryptjs = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');

//User Model
const User = require('../../models/User');

//Utils
const {getRandom} = require("../../helpers/utils");

// Post request for registeration
router.post("/", (req, res) => {
    const { name, email, phone, password, userRef} = req.body;

    //Little Validate
    if(!name || !email || !phone || !password) {
        return res.status(400)
        .json({msg: "Please enter name, email, password and phone"});
    }

    //Check if the user exists
    User.findOne({email}).then(user =>  {
        if(user) return res.status(400).json({msg: "User already exists"});

        const newUser = new User({
            name,
            email,
            phone,
            account_number: getRandom(11),
            account_balance: getRandom(5),
            password,
            userRef
        });

        // Create salt using bcrypt
        bcryptjs.genSalt(10, (err, salt) => {
            bcryptjs.hash(newUser.password, salt, (err, hash) => {
                if(err) throw err;
                newUser.password = hash;

                newUser.save().then(user => {
                    jwt.sign(
                        {id: user.id},
                        config.get('bartersecret'),
                        {expiresIn: 3600},
                        (err, token) => {
                            if(err) throw err;
                            return res.status(200).json({
                                token,
                                user: {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                    phone: user.phone,
                                    account_number: user.account_number,
                                    account_balance: user.account_balance,
                                    
                                }
                            })
                        }
                    )
                })
            })
        })
    });
});

module.exports = router;