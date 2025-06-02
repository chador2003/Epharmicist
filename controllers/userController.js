const User = require('./../models/userModels')
const AppError = require('../utils/appError')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const { promisify, isNullOrUndefined } = require('util')
dotenv.config({ path: './../config.env' })


exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find()
        res.status(200).json({ data: users, status: 'success' })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

exports.createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.json({ data: user, status: "success" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({ data: user, status: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body);
        res.json({ data: user, status: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        res.json({ data: user, status: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}


exports.updateMe = async (req, res, next) => {
    try {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) {
            return next(
                new AppError(
                    'This route is not for password updates. Please use /updateMyPassword', 400,
                ),
            )
        }
        // 2) Filtered our unwanted fields names that are not allowed to be updated
        const filteredBody = filterObj(req.body, 'name', 'email')
        if (req.body.photo !== 'undefined') {
            filteredBody.photo = req.file.filename
        }

        var obj = JSON.parse(req.cookies.token)
        const updatedUser = await User.findByIdAndUpdate(obj['_id'], filteredBody, {
            new: true,
            runValidators: true,
        })

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser },
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'views/img/users')
    },
    filename: async (req, file, cb) => {
        var obj = JSON.parse(req.cookies.token)
        const ext = file.mimetype.split('/')[1]
        cb(null, `user-${obj['_id']}-${Date.now()}.${ext}`)
    },
})

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError("Not An Image! Please Upload Only Images", 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})

exports.uploadUserPhoto = upload.single('photo')