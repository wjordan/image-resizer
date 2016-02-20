'use strict';

var Img = require('../../../image');
var request = require('request');
var _       = require('lodash');

function fetch(_this, url){
  var image = _this.image;

  var opts = {
    url: url,
    encoding: null
  };

  request(opts, function (err, response, body) {
    image.log.timeEnd(_this.key);

    if (err) {
      image.error = err;
    }
    else {
      if (response.statusCode === 200) {
        var contentType = _.last(response.headers['content-type'].split('/'));
        if (!_.includes(Img.validFormats, contentType)) {
          image.error = new Error('Invalid content type: ' + contentType);
        } else {
          // Set output format to input content-type if no explicit format is provided
          if(!image.format) {
            image.format = contentType;
          }

          image.contents = body;
          image.originalContentLength = body.length;
          _this.ended = true;
        }
      }
      else {
        image.error = new Error(_this.key + ' image not found');
        image.error.statusCode = 404;
      }
    }

    _this.push(image);
    _this.push(null);
  });

}

module.exports = fetch;