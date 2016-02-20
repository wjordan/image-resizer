'use strict';

var client, bucket, gcloud;

var env = require('../../config/environment_vars');
var stream = require('stream');
var util = require('util');

try {
  // init gcloud API instance
  gcloud = require('gcloud')({
    projectId: env.GCS_PROJECT_ID,
    credentials: {
      client_email: env.GCS_CLIENT_EMAIL,
      private_key: env.GCS_PRIVATE_KEY,
    },
  });

  // create GCS client
  client = gcloud.storage();
  bucket = client.bucket(env.GCS_BUCKET);
} catch(e) {

}

function gcsStream(image) {
  /* jshint validthis:true */
  if (!(this instanceof gcsStream)){
    return new gcsStream(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
}

util.inherits(gcsStream, stream.Readable);

gcsStream.prototype._read = function(){
  var _this = this;

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()) {
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  var file = bucket.file(this.image.path.replace(/^\//,''));
  var options = this.image.options || {};

  this.image.log.time('gcs');

  file.download(options, function (err, data) {
    _this.image.log.timeEnd('gcs');

    // if there is an error store it on the image object and pass it along
    if (err) {
      _this.image.error = err;
    }

    // if not store the image buffer
    else {
      _this.image.contents = data.Body;
      _this.image.originalContentLength = data.Body.length;
    }

    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  });
};


module.exports = gcsStream;
