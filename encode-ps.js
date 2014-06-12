var kue = require('kue');
var spawn = require('child_process').spawn;
var path = require('path');

var settings = require('./settings')

// create our job queue

var jobs = kue.createQueue({
	prefix : 'encode-server'
});

jobs.process('video conversion', require('os').cpus().length, function(job, done) {

	var options = [];

	options.push(path.join(settings.FILE_PATH, job.data.source));
	options.push('-o');
	options.push(path.join(settings.ENCODE_PATH, path.basename(job.data.source, path.extname(job.data.source)) + '.' + job.data.type));
	options.push('--frontend');
	options.push('--videoquality');
	options.push(job.data.videoQuality);
	options.push('--audioquality');
	options.push(job.data.audioQuality);

	var encode = spawn('ffmpeg2theora', options);

	encode.stdout.setEncoding('utf8');
	encode.stdout.on('data', function(data) {
		try {
			var json = JSON.parse(data);
		} catch(s) {
			return;
		}
		job.progress(json.position, json.position + json.remaining);
	});
	encode.on('exit', function(code) {
		done();
	});
});
