// ==UserScript==
// @name          Heise Trollex Version 0.50
// @namespace     http://www.informatik.uni-freiburg.de/schnllm~
// @description   Skript zum Entfernen von (rot markierten) Trollbeitraegen in den Heiseforen
// @include       http://www.heise.de/*foren/*
// ==/UserScript==

// Originally programed from Hannes Planatscher © 2005, 2006 (http://www.planatscher.net/)
// Modified from Michael Schnell © 2007, 2008 (http://www.informatik.uni-freiburg.de/~schnellm/)

// This Script is unter the Creative Commons Attribution 2.0 Licenes (http://creativecommons.org/licenses/by/2.0/)

function increasethreshold(event)  {
	currentThreshold = GM_getValue("threshold", -50);
	GM_setValue("threshold", currentThreshold + 10);
	window.location.reload();
}

function decreasethreshold(event)  {
	currentThreshold = GM_getValue("threshold", -50);
	GM_setValue("threshold", currentThreshold - 10);
	window.location.reload();
}

function addtoignorelist(user) {
	iliststr = GM_getValue("ignorelist", "");
        iliststr = iliststr + "," + user;
        GM_setValue("ignorelist",iliststr);
        window.location.reload();
}

function removefromignorelist(user) {
	iliststr = GM_getValue("ignorelist", "");
        ilist = iliststr.split(",")
        iliststrnew = "";
        for (i =  0; i < ilist.length; i++) {
        	if  ((ilist[i] != user) && (ilist[i] != "") && (ilist[i] != " ")) {
        		iliststrnew = iliststrnew + ilist[i] + ((i != ilist.length-1)? ",":"");
        	}
        }
        GM_log(iliststrnew);
        GM_setValue("ignorelist",iliststrnew);
        window.location.reload();
}

function inarray(arr, value) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i]==value) return true;
	}
	return false;
}

function factoryadd(v) {
	return function(event) {
		addtoignorelist(v);
		event.stopPropagation();
    	event.preventDefault();
	};
}

function factoryremove(v) {
	return function(event) {
		removefromignorelist(v);
		event.stopPropagation();
    	event.preventDefault();
	};
}

function updateVisibility(){
	totalVisibility = GM_getValue("TrollExTotalVisibility", false);
	ignoredVisibility = GM_getValue("TrollExIgnoredVisibility", false);
	document.getElementById('hideableContent').style.visibility = totalVisibility?   'visible':'hidden';
	document.getElementById('ignoredContent').style.visibility =  (totalVisibility && ignoredVisibility)? 'visible':'hidden';
	
	document.getElementById('totalVisibilityButton').firstChild.data= totalVisibility? "[Ausblenden]" : "[Anzeigen]";
	document.getElementById('ignoredVisibilityButton').firstChild.data= ignoredVisibility? "[Ausblenden]" : "[Anzeigen]";
}

function switchTotalVisibilty() {
	visible = GM_getValue("TrollExTotalVisibility", false);
	visible = !visible;
	GM_setValue("TrollExTotalVisibility", visible);
	updateVisibility();
}

function switchIgnoredVisibilty() {
	visible = GM_getValue("TrollExIgnoredVisibility", false);
	visible = !visible;
	GM_setValue("TrollExIgnoredVisibility", visible);
	updateVisibility();
}


var allImages, thisImage;
var threshold = GM_getValue("threshold", -50);
var ignoreliststr = GM_getValue("ignorelist", "");
var ignorelist = ignoreliststr.split(",");

var blocked = 0;
var ignored = 0;

ignoreList = document.createElement('ol');
ignoreList.setAttribute('id','ignoreList');

ignoreList.appendChild(document.createTextNode(""));

for (i = 0; i < ignorelist.length; i++) {
	if (ignorelist[i] != "") {
		
		line = document.createElement('li');
		line.innerHTML = ignorelist[i];
		button1 = document.createElement('span');		
		button1.addEventListener('click', factoryremove(ignorelist[i]), true);
		button1.innerHTML = "[entfernen]";
		button1.setAttribute("style", "text-decoration:none; font-weight:normal; color: blue; cursor: hand; cursor: pointer;");
		button1.setAttribute("title",ignorelist[i] +" von der Ignoreliste entfernen");
		line.appendChild(button1);
		ignoreList.appendChild(line);
	}
}


