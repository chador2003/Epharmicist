const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
const app = require('./app')

const DB = process.env.DATABASE.replace(
    '<password>',
    process.env.DATABASE_PASSWORD,
)

const local_DB = process.env.DATABASE_LOCAL

mongoose.connect(DB).then((con) => {
    console.log('DB connection succesful')
}).catch(error => console.log(error));

const port = 5005
app.listen(port, () => {
    console.log(`App running on port ${port}..`)
})