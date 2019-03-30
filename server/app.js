const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, User'
  );
  res.header('Access-Control-Allow-Methods', 'GET');
  next()
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, '../dist/camnets/assets', 'favicon.png')));

app.use(express.static(path.join(__dirname, '../dist/camnets')));

app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/camnets/index.html'));
});

//  catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not found');
  err.status = 404;
  next(err)
});

//  error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;
  res.status(err.status || 500);
  res.render('error')
});

module.exports = app;
