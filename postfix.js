(function (postfix) {
  var fs = require('fs');
  var nanId = -1;

  //
  // Postfix
  //

  var Postfix = function (path) {
    path = path || '/etc/postfix/virtual';

    var postfixData = [];

    //
    // Unserializes a postfix virtual file
    //

    function unserialize(txt) {
      var line_nr = -1;

      return txt.split('\n')
        .map(function (line) {
          line_nr++;

          //
          // Preserve comments and whitespace lines
          //
          if ((/^#/).test(line) || /^\s+$/.test(line) || line === '') {
            return {
              i: line_nr,
              comment: line
            };
          }

          //
          // Not a comment, split by space to get relevant bits
          //
          var tuple = line.split(/\s+/);

          //
          // Return our tuple
          //
          var parsedLine = {
            i: line_nr,
            from: tuple.shift(),
            to: tuple.shift()
          };

          //
          // Remove empty spaces and whatnot
          //
          tuple = tuple.filter(function (e) {
            return e;
          });

          if (tuple.length !== 0) {
            parsedLine.comment = tuple.join(' ');
          }

          return parsedLine;

        });
    }

    //
    // Serializes to file format
    //

    function serialize() {
      return postfixData.map(function (tuple) {
        if (tuple.from || tuple.to) {
          return [tuple.from, tuple.to, tuple.comment].join(' ');
        } else {
          return tuple.comment;
        }
      }).join('\n');
    }

    //
    // Modify
    //

    function modify(i, from, to, comment) {
      //
      // i `nanId` means new record
      //
      if (i === nanId) {
        i = postfixData.length;
        postfixData.push({
          i: i
        });
      }

      //
      // Don't allow updates to things that are not in the data
      // store
      //
      if (postfixData.length < i) {
        //
        // Failed: out of bounds
        //
        return false;
      }

      if (arguments.length === 1) {
        //
        // Delete the element
        //
        postfixData.splice(i, 1);

        //
        // reindex
        //
        for (var j = 0; j < postfixData.length; j++) {
          postfixData[j].i = j;
        }
      } else {
        //
        // Perform modifications
        //
        postfixData[i].from = from;
        postfixData[i].to = to;
      }

      return true;
    }

    //
    // Read And Unserialize
    //

    function readAndUnserialize(callback) {
      fs.readFile(path, {
        encoding: 'utf8'
      }, function (err, txt) {
        if (err) {
          return callback(err);
        }

        postfixData = unserialize(txt);

        callback(null, postfixData);
      });
    }

    //
    // Serialize And Write
    //

    function serializeAndWrite(callback) {
      fs.writeFile(path, serialize(), function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, postfixData);
      });
    }

    //
    // Modify And Write
    //

    function modifyAndWrite(from, to, i, callback) {
      //
      // When i is not provided we are appending
      // a new record
      //
      if (typeof i === 'function') {
        callback = i;
        i = nanId; // `nanId` means new
      }

      var modifyOk = modify(i, from, to);

      if (!modifyOk) {
        return callback(new Error('Modification failed because ' + i + ' is out of bounds'));
      }

      serializeAndWrite(callback);
    }

    //
    // Delete And Write
    //

    function deleteAndWrite(i, callback) {
      var deleteOk = modify(i);

      if (!deleteOk) {
        return callback(new Error('Delete failed because ' + i + ' is out of bounds'));
      }

      serializeAndWrite(callback);
    }

    return {
      'load': readAndUnserialize,
      'append': function postfixAppend(from, to, callback) {
        return modifyAndWrite(from, to, callback);
      },
      'update': function postfixUpdate(i, from, to, callback) {
        return modifyAndWrite(from, to, i, callback);
      },
      'delete': function postfixDelete(i, callback) {
        return deleteAndWrite(i, callback);
      }
    };

  };

  //
  // exports
  //
  module.exports = function (path) {
    return new Postfix(path);
  };
})(typeof exports === 'undefined' ? postfix = {} : exports);