allImages = document.evaluate("//div[@class='thread_votechart']//img[contains(@title,'Beitragsbewertung: ')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);


var badThreads = document.createElement('div');
var badThreadsList = document.createElement('ul');
badThreadsList.setAttribute('class', 'thread_tree');

var ignoredUsersThreads = document.createElement('div');
var ignoredUsersThreadsList = document.createElement('ul');
ignoredUsersThreadsList.setAttribute('class', 'thread_tree');


var allArticles = document.evaluate(
    "//li[div/@class='hover' or div/@class='hover_line']",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null);

for (var i = 0; i < allArticles.snapshotLength; i++) {
  var row = allArticles.snapshotItem(i);
  
  var nameRes = document.evaluate( "./div/div[@class='thread_user']" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  var nameNode = nameRes.snapshotItem(0);
  var username = nameNode.innerHTML;
  
  parentMovedSearch = document.evaluate( "ancestor::li[@trollex_moved_thread]" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  parentMoved = (parentMovedSearch.snapshotLength > 0);

  if (inarray(ignorelist,  username)) { 
    if(!parentMoved){
      // remove this subthread
      row.setAttribute("trollex_moved_thread", "true");
      ignoredUsersThreadsList.appendChild(row);
      blocked++;
      ignored++;
    }
	// add an "don't ignore" Button	
    button = document.createElement('span');
    button.href = null;
    button.addEventListener('click', factoryremove(username), true);
    button.innerHTML = " [n]";
    button.setAttribute("style", "text-decoration:none;  font-weight:normal; color: blue; cursor: hand; cursor: pointer; ");
    button.setAttribute("title", username+ " nicht mehr ignorieren");
    nameNode.insertBefore(button, nameNode.firstChild);
  }else{
  	// do not remove the subthread but add a ignore button
    button = document.createElement('span');
    button.href = null;
    button.addEventListener('click', factoryadd(username), true);
    button.innerHTML = " [i]";
    button.setAttribute("style", "text-decoration:none;  font-weight:normal; color: blue; cursor: hand; cursor: pointer; ");
    button.setAttribute("title", username+ " auf die Ignoreliste setzen");
    nameNode.insertBefore(button, nameNode.firstChild);
  }
}

ignoredUsersThreads.appendChild(ignoredUsersThreadsList);
ignoredUsersThreads.setAttribute('id','ignoredUsersThreads');


for (var i = 0; i < allImages.snapshotLength; i++) {
    var tablerow, bewvalue;
    thisImage = allImages.snapshotItem(i);
    bewvalue = parseInt(thisImage.title.substr(19,4));
    
    parentMovedSearch = document.evaluate( "ancestor::li[@trollex_moved_thread]" ,thisImage , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    parentMoved = (parentMovedSearch.snapshotLength > 0);
    
    if (!parentMoved && bewvalue <= threshold) {
    	tablerow = thisImage.parentNode.parentNode.parentNode.parentNode;
    	tablerow.setAttribute("trollex_moved_thread", "true");
    	badThreadsList.appendChild(tablerow);
    	blocked++;
    }
}


badThreads.appendChild(badThreadsList);
badThreads.setAttribute('id','badThreads');

// create the "xy threads blocked" title element

var blockedTitle = document.createElement('span');
blockedTitle.setAttribute("style", "text-decoration:none; font-weight:bold;");

var blockedThreads;
if(blocked==0){
  blockedThreads = "Heise TrollEx hat keine Threads ausgefiltert.";
}else if(blocked==1){
  blockedThreads = "Heise TrollEx hat insgesamt einen Thread ausgefiltert:";
}else{
  blockedThreads = "Heise TrollEx hat insgesamt " +blocked + " Threads ausgefiltert:";
}
blockedTitle.appendChild(document.createTextNode(blockedThreads));
tmp=document.createElement("span");
tmp.appendChild(document.createTextNode("----"));
tmp.style.visibility ="hidden";
blockedTitle.appendChild(tmp);

totalVisibilityButton = document.createElement("span");
totalVisibilityButton.setAttribute("id", "totalVisibilityButton")
totalVisibilityButton.setAttribute("style", "text-decoration:none; font-weight:normal; color: blue; cursor: hand; cursor: pointer;");
totalVisibilityButton.addEventListener('click', switchTotalVisibilty, true);
totalVisibilityButton.appendChild(document.createTextNode("[Ein-/Ausblenden]"));

blockedTitle.appendChild(totalVisibilityButton);
blockedTitle.appendChild(document.createElement('br'));

// create the "xy threads blocked" title element

var ignoredTitle = document.createElement('span');
ignoredTitle.setAttribute("style", "text-decoration:none; font-weight:bold;");

var ignoredThreads;
if(ignored==0){
  ignoredThreads = "Heise TrollEx hat keine Threads von ignorierten Trollen ausgefiltert.";
}else if(blocked==1){
  ignoredThreads = "Heise TrollEx hat einen Thread von ignorierten Trollen ausgefiltert:";
}else{
  ignoredThreads = "Heise TrollEx hat " +ignored + " Threads von ignorierten Trollen ausgefiltert:";
}
ignoredTitle.appendChild(document.createTextNode(ignoredThreads));
tmp=document.createElement("span");
tmp.appendChild(document.createTextNode("----"));
tmp.style.visibility ="hidden";
ignoredTitle.appendChild(tmp);

ignoredVisibilityButton = document.createElement("span");
ignoredVisibilityButton.setAttribute("id", "ignoredVisibilityButton")
ignoredVisibilityButton.setAttribute("style", "text-decoration:none; font-weight:normal; color: blue; cursor: hand; cursor: pointer;");
ignoredVisibilityButton.addEventListener('click', switchIgnoredVisibilty, true);
ignoredVisibilityButton.appendChild(document.createTextNode("[Ein-/Ausblenden]"));

ignoredTitle.appendChild(ignoredVisibilityButton);
ignoredTitle.appendChild(document.createElement('br'));


// create the threshold GUI elements
thresholdGUI = document.createElement('div');

button1 = document.createElement('span');
button1.addEventListener('click', increasethreshold, true);
button1.innerHTML = "[+]";
button1.setAttribute("style", "font-family: courier;font-size: 16px;text-decoration:none; font-weight:bolder; color: blue; cursor: hand; cursor: pointer; ");

thresholdview = document.createTextNode(" " + threshold + " % ");

button2 = document.createElement('span');
button2.addEventListener('click', decreasethreshold, true);
button2.innerHTML = "[-]";

button2.setAttribute("style", "font-family: courier; font-size: 16px;text-decoration:none; font-weight:bolder; color: blue; cursor: hand; cursor: pointer; ");

thresholdGUI.appendChild(document.createTextNode(" Schwellwert: "));
tmp=document.createElement("span");
tmp.appendChild(document.createTextNode("----"));
tmp.style.visibility ="hidden";
thresholdGUI.appendChild(tmp);
thresholdGUI.appendChild(button2);
thresholdGUI.appendChild(thresholdview);
thresholdGUI.appendChild(button1);

// create the ignore list title

ignoreListTitle =  document.createElement('span');

var trollText;
if(ignorelist.length == 1){
  trollText = "Keine Trolle in der Ignorelist.";
}else if(ignorelist.length == 2){
  trollText = "Ein Troll in der Ignorelist:";
}else {
  trollText = (ignorelist.length-1) + " Trolle in der Ignorelist:";
}
ignoreListTitle.innerHTML = trollText;

trollExContainer = document.createElement("div");
trollExContainer.appendChild(blockedTitle);

hideableContent = document.createElement("div");
hideableContent.setAttribute("id", "hideableContent");
hideableContent.appendChild(badThreads);
hideableContent.appendChild(document.createElement("br"));
hideableContent.appendChild(thresholdGUI);
hideableContent.appendChild(document.createElement("br"));
hideableContent.appendChild(ignoredTitle);

ignoredContent = document.createElement("div");
ignoredContent.setAttribute("id", "ignoredContent");
ignoredContent.appendChild(ignoredUsersThreads);
ignoredContent.appendChild(document.createElement("br"));
ignoredContent.appendChild(ignoreListTitle);
ignoredContent.appendChild(ignoreList);

hideableContent.appendChild(ignoredContent);
trollExContainer.appendChild(hideableContent);

var untereZeil  = document.evaluate( "//ul[@class='forum_aktion']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
var untereZeile = untereZeil.snapshotItem(0);
untereZeile.parentNode.insertBefore(trollExContainer, untereZeile.nextSilbing);

updateVisibility();

