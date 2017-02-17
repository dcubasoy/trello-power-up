/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

// you can access arguments passed to your iframe like so
var arg = t.arg('arg');

t.render(function(){
  // make sure your rendering logic lives here, since we will
  // recall this method as the user adds and removes attachments
  // from your section
  t.card('attachments')
  .get('attachments')
  .filter(function(attachment){
    console.log(attachment.url);
	return attachment.url.indexOf('http://d.pr') == 0;
  })
  .then(function(droplrAttachments){
    console.log("Our URL matches the filter");
	console.log(JSON.stringify(droplrAttachments, null, 4));
	var urls = droplrAttachments.map(function(a){ return a.url; });
	var dropCount = urls.length;
	var dropDiv;
	var imageElement;
	var titleElement;
	var linkElement;
	var copyLinkElement;
	var copyLinkButtonElement;
	var dropCode;
	var allDropsDiv = document.getElementById('droplrdrops');
	allDropsDiv.innerHTML = '';
	for(i = 0; i < dropCount; i++ ) 
	{
		dropCode = formatDropUrl(1, urls[i]);
		dropDiv = document.getElementById("detail-row-template").cloneNode(true);
		dropDiv.setAttribute("id", "drop" + dropCode);
		imageElement = dropDiv.getElementsByClassName("drop-thumbnail")[0];
		imageElement.setAttribute("src", 'https://d.pr/' + dropCode + '/thumbnail');
		titleElement = dropDiv.getElementsByClassName("drop-title")[0];
		//titleElement.innerHTML = urls[i];
		titleElement.innerHTML = "Drop title placeholder";
		linkElement = dropDiv.getElementsByClassName("drop-link")[0];
		linkElement.setAttribute("href", urls[i]);
		copyLinkElement = dropDiv.getElementsByClassName("copy-drop-link")[0];
		copyLinkElement.setAttribute("value", urls[i]);
		copyLinkElement.setAttribute("id", "textbox-" + dropCode);
		copyLinkButtonElement = dropDiv.getElementsByClassName("copy-drop-link-button")[0];
		copyLinkButtonElement.setAttribute("data-clipboard-target", "#" + "textbox-" + dropCode);
		
		allDropsDiv.appendChild(dropDiv);
		dropDiv.setAttribute("style", "");
	}
	//document.getElementById('droplrdrops').textContent = fullHtml;
    //document.getElementById('drops').textContent = urls.join(', ');
  })
  .then(function(){
    return t.sizeTo('#content');
  });
});
