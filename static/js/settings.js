/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();
var embedSelector = document.getElementById('embed');
var hideCoverAttachmentsSelector = document.getElementById('hideCoverAttachments');

t.render(function(){
  return Promise.all([
    t.get('board', 'private', 'linkBehavior', "embed"),
	t.get('board', 'private', 'hideCoverAttachments', "hide")
  ])
  .spread(function(savedLinkBehavior, hideCoverAttachments){
	if(savedLinkBehavior === "embed") {
		embedSelector.checked = true;
	} else {
		embedSelector.checked = false;
	}
	
	if(hideCoverAttachments === "hide") {
		hideCoverAttachmentsSelector.checked = true;
	} else {
		hideCoverAttachmentsSelector.checked = false;
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
  
  var hideCoverAttachments
  if(hideCoverAttachmentsSelector.checked) {
	  hideCoverAttachments = "hide";
  } else {
	  hideCoverAttachments = "show";
  }
  return Promise.all([
    t.set('board', 'private', 'linkBehavior', linkBehavior),
	t.set('board', 'private', 'hideCoverAttachments', hideCoverAttachments)
  ])
  .then(function(){
    t.closePopup();
  })
})
