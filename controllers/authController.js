const User = require('./../models/userModels')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const dotenv = require('dotenv')
const { promisify, isNullOrUndefined } = require('util')
dotenv.config({ path: './../config.env' })


const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user)
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        ), httpOnly: true,
    }

    res.cookie("jwt", token, cookieOptions)

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    })
}
exports.signup = async (req, res, next) => {
    try {
        const newUser = await User.create(req.body)
        token = createSendToken(newUser, 201, res)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
}

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return next(new AppError('Please provide an email and password', 400))
        }
        const user = await User.findOne({ email }).select('+password')
        if (!user || !await user.correctPassword(password, user.password)) {
            return next(new AppError('Incorrect Email or Password', 401))
        }
        createSendToken(user, 200, res)
    } catch (err) {
        res.status(500).json({ error: err.message });

    }
}
exports.logout = (req, res) => {
    res.cookie('token', '', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
    res.status(200).json({ status: 'success' })
}

exports.protect = async (req, res, next) => {
    try {
        let token
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        }
        else if (req.cookies.jwt) {
            token = req.cookies.jwt
        }
        if (!token) {
            return next(
                new AppError('You are not logged in! Please log in to get access.', 401),)
        }
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
        const freshUser = await User.findById(decoded.id)

        if (!freshUser) {
            return next(new AppError("The User Belonging to this token no longer exist", 401))
        }
        next();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password')

        if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
            return next(new AppError('Your current password is wrong', 401))
        }

        user.password = req.body.password
        user.passwordConfirm = req.body.passwordConfirm

        await user.save()

        createSendToken(user, 200, res)
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}