const functions = require('firebase-functions');
const admin = require('firebase-admin')

const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = 3001
const app = express();

app.use(cors({ origin: true }))
app.use(bodyParser.urlencoded({ extended: true }))

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://test-api-f282b.firebaseio.com"
});
const db = admin.database();
app.get('/hello', (req, res, next) => {
    console.log('GET /hello sucess')
    res.send('{"test": "this is test"}')
})

app.get('/items', (req, res, next) => {
    console.info('GET /items success')
    if (db.ref('items') === null) return res.status(500).json({message : 'There is no data'})
    const refItems = db.ref('items').limitToLast(10)
    refItems.once('value', (snapshot) => {
        const ret_value = []
        const values = snapshot.val()
        for (let [key, value] of Object.entries(values)) {
            ret_value.push({
                id: key,
                ...value
            })
        }
        return res.status(200).json(ret_value.reverse())
    }, errObj => res.status(500).json({ message: errObj.code }))
})

app.post('/add', (req, res, next) => {
    console.info('POST /add success')
    if (!req.body.name || !req.body.price) return res.status(400).json({ message: 'Missing add item' })

    const refItems = db.ref('items')
    refItems.push({
        name: req.body.name,
        price: req.body.price
    }).then(
        () => res.status(200).json({ message: "Add Successfully" })
    )
        .catch(err => {
            return res.status(500).json({ message: err })
        })
})

app.use((req, res, next) => {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
})

app.use((err, req, res, next) => res.status(err.status || 500).send(err.message || 'There was a problem'))

app.listen(PORT, () => {
    console.log(`server is runnung at port: ${PORT}`)
})


exports.app = functions.https.onRequest(app)
