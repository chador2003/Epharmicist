const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require("bcryptjs")
const e = require('express')
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'sme', 'pharmacist', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm:{
    type: String,
    required: [true, 'Please confirm your password'],
    validate: function(el){
      return el===this.password
    },
    meessage: 'Passwords are not the same',
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  }
})
userSchema.pre('save',async function (next){
  if(!this.isModified('password'))return next()
  this.password = await bcrypt.hash(this.password,12)

  this.passwordConfirm = undefined
  next()
})
userSchema.pre('findOneAndUpdate',async function (next){
  const update = this.getUpdate();
  if(update.password!=='' && update.password!==undefined && update.password == update.passwordConfirm){
    this.getUpdate().password = await bcrypt.hash(update.password,12)

    update.passwordConfirm = undefined
    next()
  }
  else
  next()
})
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
){
  return await bcrypt.compare(candidatePassword,userPassword)
}
const User = mongoose.model('User', userSchema)

module.exports = User