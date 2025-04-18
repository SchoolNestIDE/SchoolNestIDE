let express = require('express');
express().use(express.static('.')).listen(require('process').argv[2])