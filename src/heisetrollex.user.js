// ==UserScript==
// @name          Heise Trollex Version 0.41
// @namespace     http://www.informatik.uni-freiburg.de/schnllm~
// @description   Skript zum Entfernen von (rot markierten) Trollbeitraegen in den Heiseforen
// @include       http://www.heise.de/*foren/*
// ==/UserScript==

// Originally programed from Hannes Planatscher © 2005, 2006 (http://www.planatscher.net/)
// Modified from Michael Schnell © 2007, 2008 (http://www.informatik.uni-freiburg.de/~schnellm/)

// This Script is unter the Creative Commons Attribution 2.0 Licenes (http://creativecommons.org/licenses/by/2.0/)

function increasetreshold(event)  {
	acttresh = GM_getValue("treshold", -50);
	GM_setValue("treshold", acttresh + 10);
	window.location.reload();
}

function decreasetreshold(event)  {
	acttresh = GM_getValue("treshold", -50);
	GM_setValue("treshold", acttresh - 10);
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
        ilist = ignoreliststr.split(",")
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



var trollvisbile = GM_getValue("trollvisbile",false);
var allImages, thisImage;
var treshold = GM_getValue("treshold", -50);
var ignoreliststr = GM_getValue("ignorelist", "");
var ignorelist = ignoreliststr.split(",");

var blocked = 0;

function switchvisibilty() {
	trollvisbile = GM_getValue("trollvisible", false);
	document.getElementById('trolltable').style.visibility = (!trollvisbile)? 'visible':'hidden';
	if (trollvisbile)  document.getElementById('trolllist').style.visibility = 'hidden';
	GM_setValue("trollvisible", !trollvisbile);
}

function switchvisibiltytl() {
	trollvisbile = GM_getValue("trolllistvisible", false);
	document.getElementById('trolllist').style.visibility = (!trollvisbile)? 'visible':'hidden';
	GM_setValue("trolllistvisible", !trollvisbile);
	document.getElementById('trolllist').style.visibility = true;
}


trolllist = document.createElement('ol');
trolllist.setAttribute('id','trolllist');

trolllist.appendChild(document.createTextNode(""));

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
		trolllist.appendChild(line);
	}
}


allImages = document.evaluate("//div[@class='thread_votechart']//img[contains(@title,'Beitragsbewertung: ')]", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);


var trolltablecontainer = document.createElement('div');
var tablerows = document.createElement('ul');
tablerows.setAttribute('class', 'thread_tree');

/*
   from "Heise Forum Sweeper" http://phpfi.com/69565
*/


var strIgnored = String.fromCharCode(8211, 8211, 8211);
var allInhaltTables, forum_inhalt;
allInhaltTables = document.evaluate(
    "//li[div/@class='hover' or div/@class='hover_line']",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null);

var users = new Array();

var first = true;

for (var i = 0; i < allInhaltTables.snapshotLength; i++) {
  var row = allInhaltTables.snapshotItem(i);
  
  var nameRes = document.evaluate( "./div/div[@class='thread_user']" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  var nameNode = nameRes.snapshotItem(0);
  var username = nameNode.innerHTML;
  

  if (inarray(ignorelist,  username)) { 
    // remove this subthread and add an "don't ignore" Button
    tablerows.appendChild(row);
    blocked++;

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



for (var i = 0; i < allImages.snapshotLength; i++) {
    var tablerow, bewvalue;
    thisImage = allImages.snapshotItem(i);
    bewvalue = parseInt(thisImage.title.substr(19,4));
    
    parentMovedSearch = document.evaluate( "ancestor::li[@trollex_moved_thread]" ,thisImage , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    parentMoved = (parentMovedSearch.snapshotLength > 0);
    
    if (!parentMoved && bewvalue <= treshold) {
    	tablerow = thisImage.parentNode.parentNode.parentNode.parentNode;
    	tablerow.setAttribute("trollex_moved_thread", "true");
    	tablerows.appendChild(tablerow);
    	blocked++;
    }
}


trolltablecontainer.appendChild(tablerows);
trolltablecontainer.setAttribute('id','trolltable');

var untereZeil  = document.evaluate( "//ul[@class='forum_aktion']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
var untereZeile = untereZeil.snapshotItem(0);


var newElement = document.createElement('span');
newElement.setAttribute("style", "text-decoration:none; font-weight:bold; cursor: hand; cursor: pointer; ");

var blockedThreads;
if(blocked==0){
  blockedThreads = "Heise TrollEx hat keine Beiträge ausgefiltert.";
}else if(blocked==1){
  blockedThreads = "Heise TrollEx hat einen Thread ausgefiltert:";
}else{
  blockedThreads = "Heise TrollEx hat " +blocked + " Beiträge ausgefiltert:";
}
newElement.appendChild(document.createTextNode(blockedThreads));
newElement.appendChild(document.createElement('br'));
newElement.appendChild(document.createElement('br'));
newElement.addEventListener('click', switchvisibilty, true);
heiset = document.createTextNode(" Schwellwert:  ");

container = document.createElement('div');
button1 = document.createElement('b');
button1.addEventListener('click', increasetreshold, true);
button1.innerHTML = '+';
button1.setAttribute("style", "font-family: courier;font-size: 16px;text-decoration:none; font-weight:bolder; color: blue; cursor: hand; cursor: pointer; ");

tresholdview = document.createTextNode(" [ " + treshold + " %] ");

button2 = document.createElement('b');


button2.addEventListener('click', decreasetreshold, true);

button2.innerHTML = "-";

button2.setAttribute("style", "font-family: courier; font-size: 16px;text-decoration:none; font-weight:bolder; color: blue; cursor: hand; cursor: pointer; ");

container.appendChild(heiset);
container.appendChild(button2);
container.appendChild(tresholdview);
container.appendChild(button1);


trollistbutton =  document.createElement('b');
trollistbutton.setAttribute("style", "text-decoration:none; font-weight:bold; cursor: hand; cursor: pointer; ");

var trollText;
if(ignorelist.length == 1){
  trollText = "Keine Trolle in der Ignorelist.";
}else if(ignorelist.length == 2){
  trollText = "Ein Troll in der Ignorelist:";
}else {
  trollText = (ignorelist.length-1) + " Trolle in der Ignorelist:";
}
trollistbutton.innerHTML = trollText;
trollistbutton.addEventListener('click', switchvisibiltytl, true);

trolltablecontainer.appendChild(document.createElement('br'));
trolltablecontainer.appendChild(container);
trolltablecontainer.appendChild(document.createElement('br'));
trolltablecontainer.appendChild(trollistbutton);
trolltablecontainer.appendChild(trolllist);



untereZeile.parentNode.insertBefore(newElement,untereZeile.nextSilbing);
untereZeile.parentNode.insertBefore(trolltablecontainer,untereZeile.nextSilbing);

document.getElementById('trolltable').style.visibility= (GM_getValue("trollvisible",false))? 'visible':'hidden';
document.getElementById('trolllist').style.visibility= (GM_getValue("trolllistvisible",false) && GM_getValue("trollvisible",false))? 'visible':'hidden';
