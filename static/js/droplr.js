var formatDropUrl = function(t, url){
  //http://d.pr/i/8yyV
  if(!/^http?:\/\/d\.pr\/i\/\w{3,7}/.test(url)){
    return null;
  }
  var dropCode = /^http?:\/\/d\.pr\/i\/(\w{3,7})/.exec(url)[1];
  return dropCode;
};