/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var noembedSelector = document.getElementById('noembed');
var embedSelector = document.getElementById('embed');

t.render(function(){
  return Promise.all([
    t.get('board', 'private', 'linkBehavior')
  ])
  .spread(function(savedLinkBehavior){
    if(savedLinkBehavior && /[a-z]+/.test(savedLinkBehavior)) {
		if(savedLinkBehavior === "embed") {
			embedSelector.checked = true;
		} else {
			noembedSelector.checked = true;
		}
	}
  })
  .then(function(){
    t.sizeTo('#content')
    .done();
  })
});

document.getElementById('save').addEventListener('click', function(){
  var linkBehavior = "";
  if(embedSelector.checked) {
	  linkBehavior = "embed";
  }
  else {
	  linkBehavior = "noembed";
  }
  return t.set('board', 'private', 'linkBehavior', linkBehavior)
  .then(function(){
    t.closePopup();
  })
})
