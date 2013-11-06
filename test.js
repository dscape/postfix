var test = require('tape');
var path = require('path');
var fs = require('fs');
var postfix = require('./postfix');

//
// some files for our tests
//
var canonical = postfix(path.join(__dirname, 'sample', 'virtual_canonical_whitespace'));
var random = postfix(path.join(__dirname, (~~(Math.random() * 1e9)).toString(36) + '.test.log'));
var badpath = postfix('/bad/path');

test('should create file if it doesnt exist', function (t) {
  random.append('trie', 'to', function (err) {
    t.equal(err, null);
    t.end();
  });
});

test('should not be able to work on a bad path', function (t) {
  badpath.append('another', 'thing', function (err) {
    t.ok(err);
    t.equal(err.code, 'ENOENT');
    t.end();
  });
});

test('should be able to read file', function (t) {
  random.load(function (err, data) {
    t.equal(err, null);
    var previous = data[0];
    t.equal(previous.i, 0);
    t.equal(previous.from, 'trie');
    t.equal(previous.to, 'to');
    t.end();
  });
});

test('should be able to read, write canonical file and be the same as read file', function (t) {
  canonical.load(function (err, data) {
    t.equal(err, null);
    var expected = JSON.stringify([{
      'i': 0,
      'comment': '# /etc/postfix/virtual'
    }, {
      'i': 1,
      'comment': '# You have to run postmap virtual after changing this file'
    }, {
      'i': 2,
      'comment': '# It\'ll write out /etc/postfix/virtual.db'
    }, {
      'i': 3,
      'comment': ' '
    }, {
      'i': 4,
      'from': 'test@anotherdomain.com',
      'to': 'someone@gmail.com',
      'comment': '# Forward one address to one address'
    }, {
      'i': 5,
      'from': '@domain.com',
      'to': 'another@me.com',
      'comment': '# Forward whole domain to one address'
    }, {
      'i': 6,
      'from': 'why',
      'to': 'not'
    }]);
    canonical.append('why', 'not', function (err) {
      canonical.load(function (err, data) {
        t.equal(err, null);
        var actual = JSON.stringify(data);
        t.equal(actual, expected);
        canonical.delete(6, function (err, data) {
          t.equal(err, null);
          t.end();
        });
      });
    });
  });
});

test('canonical file should remain unchanged after tests run', function (t) {
  var ted = fs.readFileSync(path.join(__dirname, 'sample', 'tedkulp-7312570'), {
    encoding: 'utf8'
  });
  var processed = fs.readFileSync(path.join(__dirname, 'sample', 'virtual_canonical_whitespace'), {
    encoding: 'utf8'
  });
  t.equal(processed, ted);
  t.end();
});

test('should be able to remove an entry in between other elements', function (t) {
  random.append('foo', 'bar', function (err) {
    t.equal(err, null);
    random.append('baz', 'duh', function (err) {
      t.equal(err, null);
      random.append('goo', 'mar', function (err) {
        t.equal(err, null);
        random.delete(1, function (err, data) {
          t.equal(err, null);
          for (var i = 0; i < data.length; i++) {
            t.equal(data[i].i, i);
          }
          t.end();
        });
      });
    });
  });
});

test('should update valid element', function (t) {
  random.append('foo', 'bar', function (err, data) {
    t.equal(err, null);
    var baz = data[1],
      trie = data[0];
    random.update(baz.i, 'dag', 'man', function (err, data) {
      t.equal(err, null);
      t.equal(baz, data[1]);
      t.equal(trie, data[0]);
      t.end();
    });
  });
});

test('should fail when modifying element that is out of bound', function (t) {
  random.delete(1337, function (err, data) {
    t.ok(err.message.match(/bounds/));
    t.end();
  });
});
