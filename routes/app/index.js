/**
 * Created by budde on 27/04/16.
 */

var express = require('express')
var router = express.Router()

router.get('/', (req, res, next) => {
  res.render('app-timetable', {layout: 'app-layout', styles: ['/stylesheets/app.css']})
})

module.exports = router
