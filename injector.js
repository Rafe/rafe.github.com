var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function annotate(fn) {
  var $inject = [];

  var fnText = fn.toString().replace(STRIP_COMMENTS);

  var argDecl = fnText.match(FN_ARGS);

  argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg){
    arg.replace(FN_ARG, function(all, underscore, name) {
      $inject.push(name);
    });
  });

  fn.$inject = $inject;

  return $inject;
}

var fn = function($http, $form, element) {
  console.log(123);
}

annotate(fn);

console.log(fn.$inject);
