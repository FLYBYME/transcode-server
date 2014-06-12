/**
 *
 *
 */
var express = require('express');
var fs = require("fs");
var path = require('path');
var util = require('util');
var kue = require('kue');
var formidable = require('formidable')

var settings = require('./settings')
//

var jobs = kue.createQueue({
	prefix : 'encode-server'
});
//

kue.app.use(express.bodyParser());
kue.app.use('/encode', express.static(settings.ENCODE_PATH));
kue.app.use('/encode', express.directory(settings.ENCODE_PATH));
kue.app.use('/upload', express.static(settings.FILE_PATH));
kue.app.use('/upload', express.directory(settings.FILE_PATH));

/**
 *
 *
 *
 */
kue.app.get('/encode-server', function(req, res) {
	res.status(200).sendfile(__dirname + '/public/uploader.html');
});
kue.app.post('/encode-server/file-upload', function(req, res) {
	var form = new formidable.IncomingForm(), files = [], fields = [];

	form.uploadDir = settings.FILE_PATH;

	form.on('file', function(field, file) {
		var tmp_path = file.path;
		var target_path = settings.FILE_PATH + '/' + file.name;
		fs.rename(tmp_path, target_path, function(err) {
			if (err)
				return res.send(err);
			res.send('File uploaded to: ' + target_path + ' - ' + file.size + ' bytes');
		});
	});
	form.parse(req);

});

kue.app.post('/encode-server/add', function(req, res) {
	function add(type) {
		jobs.create('video conversion', {
			title : 'converting ' + req.body.filepath + ' to ' + type,
			source : req.body.filepath,
			videoQuality : 5,
			audioQuality : 2,
			type : type
		}).save();
	}


	fs.exists(path.join(settings.FILE_PATH, req.body.filepath), function(exists) {
		if (exists) {
			if (Array.isArray(req.body.encodetype)) {
				req.body.encodetype.forEach(add);
			} else {
				add(req.body.encodetype);
			}
			res.redirect('/active');
		} else {
			res.json({
				error : 'file does not exists'
			});
		}
	});
});

kue.app.listen(30001);
