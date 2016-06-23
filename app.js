require('babel-register')
var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var flash = require('connect-flash')
const {logError} = require('./utils/error')
var routes = require('./routes')
var setups = require('./lib')

var app = express()
var hbs = require('hbs')
hbs.registerPartials(path.join(__dirname, 'views', 'partials'))
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

// Session
app.use(setups.sessionSetup)

// Passport
setups.passportSetup(app)
setups.morganSetup(app)

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}))
app.use(flash())
app.use(express.static(path.join(__dirname, 'public')))

// Swagger
setups.swaggerSetup(app).then(() => {
  app.use('/', routes)

  app.get('/err', (req, res, next) => {
    next(new Error('This is a test error'))
  })

  app.use(function (req, res, next) {
    res.status(404)
    res.render('error-404',
      {
        title: ['Page not found'],
        styles: ['/stylesheets/error.css']
      })
  })

  if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
      logError(err)
      res.status(err.status || 500)
      res.render('error-500', {
        message: err.message,
        error: err,
        styles: ['/stylesheets/error.css']
      })
    })
  }

  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('error-500', {
      message: err.message,
      styles: ['/stylesheets/error.css']
    })
  })
})

module.exports = app
