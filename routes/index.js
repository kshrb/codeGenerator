var express = require('express');
var router = express.Router({"caseSensitive":true,"strict":true});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Code Generator' });
});

module.exports = router;
