# postfix

a simple node package to parse and change postfile config files

``` js
var postfix = require('postfix'),
  default = postfix();

default.load(function (err, data) {
  default.append('foo@domain.com', 'bar@gmail.com', function (err) {
    default.load(function (err, data) {
      //
      // actually not necessary, its just the index
      // this is just to show how you get the data (and when)
      //
      var toDelete = data[1].i;
      canonical.delete(toDelete, function (err, data) {
        console.log('wat happened');
      });
    });
  });
});
```