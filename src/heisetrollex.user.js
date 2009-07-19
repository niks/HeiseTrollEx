// ==UserScript==
// @name          Heise TrollEx
// @namespace     http://www.informatik.uni-freiburg.de/schnllm~
// @description   Heise TrollEx Version 0.90. Erhöht den Komfort des Heise Forums.
// @include       http://www.heise.de/*foren/*
// ==/UserScript==

// Originally programmed by Hannes Planatscher © 2005, 2006 (http://www.planatscher.net/)
// Modified by Michael Schnell © 2007-2009 (http://www.schnell-michael.de)

// This Script is unter the Creative Commons Attribution 2.0 Licenes (http://creativecommons.org/licenses/by/2.0/)

// TODO: The namespace is totally ugly and wrong. I should change it so something like "TrollEx"
// to use the website was not the best idea. And it is spelled totally wrong, too.

// **  global variables **

var buttonStyle = "text-decoration:none; font-weight:bold; color:blue; cursor:pointer; padding-left:0px; padding-right:0px; padding-top:0px; padding-bottom:0px"

// TrollEx version and update information
var trollExVersionDate = "24.12.2008 14:27:00";
var trollExDisplayVersion = "0.90" //Don't forget to update the version in the Greasemonkey description!
var latestVersionURL = "http://schnell-michael.de/HeiseTrollEx/update/version.txt";
var updateXML;

// Other configuration
trollExHPURL              = "http://www.schnell-michael.de/HeiseTrollEx/index.html";
trollExUpdateURL          = "http://www.schnell-michael.de/HeiseTrollEx/download.html";

var now = new Date();
var yesterday = new Date( now.getTime() - 24 * 3600 * 1000);
var lastSucessfulUpdateTest = new Date(GM_getValue("TrollExLastSucessfulUpdate", yesterday.toGMTString() ));
var checkAnyway = false;


// sorting modes
var threadSortModes = new Array();
var tmp = new Object();
tmp.name = "none";
tmp.displayName = "Nicht sortieren";
tmp.func = null;
threadSortModes.push(tmp);

var tmp = new Object();
tmp.name = "originalOrder";
tmp.displayName = "Orininal Reihenfolge";
tmp.func = sortThreadByOriginalOrder;
threadSortModes.push(tmp);

tmp = new Object();
tmp.name = "threadRating";
tmp.displayName = "Nach Thread Bewertung";
tmp.func = sortThreadsByThreadRating;
threadSortModes.push(tmp);

tmp = new Object();
tmp.name = "userRating";
tmp.displayName = "Nach User Bewertung";
tmp.func = sortThreadsByUserRating;
threadSortModes.push(tmp);

tmp = new Object();
tmp.name = "userThreadRating";
tmp.displayName = "Erst nach User Bewertung, dann nach Thread Bewertung";
tmp.func = sortThreadsByUserAndThreadRating;
threadSortModes.push(tmp);

tmp = new Object();
tmp.name = "threadUserRating";
tmp.displayName = "Erst nach Thread Bewertung, dann nach User Bewertung";
tmp.func = sortThreadsByThreadAndUserRating;
threadSortModes.push(tmp);

tmp = new Object();
tmp.name = "threadDate";
tmp.displayName = "Nach Datum";
tmp.func = sortThreadsByDate;
threadSortModes.push(tmp);


var normalThreadsSortMode = getThreadsSortModeByName("userThreadRating");
var badThreadsSortMode = getThreadsSortModeByName("threadRating");
var badUserThreadsSortMode = getThreadsSortModeByName("userRating");

var normalThreadsSortSubThreads = false;
var badThreadsSortSubThreads = false;
var badUserThreadsSortSubThreads = false;

// "check now" button
var checkNow = createButton("Jetzt überprüfen", "Suche nach Updates starten", function(){checkAnyway=true; checkForUpdates()});

// TrollEx homepage link node.
var trollExHP = document.createElement("a");
trollExHP.href= trollExHPURL;
trollExHP.appendChild(document.createTextNode("TrollEx Homepage"));

// TrollEx link to the update/downlaod page.
var trollExUpdateLink = document.createElement("a");
trollExUpdateLink.href= trollExUpdateURL;
trollExUpdateLink.appendChild(document.createTextNode("Update installieren"));

// more global variables
var userRatings;
var threshold = GM_getValue("TrollExThreshold", -50);
var userRatingThreshold = GM_getValue("TrollExUserThreshold", -2);;

var normalThreadsCount = 0;
var badThreadsCount = 0;
var badUserThreadsCount = 0;

var mergePagesCount = parseInt(GM_getValue("TrollExMergePagesCount", 3));
var pageCount;


// ** functions **

function checkForUpdates() {
	now = new Date();
	while(trollExUpdateContainer.firstChild){
		trollExUpdateContainer.removeChild(trollExUpdateContainer.firstChild);
	}
	if(checkAnyway || (lastSucessfulUpdateTest.getTime() + 2 * 3600 * 1000) < (now.getTime())){	
		GM_xmlhttpRequest({
			method: 'GET',
			url: latestVersionURL,
			headers: {
				'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey Heise TrollEx',
				'Cache-Control': 'no-cache', 
			},
			onload: updateVersionLoaded
		});
	}else{
		// work around: for some reason the "ä" in März looks ugly.
		var dateString = lastSucessfulUpdateTest.toLocaleString().replace("Ã¤", "ä");
		trollExUpdateContainer.appendChild(document.createTextNode("TrollEx (Version "+trollExDisplayVersion+") war zum Zeitpunkt der letzten Überprüfung ("));
		trollExUpdateContainer.appendChild(document.createTextNode(dateString+") aktuell."));
		trollExUpdateContainer.appendChild(checkNow);
	}
}

function updateVersionLoaded(responseDetails){
	if (responseDetails.readyState==4) { 
		if (responseDetails.status==200) {
			var versionText = responseDetails.responseText.split("\n");
			var latestVersionDate = versionText[0];
			var latestDisplayVersion = versionText[1];
						
			if( (parseDate(latestVersionDate)).getTime() > (parseDate(trollExVersionDate)).getTime() ){
				// Update available!
				var updates = document.createElement("span");
				updates.appendChild(document.createTextNode("Es gibt Updates!"));
				updates.setAttribute("style", "color:red; font-weight:bold");
				trollExUpdateContainer.appendChild(updates);
				trollExUpdateContainer.appendChild(document.createTextNode(" Diese Version = "+trollExDisplayVersion+" < "+ latestDisplayVersion+" = neueste Version. "));
				trollExUpdateContainer.appendChild(trollExUpdateLink);				
			} else {
				// up to date
				lastSucessfulUpdateTest = now;
				trollExUpdateContainer.appendChild(document.createTextNode("TrollEx (Version "+trollExDisplayVersion+") ist aktuell!"));
				trollExUpdateContainer.appendChild(document.createTextNode(" Überprüft am "+ lastSucessfulUpdateTest.toLocaleString()+" "));
				trollExUpdateContainer.appendChild(checkNow);
				GM_setValue("TrollExLastSucessfulUpdate", lastSucessfulUpdateTest.toGMTString()); 
			}
		} else {
			trollExUpdateContainer.appendChild(document.createTextNode("TrollEx hat Probleme bei der Kommunikation mit dem Server."));
			trollExUpdateContainer.appendChild(document.createTextNode(" Zuletzt erfolgreich überprüft am "+ lastSucessfulUpdateTest.toLocaleString()+" "));
			trollExUpdateContainer.appendChild(checkNow);
		}
	}
}

function getPage(pageNo){
	var baseURL = window.location.href.replace(/\/hs-\d*/, "");
	var hsNo = (pageNo-1)*16;
	var pageURL = baseURL + "hs-"+hsNo+"/";

	GM_xmlhttpRequest({
		method: 'GET',
		url: pageURL,
		headers: {
			'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey Heise TrollEx',
		},
		onload: factoryPageLoaded(pageNo)
	});
}

function factoryPageLoaded(pageNo){
	return function pageLoaded(responseDetails){
		if (responseDetails.readyState==4) { 
			if (responseDetails.status==200) {
				var docNode = document.createElement("div");
				var body = responseDetails.responseText;
				lines = body.split("\n");
				var start, end;
				for(var i = 0; i < lines.length; i++){
					if(lines[i].search(/<body.*>/) >= 0){
						start= i+1;
					}
					if(lines[i].search(/<\/body>/) >= 0){
						end = i-1;
					}
				}
				body = lines.splice(start, end-start).join("\n");
				docNode.innerHTML = body;
				
				var pageThreadListRes = document.evaluate(".//ul[@class='thread_tree']", docNode, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
				var pageThreadList = pageThreadListRes.snapshotItem(0);
				if(pageThreadList){
					moveThreads(pageThreadList, pageNo);
				}
			} else {
				trollExUpdateContainer.appendChild(document.createTextNode("TrollEx hat Probleme bei der Kommunikation mit dem Server."));
				trollExUpdateContainer.appendChild(document.createTextNode(" Zuletzt erfolgreich überprüft am "+ lastSucessfulUpdateTest.toLocaleString()+" "));
				trollExUpdateContainer.appendChild(checkNow);
			}
		}
	}
}

function getPageCount(){
	var navi = document.evaluate(".//ul[@class='forum_navi']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	if(navi.snapshotLength > 0){
		var maxNumber;
		var tmp = window.location.href.replace(/.*\/hs-(\d*)\//, "$1");
		if(tmp == window.location){
			maxNumber = 0;
		}else{
			maxNumber = parseInt(tmp);
		}
		var links = document.evaluate(".//a", navi.snapshotItem(0), null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for(var i = 0; i < links.snapshotLength; i ++){
			var tmp = links.snapshotItem(i).href.replace(/.*\/hs-(\d*)\//, "$1");
			if(tmp != links.snapshotItem(i).href){
				var number = parseInt(tmp);
				if(number > maxNumber){
					maxNumber = number;
				}
			}
		}
		var pageCount = maxNumber/16 +1;
		return pageCount;
	}else{
		return -1;
	}			
}

function getCurrentPage(){
	var number;
	var tmp = window.location.href.replace(/.*\/hs-(\d*)\//, "$1");
	if(tmp == window.location){
		number = 0;
	}else{
		number = parseInt(tmp);
	}
	return number/16 +1;
}

function updateForumNavis(){
	var baseURL = window.location.href.replace(/\/hs-\d*/, "");

	var navis = document.evaluate(".//ul[@class='forum_navi']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for(var n = 0; n < navis.snapshotLength; n++ ){
		var navi = navis.snapshotItem(n);
		var lis = document.evaluate(".//li", navi, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

		var expandAll;
		// first: remove all navigation elements and remember where to insert new ones
		for(var l = 0; l < lis.snapshotLength; l++){
			li = lis.snapshotItem(l);
			if(li.innerHTML.search(/Alles aufklappen/) < 0){
				navi.removeChild(li);
			}else{
				expandAll = li;
				break;
			}
		}
		
		// append "Seite"
		var pageli = document.createElement("li");
		pageli.innerHTML = "<b>Seite</b>  ";
		navi.insertBefore(pageli, expandAll);
		
		var currentPage = getCurrentPage();
		var li, link;
				
		if(pageCount <= mergePagesCount){
			//Just one entry, no link
			li = document.createElement("li");
			if(pageCount == 1){
				li.appendChild(document.createTextNode(" 1 "));			
			}else{
				li.appendChild(document.createTextNode(" 1-"+(pageCount)+" "));
			}
			navi.insertBefore(li, expandAll);
		}else{
		
			if(currentPage -4* mergePagesCount >= 1 ){
				var li = document.createElement("li");
				var link = document.createElement("a");		
				link.appendChild(document.createTextNode("1-"+(mergePagesCount)));
				link.href=baseURL;
				li.appendChild(link);
				navi.insertBefore(li, expandAll);
			}
			if(currentPage -4* mergePagesCount > 1 ){
				navi.insertBefore(document.createTextNode(" ... "), expandAll);
			}else{
				navi.insertBefore(document.createTextNode(" "), expandAll);			
			}
			
			for(var relp = -3; relp< 0; relp++){
				var p = currentPage + relp* mergePagesCount;
				if(p >= 0){
					var li = document.createElement("li");
					var link = document.createElement("a");		
					link.appendChild(document.createTextNode(p +"-"+(p+mergePagesCount-1)));
					link.href=baseURL+ "hs-"+((p-1)*16)+"/";
					li.appendChild(link);
					navi.insertBefore(li, expandAll);
					navi.insertBefore(document.createTextNode(" "), expandAll);
				}
			}
			
			li = document.createElement("li");
			if(currentPage == pageCount){
				li.appendChild(document.createTextNode(currentPage));
			}else if(currentPage +mergePagesCount -1 > pageCount){
				li.appendChild(document.createTextNode(currentPage+"-"+pageCount));
			}else{
				li.appendChild(document.createTextNode(currentPage+"-"+(currentPage+mergePagesCount-1)+" "));
			}
			navi.insertBefore(li, expandAll);
			navi.insertBefore(document.createTextNode(" "), expandAll);
			
			for(var relp = 1; relp <= 3; relp++){
				var p = currentPage + relp* mergePagesCount;
				if((p+mergePagesCount) <= pageCount){
					var li = document.createElement("li");
					var link = document.createElement("a");		
					link.appendChild(document.createTextNode(p +"-"+(p+mergePagesCount-1)));
					link.href=baseURL+ "hs-"+((p-1)*16)+"/";;
					li.appendChild(link);
					navi.insertBefore(li, expandAll);
					navi.insertBefore(document.createTextNode(" "), expandAll);
				}else if(p <= pageCount){
					var li = document.createElement("li");
					var link = document.createElement("a");		
					if(p<pageCount){
						link.appendChild(document.createTextNode(p +"-"+pageCount));
					}else{
						link.appendChild(document.createTextNode(pageCount));
					}
					link.href=baseURL+ "hs-"+((p-1)*16)+"/";;
					li.appendChild(link);
					navi.insertBefore(li, expandAll);
					navi.insertBefore(document.createTextNode(" "), expandAll);
				}
			}
			
			//last entry
			var start = pageCount - (pageCount % mergePagesCount);
			if(start > (currentPage + 4 * mergePagesCount)){
				navi.insertBefore(document.createTextNode(" ... "), expandAll);
			}else{
				navi.insertBefore(document.createTextNode(" "), expandAll);			
			}
						
			if(start >= (currentPage + 4 * mergePagesCount)){
				var li = document.createElement("li");
				var link = document.createElement("a");		

				if(start == pageCount){
					link.appendChild(document.createTextNode(start));
				}else if(start +mergePagesCount -1 > pageCount){
					link.appendChild(document.createTextNode(start+"-"+pageCount));
				}else{
					link.appendChild(document.createTextNode(start+"-"+(start+mergePagesCount-1)+" "));
				}
				link.href=baseURL+ "hs-"+((start-1)*16)+"/";;
				li.appendChild(link);
				navi.insertBefore(li, expandAll);
				navi.insertBefore(document.createTextNode(" "), expandAll);
				
			}			
		}
		// Neuere
		if(currentPage - mergePagesCount > 0){
			var li = document.createElement("li");
			var link = document.createElement("a");		
			link.appendChild(document.createTextNode("Neuere"));
			link.href=baseURL+ "hs-"+((currentPage-mergePagesCount-1)*16)+"/";;
			li.appendChild(link);
			navi.insertBefore(li, expandAll);
			navi.insertBefore(document.createTextNode(" "), expandAll);			
		}else{
			var li = document.createElement("li");
			li.appendChild(document.createTextNode("Neuere "));
			navi.insertBefore(li, expandAll);
		}
		// Ältere
		if(currentPage + mergePagesCount < pageCount){
			var li = document.createElement("li");
			var link = document.createElement("a");		
			link.appendChild(document.createTextNode("Ältere"));
			link.href=baseURL+ "hs-"+((currentPage+mergePagesCount-1)*16)+"/";;
			li.appendChild(link);
			navi.insertBefore(li, expandAll);
			navi.insertBefore(document.createTextNode(" "), expandAll);			
		}else{
			var li = document.createElement("li");
			li.appendChild(document.createTextNode("Ältere "));
			navi.insertBefore(li, expandAll);
		}	
	}
}

function parseBool(b){
	if(b=="true"){
		return true;
	}else if(b=="false"){
		return false;
	}
	GM_log("Error: Cannot parse "+b+" to a boolean");
}

function parseDec(d){
	//remove 0 at the beginning of the string. Otherwise it'll interpret as an octal...		
	var d2 = d.replace(/^0*/, "");
	if(d2.length == 0){
		return 0;
	}
	return parseInt(d2);
}

function parseDate(dateString){
	if(dateString == ""){
		// 01.01.1970 00:00:00
		return new Date(0);
	}
	var tmp = dateString.split(" ");
	var tmpDate = tmp[0].split(".");
	var date;
	var year;
	if(tmpDate[2].length == 2){
		year = parseDec(tmpDate[2]); 
		// the following will do the next few years...
		if(year >= 70){
			year +=1900;
		}else{
			year +=2000;
		}
	}else{
		year = parseDec(tmpDate[2]);
	}
	var month = parseDec(tmpDate[1]) - 1;
	var day = parseDec(tmpDate[0]);
	var hour = 0;
	var minute = 0;
	var second = 0;
	if(tmp.length > 1){
		var tmpTime = tmp[1].split(":");
		hour = parseDec(tmpTime[0]);
		minute = parseDec(tmpTime[1]);
		if(tmpTime.length > 2){
			second = parseDec(tmpTime[2]);
		}
	}
	date = new Date(year, month, day, hour, minute, second);
	return date;
}

function readThreadSortModes(){
	var normal = GM_getValue("TrollExNormalTheadsSorting", "userThreadRating:false").split(":");
	normalThreadsSortMode = getThreadsSortModeByName(normal[0]);
	normalThreadsSortSubThreads = parseBool(normal[1]);

	var badThreads = GM_getValue("TrollExBadTheadsSorting", "threadRating:false").split(":");
	badThreadsSortMode = getThreadsSortModeByName(badThreads[0]);
	badThreadsSortSubThreads = parseBool(badThreads[1]);
	
	var badUser = GM_getValue("TrollExBadUserTheadsSorting", "userRating:false").split(":");
	badUserThreadsSortMode = getThreadsSortModeByName(badUser[0]);
	badUserThreadsSortSubThreads = parseBool(badUser[1]);
}

function writeThreadSortModes(){
	GM_setValue("TrollExNormalTheadsSorting", normalThreadsSortMode.name+":"+normalThreadsSortSubThreads);
	GM_setValue("TrollExBadTheadsSorting", badThreadsSortMode.name+":"+badThreadsSortSubThreads);
	GM_setValue("TrollExBadUserTheadsSorting", badUserThreadsSortMode.name+":"+badUserThreadsSortSubThreads);
}

function readUserRatings(){
	var allRatings = GM_getValue("TrollExUserRatings", "");
	if(allRatings == ""){
		userRatings = new Array();
	}else{
		userRatings = allRatings.split(",");
	}
}

function writeUserRatings(){
	GM_setValue("TrollExUserRatings", userRatings.join(","));
}

function getRatingOf(user){
	for(var i = 0; i < userRatings.length; i++){
		var ratingItem = userRatings[i].split(":");
		if(ratingItem[0] == user){
			return ratingItem[1];
		}
	}
	return 0;
}

function setRatingOf(user, rating){
	user = trimName(user);
	for(var i = 0; i < userRatings.length; i++){
		var ratingItem = userRatings[i].split(":");
		if(ratingItem[0] == user){
			userRatings[i] = user + ":" +rating;
			return;
		}
	}
	userRatings.push(user + ":" + rating);
}


function deleteRatingOf(user){
	var goodCount = 0;
	var tmp = new Array(userRatings.length);
	
	for(var i = 0; i < userRatings.length; i++){
		var ratingItem = userRatings[i].split(":");
		if(! (ratingItem[0] == user || ratingItem[0] == "")){			
			tmp[goodCount] = userRatings[i];
			goodCount++;
		}
	}
	userRatings = new Array(goodCount);
	for(var i = 0; i < goodCount; i ++){
		userRatings[i] = tmp[i];
	}
}

function trimName(s){
	var trimmed;
	
	var start;
	for(var i = 0; i < s.length; i++){
		var c = s.substring(i, i+1);
		if(c != " " && c != "\n" && c != "\t"){
			start = i;
			break;
		}
	}
	var end;
	for(var i = s.length-1 ; i >=0; i--){
		var c = s.substring(i, i+1);
		if(c != " " && c != "\n" && c != "\t"){
			end = i+1;
			break;
		}
	}
	var length = end - start;
	trimmed = s.substring(start, end);
	return trimmed;
}

function updateDisplayedRatings(user){
	var containers = document.evaluate("//span[@TrollExUserRating='"+escape(user)+"']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for(var i = 0; i < containers.snapshotLength; i ++){
		var container = containers.snapshotItem(i);
		container.removeChild(container.firstChild);
		container.appendChild(getRatingDisplay(getRatingOf(user)));
	}
}

function factoryChangeRating(user, rating){
	return function(event) {
		// reading is necessary because the user coul'd have multiple pages open
		// and changed the user ratings (in particular adding users) in a other tab/window.
		readUserRatings(); 
		setRatingOf(user, rating);
		event.stopPropagation();
    	event.preventDefault();
    	writeUserRatings();
    	updateDisplayedRatings(user);
	};
}

function factoryAdjustRating(user, adjust){
	return function(event) {
		user = trimName(user);
		
		// remember the oldRating of THIS instance.
		var oldRating = parseInt(getRatingOf(user)) 

		// reading is necessary because the user coul'd have multiple pages open
		// and changed the user ratings (in particular adding users) in a other tab/window.
		readUserRatings(); 

		var rating = oldRating + parseInt(adjust);
		
		// ensure an maximum and minimum of 100 Points
		if(rating > 100){
			rating = 100;
		}else if(rating < -100){
			rating = -100;
		}
		setRatingOf(user, rating);
		event.stopPropagation();
    	event.preventDefault();
    	writeUserRatings();
    	updateDisplayedRatings(user);
    	if(oldRating == 0 ){
			createUserRatingList();    	
		}
	};
}

function factoryDeleteRating(user){
	return function(event) {
		// reading is necessary because the user coul'd have multiple pages open
		// and changed the user ratings in (in particular adding users) a other tab/window.
		readUserRatings(); 
		deleteRatingOf(user);
		event.stopPropagation();
		event.preventDefault();
		writeUserRatings();
		readUserRatings();
		updateDisplayedRatings(user);
		createUserRatingList();
	};
}

function getRatingDisplay(rating){
	var ratingDisplay = document.createElement("span");
	if(rating >=0){
		var unvisibleMinus = document.createElement("span");
		unvisibleMinus.style.visibility ="hidden";
		unvisibleMinus.appendChild(document.createTextNode("-"));
		ratingDisplay.appendChild(unvisibleMinus);
	}
	ratingDisplay.appendChild(document.createTextNode(rating));
	return ratingDisplay;
}

function factoryAdjustThreshold(adjust){
	return function(event){
		threshold= parseInt(threshold) + parseInt(adjust);
		GM_setValue("TrollExThreshold", threshold);
		t = document.getElementById("TrollExThreshold");
		t.removeChild(t.firstChild);
		t.appendChild(document.createTextNode(" "+threshold+"% "));
	}
}

function factoryAdjustUserThreshold(adjust){
	return function(event){
		userRatingThreshold= parseInt(userRatingThreshold) + parseInt(adjust);
		GM_setValue("TrollExUserThreshold", userRatingThreshold);
		t = document.getElementById("TrollExUserThreshold");
		t.removeChild(t.firstChild);
		t.appendChild(document.createTextNode(" "+userRatingThreshold+" "));
	}
}

function factoryAdjustMergePages(adjust){
	return function(event){
		var newValue = mergePagesCount + adjust;
		if(newValue < 1){
			newValue = 1;
		}else if(newValue > 60){
			newValue = 60;
		}
		mergePagesCount = newValue;
		GM_setValue("TrollExMergePagesCount", newValue);
		var dispElement = document.getElementById("mergePagesDisp");
		dispElement.firstChild.data = newValue;
	}
}

function createButton(displayText, toolTipText, func){
	button = document.createElement("button");
	button.appendChild(document.createTextNode(displayText));
	button.setAttribute("style", buttonStyle);
	button.setAttribute("title", toolTipText);
	button.addEventListener('click', func, true);
	return button;
}

function createThreadSortGUI(name, func, selectMode, checkSubThreads){
	var selgui = document.createElement("form");	
	selgui.setAttribute("name", name);
	
	selgui.appendChild(document.createTextNode("Sortieren nach: "));
	
	var sel = document.createElement("select");
	sel.setAttribute("name", "SortDisplayName");
	sel.setAttribute("size", "1");

	for(var i = 0; i < threadSortModes.length; i ++){
		var o = document.createElement("option")
		o.appendChild(document.createTextNode(threadSortModes[i].displayName));
		if(threadSortModes[i] == selectMode){
			o.setAttribute("selected", "selected");
		}
		sel.appendChild(o);
	}	
	sel.addEventListener('change', func, true);
	selgui.appendChild(sel);

	selgui.appendChild(document.createTextNode(" "));
	
	var cb = document.createElement("input");
	cb.setAttribute("type", "checkbox");
	cb.setAttribute("name", "SortSubThreads");
	cb.setAttribute("value", "true");
	if(checkSubThreads){
		cb.setAttribute("checked", "checked");
	}
	cb.addEventListener('change', func, true);
	
	selgui.appendChild(cb);
	selgui.appendChild(document.createTextNode(" Subthreads auch sortieren"));

	return selgui;
}

function createSubThreadSortCheckBox(name, func){
	var cb = document.createElement("input");
	cb.setAttribute("type", "checkbox");
	cb.setAttribute("name", name);
	cb.setAttribute("value", "sortSubthreads");
	cb.addEventListener('change', func, true);
	return cb;
}

function updateVisibility(){

	badThreadsVisible = GM_getValue("TrollExBadThreadsVisibility", false);
	badUsersVisible = GM_getValue("TrollExBadUsersVisibility", false);
	userRatingVisible = GM_getValue("TrollExUserRatingVisibility", false);
	
	if(badThreadsVisible) {
		if(badThreadsCount > 0){
			badThreadsContainer.appendChild(badThreadsSorting);
			badThreadsContainer.appendChild(badThreadsList);
			badThreadsVisibilityButton.firstChild.data= "Ausblenden";
		}
	}else{		
		try {
			badThreadsContainer.removeChild(badThreadsSorting);
			badThreadsContainer.removeChild(badThreadsList);
		} catch(e) {
			// ignore this
		}
		badThreadsVisibilityButton.firstChild.data= "Anzeigen";
	}
	if(badUsersVisible) {
		if(badUserThreadsCount > 0){
			badUsersContainer.appendChild(badUserThreadsSorting);
			badUsersContainer.appendChild(badUsersThreads);
			badUsersVisibilityButton.firstChild.data= "Ausblenden";
		}
	} else {
		try {
			badUsersContainer.removeChild(badUserThreadsSorting);
			badUsersContainer.removeChild(badUsersThreads);
		} catch (e) {
			// ignore this
		}
		badUsersVisibilityButton.firstChild.data= "Anzeigen";
	}
	
	if(userRatingVisible) {
		userRatingListContainer.appendChild(userRatingList);
		userRatingVisibilityButton.firstChild.data= "Ausblenden";
		userRatingListTitle.appendChild(userRatingSortButtonsContainer);
	} else {
		try {
			userRatingListContainer.removeChild(userRatingList);
			userRatingListTitle.removeChild(userRatingSortButtonsContainer);
		} catch (e) {
			// ignore this
		}
		userRatingVisibilityButton.firstChild.data= "Anzeigen";
	}
	
}

function switchBadThreadsVisibilty() {
	visible = GM_getValue("TrollExBadThreadsVisibility", false);
	visible = !visible;
	GM_setValue("TrollExBadThreadsVisibility", visible);
	updateVisibility();	
}

function switchBadUsersVisibilty() {
	visible = GM_getValue("TrollExBadUsersVisibility", false);
	visible = !visible;
	GM_setValue("TrollExBadUsersVisibility", visible);
	updateVisibility();
}

function switchUserRatingVisibilty() {
	visible = GM_getValue("TrollExUserRatingVisibility", false);
	visible = !visible;
	GM_setValue("TrollExUserRatingVisibility", visible);
	updateVisibility();
}

function createUserRatingList(){
	try {
		userRatingListContainer.removeChild(userRatingList);
		userRatingListTitle.removeChild(userRatingListTitle.firstChild);
	} catch (e) {
		// ignore this
	}

	userRatingList = document.createElement('ul');
	userRatingList.appendChild(document.createTextNode(""));
	
	var userRatingText;
	if(userRatings.length == 0){
		userRatingText = "Keine Forenteilnehmer bewertet.";
	}else if(userRatings.length == 1){
		userRatingText = "Einen Forenteilnehmer bewertet:";
	}else {
		userRatingText = (userRatings.length) + " Forenteilnehmer bewertet:";
	}
	userRatingListTitle.insertBefore(document.createTextNode(userRatingText), userRatingListTitle.firstChild);

	
	for (i = 0; i < userRatings.length; i++) {
		if (userRatings[i] != "") {
			r = userRatings[i].split(":");
			
			var user = r[0];
			var rating = r[1];
			
			line = document.createElement('li');

			line.appendChild(createButton("X", "Bewertung von "+ user + " löschen", factoryDeleteRating(user)));
			line.appendChild(createButton("0", "Bewertung von "+ user + " löschen", factoryChangeRating(user, 0)));	
			
			line.appendChild(document.createTextNode(" "));			
	
			line.appendChild(createButton("- -", "Bewertung von "+ user + " um zwei Punkte verschlechtern", factoryAdjustRating(user, -2)));
			line.appendChild(createButton("-", "Bewertung von "+ user + " um einen Punkt verschlechtern", factoryAdjustRating(user, -1)));

			line.appendChild(document.createTextNode(" "));			
		
			var ratingContainer = document.createElement("span");
			ratingContainer.setAttribute("TrollExUserRating", escape(user));			
			ratingContainer.appendChild(getRatingDisplay(rating));			
			line.appendChild(ratingContainer);

			line.appendChild(document.createTextNode(" "));			

			line.appendChild(createButton("+", "Bewertung von "+ user + " um einen Punkt verbessern", factoryAdjustRating(user, 1)));
			line.appendChild(createButton("++", "Bewertung von "+ user + " um zwei Punkte verbessern", factoryAdjustRating(user, 2)));

			line.appendChild(document.createTextNode("  " +user+ "  "));
			
			userRatingList.appendChild(line);
		}
	}
	userRatingVisible = GM_getValue("TrollExUserRatingVisibility", false);
	if(userRatingVisible) {
		userRatingListContainer.appendChild(userRatingList);
		userRatingVisibilityButton.firstChild.data= "Ausblenden";
	} else {
		userRatingVisibilityButton.firstChild.data= "Anzeigen";
	}
}

function getUserNameOfRow(row){
	var activeNameRes = document.evaluate("./div/div[@class='thread_user']/span" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var nameNode;
	if(activeNameRes.snapshotLength > 0){
		nameNode = activeNameRes.snapshotItem(0);
		activeThread = true;
	}else{
		var nameRes = document.evaluate("./div/div[@class='thread_user']" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		nameNode = nameRes.snapshotItem(0);
		activeThread = false;
	}
	return trimName(nameNode.innerHTML);
}

function moveThreads(listOfThreads, pageNo){
	var allArticles = document.evaluate(".//li[div/@class='hover' or div/@class='hover_line']", listOfThreads, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	// since mergePagesCount is <= 60, threadNo won't exceed 1000 
	var threadNo = (pageNo - getCurrentPage()) * 16;
	for (var i = 0; i < allArticles.snapshotLength; i++) {
		var row = allArticles.snapshotItem(i);
		
		var username;
		var nameNode;
		var activeThread;
		
		// determine the user name		
		var activeNameRes = document.evaluate("./div/div[@class='thread_user']/span" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if(activeNameRes.snapshotLength > 0){
			nameNode = activeNameRes.snapshotItem(0);
			activeThread = true;
		}else{
			var nameRes = document.evaluate("./div/div[@class='thread_user']" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			if(nameRes.snapshotLength > 0){
				nameNode = nameRes.snapshotItem(0);
				activeThread = false;
			}else{
				GM_log("kein Name gefunden!");
			}
		}
		if(nameNode){
			username = trimName(nameNode.innerHTML);
		}
		
		// detremine the thread rating
		var threadRatingRes = document.evaluate("./div/div[@class='thread_votechart']/a/img", row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var threadRating = 0;
		
		if(threadRatingRes.snapshotLength > 0){
			var rateElem = threadRatingRes.snapshotItem(0);
			threadRating = parseInt(rateElem.alt);
		}
		
		//determine the date		
		var date;
		var newOrActiveDateRes = document.evaluate("./div/div[@class='thread_date']/span", row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if(newOrActiveDateRes.snapshotLength > 0){
			date = trimName(newOrActiveDateRes.snapshotItem(0).innerHTML);			
		}else{
			var dateRes = document.evaluate("./div/div[@class='thread_date']", row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			if(dateRes.snapshotLength > 0){
				date = trimName(dateRes.snapshotItem(0).innerHTML);
			}
		}
		date = date.replace(/&nbsp;/ , " ");
		date = parseDate(date).getTime();

		// determine the user rating
		var userRating = getRatingOf(username);
		
		// check if parent nodes have already been moved 		
		var parentMovedSearch = document.evaluate( "ancestor::li[@trollex_moved_thread='userRating']" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var parentMovedUserRating = (parentMovedSearch.snapshotLength > 0);

		parentMovedSearch = document.evaluate( "ancestor::li[@trollex_moved_thread='threadRating']" ,row , null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var parentMovedThreadRating = (parentMovedSearch.snapshotLength > 0);
		
		
		var config, button;
		
		config = document.createElement("span");
		
		config.appendChild(createButton("-", "Bewertung von "+ username + " um einen Punkt verschlechtern", factoryAdjustRating(username, -1)));
		
		var ratingContainer = document.createElement("span");
		ratingContainer.setAttribute("TrollExUserRating", escape(username));
		ratingContainer.appendChild(getRatingDisplay(userRating));			
		config.appendChild(ratingContainer);

		config.appendChild(createButton("+", "Bewertung von "+ username + " um einen Punkt verbessern", factoryAdjustRating(username, 1)));
		
		nameNode.firstChild.data = " "+username;
		nameNode.insertBefore(config, nameNode.firstChild);
		
		// set some attributes for the later use (sorting the list)
		row.setAttribute("TrollExUserName", username);
		row.setAttribute("TrollExThreadRating", threadRating);
		row.setAttribute("TrollExOriginalOrder", threadNo);
		row.setAttribute("TrollExDate", date);
		threadNo++;
		
		
		if (!parentMovedUserRating && userRating <= userRatingThreshold) {
			// remove this subthread
			row.setAttribute("trollex_moved_thread", "userRating");
			badUsersThreads.appendChild(row);
			badUserThreadsCount++;
		}else if(!parentMovedUserRating && !parentMovedThreadRating && threadRating <= threshold) {
			row.setAttribute("trollex_moved_thread", "threadRating");
		   	badThreadsList.appendChild(row);
		   	badThreadsCount++;
		}else {
			if(row.parentNode.getAttribute("class") == "thread_tree"){
				normalThreadsList.appendChild(row);
				normalThreadsCount++;
			}
		}
		
	}
	updateCountTitles();
	sortAllThreads();
	updateVisibility();
}

function sortThreads(list, sortFunction, sortSubThreads){
	var rows = document.evaluate("./li[div/@class='hover' or div/@class='hover_line']", list, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	if(rows.snapshotLength > 0 ){
		var l = new Array(rows.snapshotLength);
		for(var i = 0; i < rows.snapshotLength; i++){
			l[i] = rows.snapshotItem(i);
		}
		l.sort(sortFunction);
		for(var i = 0; i < l.length; i++){
			list.appendChild(l[i]);
			if(sortSubThreads){
				// sort all sub lists
				var nextLevelRes = document.evaluate("./ul", l[i], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				for(var nl = 0; nl < nextLevelRes.snapshotLength; nl++){
					sortThreads(nextLevelRes.snapshotItem(nl), sortFunction, sortSubThreads);
				}
				
				// correct the class attributes
				var hoverRes = document.evaluate("./div[div[@class='thread_date']]", l[i], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				if(i < l.length -1 && list.getAttribute("class") != "thread_tree"){
					hoverRes.snapshotItem(0).setAttribute("class", "hover_line");
					l[i].setAttribute("class", "");
				}else{
					hoverRes.snapshotItem(0).setAttribute("class", "hover");
					l[i].setAttribute("class", "last");
				}
				if(list.getAttribute("class") != "thread_tree"){
					if(l.length > 1){
						list.setAttribute("class", "nextlevel_line");
					}else{
						list.setAttribute("class", "nextlevel");
					}
				}
			}			
		}
	}
}

function sortThreadsByDate(a, b){
	var vala = parseInt(a.getAttribute("TrollExDate"));
	var valb = parseInt(b.getAttribute("TrollExDate"));
	return valb - vala;
}

function sortThreadsByUserRating(a, b){
	var vala = getRatingOf(a.getAttribute("TrollExUserName")) * 1000;
	var valb = getRatingOf(b.getAttribute("TrollExUserName")) * 1000;
	vala += 999 - parseInt(a.getAttribute("TrollExOriginalOrder"));
	valb += 999 - parseInt(b.getAttribute("TrollExOriginalOrder"));
	return valb - vala;
}

function sortThreadsByThreadRating(a, b){
	var vala = parseInt(a.getAttribute("TrollExThreadRating")) * 1000;
	var valb = parseInt(b.getAttribute("TrollExThreadRating")) * 1000;
	vala += 999 - parseInt(a.getAttribute("TrollExOriginalOrder"));
	valb += 999 - parseInt(b.getAttribute("TrollExOriginalOrder"));
	return valb - vala;
}

function sortThreadByOriginalOrder(a, b){
	var vala = parseInt(a.getAttribute("TrollExOriginalOrder"));
	var valb = parseInt(b.getAttribute("TrollExOriginalOrder"));
	return vala - valb;
}

function sortThreadsByUserAndThreadRating(a, b){
	var vala = getRatingOf(a.getAttribute("TrollExUserName")) * 101000;
	var valb = getRatingOf(b.getAttribute("TrollExUserName")) * 101000;
	vala += parseInt(a.getAttribute("TrollExThreadRating")) * 1000;
	valb += parseInt(b.getAttribute("TrollExThreadRating")) * 1000;
	vala += 999 - parseInt(a.getAttribute("TrollExOriginalOrder")); 
	valb += 999 - parseInt(b.getAttribute("TrollExOriginalOrder"));
	return valb - vala;
}

function sortThreadsByThreadAndUserRating(a, b){
	var vala = parseInt(a.getAttribute("TrollExThreadRating")) * 101000;
	var valb = parseInt(b.getAttribute("TrollExThreadRating")) * 101000;
	vala += getRatingOf(a.getAttribute("TrollExUserName")) * 1000;
	valb += getRatingOf(b.getAttribute("TrollExUserName")) * 1000;
	vala += 999 - parseInt(a.getAttribute("TrollExOriginalOrder"));
	valb += 999 - parseInt(b.getAttribute("TrollExOriginalOrder"));
	return valb - vala;
}


function getThreadsSortModeByDisplayName(dispName){
	for(var i = 0; i < threadSortModes.length; i++){
		if(threadSortModes[i].displayName == dispName){
			return threadSortModes[i];
		}
	}
}

function getThreadsSortModeByName(name){
	for(var i = 0; i < threadSortModes.length; i++){
		if(threadSortModes[i].name == name){
			return threadSortModes[i];
		}
	}
}


function sortNormalThreads(){
	if(normalThreadsCount > 0 && normalThreadsSortMode.func != null){		
		sortThreads(normalThreadsList, normalThreadsSortMode.func, normalThreadsSortSubThreads);
	}
}

function sortBadThreads(){
	if(badThreadsCount > 0 && badThreadsSortMode.func != null){
		sortThreads(badThreadsList, badThreadsSortMode.func, badThreadsSortSubThreads);
	}
}

function sortBadUserThreads(){
	if(badUserThreadsCount > 0 && badUserThreadsSortMode.func != null){
		sortThreads(badUsersThreads, badUserThreadsSortMode.func, badUserThreadsSortSubThreads);
	}
}

function sortAllThreads(){
	sortNormalThreads();
	sortBadThreads();
	sortBadUserThreads();
}

function sortUserRatings(sortFunction){
	userRatings.sort(sortFunction);
	writeUserRatings();
	createUserRatingList();
}

function sortRatingsByRating(a, b){
	var vala = parseInt(a.split(":")[1]);
	var valb = parseInt(b.split(":")[1]);
	return valb-vala;
}

function sortRatingsByName(a, b){
	var vala = a.split(":")[0].toLowerCase();
	var valb = b.split(":")[0].toLowerCase();
	var ret;
	if(valb == vala){
		ret = 0;
	}else if(valb < vala){
		ret = 1;
	}else {
		ret = -1;
	}
	return ret;
}


function updateCountTitles(){
	while(badThreadsTitle.firstChild){
		badThreadsTitle.removeChild(badThreadsTitle.firstChild);
	}

	var badThreadsText;
	if(badThreadsCount==0){
	  badThreadsText = "Heise TrollEx hat keine schlecht bewertete Threads ausgefiltert.";
	}else if(badThreadsCount==1){
	  badThreadsText = "Heise TrollEx hat einen schlecht bewerteten Thread ausgefiltert:";
	}else{
	  badThreadsText = "Heise TrollEx hat " +badThreadsCount + " schlecht bewertete Threads ausgefiltert:";
	}
	
	badThreadsTitle.appendChild(document.createTextNode(badThreadsText));
	
	if(badThreadsCount > 0){	
		var tmp=document.createElement("span");
		tmp.appendChild(document.createTextNode("----"));
		tmp.style.visibility ="hidden";		
		badThreadsTitle.appendChild(tmp);
		badThreadsTitle.appendChild(badThreadsVisibilityButton);
	}
	
	while(badUsersTitle.firstChild){
		badUsersTitle.removeChild(badUsersTitle.firstChild);
	}
	var badUserThreadsText;
	if(badUserThreadsCount==0){
	  badUserThreadsText = "Heise TrollEx hat keine Threads von schlecht bewerteten Forenteilnehmern ausgefiltert.";
	}else if(badUserThreadsCount==1){
	  badUserThreadsText = "Heise TrollEx hat einen Thread von einem schlecht bewerteten Forenteilnehmer ausgefiltert:";
	}else{
	  badUserThreadsText = "Heise TrollEx hat " +badUserThreadsCount + " Threads von schlecht bewerteten Forenteilnehmern ausgefiltert:";
	}
	badUsersTitle.appendChild(document.createTextNode(badUserThreadsText));

	if(badUserThreadsCount > 0){
		tmp=document.createElement("span");
		tmp.appendChild(document.createTextNode("----"));
		tmp.style.visibility ="hidden";
		
		badUsersTitle.appendChild(tmp);
		badUsersTitle.appendChild(badUsersVisibilityButton);
	}
	
}

//document.getElementById("container").setAttribute("style", "width:80em; position: relative; padding: 0; margin: 0;");
//document.getElementById("container_content").setAttribute("style", "width:75em; min-width: 730px; position: relative; top: 100px; left: 0; float: left; background: #ffffff;");
//document.getElementById("mitte").setAttribute("style", "float: right; width: 63em; min-width: 540px; background: #ffffff; margin-bottom: 2em; padding-right: 0.5em;");

readUserRatings();
readThreadSortModes();

var threadListRes = document.evaluate("//ul[@class='thread_tree']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
var threadList;
if(threadListRes.snapshotLength > 0){
	threadList = threadListRes.snapshotItem(0);
}

var normalThreadsList = document.createElement('ul');
normalThreadsList.setAttribute('class', 'thread_tree');

var badThreadsList = document.createElement('ul');
badThreadsList.setAttribute('class', 'thread_tree');

var badUsersThreads = document.createElement('ul');
badUsersThreads.setAttribute('class', 'thread_tree');

// create bad threads title
var badThreadsTitle = document.createElement('span');
badThreadsTitle.setAttribute("style", "text-decoration:none; font-weight:bold;");
var badThreadsVisibilityButton = createButton("Ein-/Ausblenden", "", switchBadThreadsVisibilty);

// create the "threads of bad users" title element

var badUsersTitle = document.createElement('span');
badUsersTitle.setAttribute("style", "text-decoration:none; font-weight:bold;");
var badUsersVisibilityButton = createButton("Ein-/Ausblenden", "", switchBadUsersVisibilty);

// create normel Threads sorting element.

var normalSorting = createThreadSortGUI("NormalSortingForm", 
  function(){ 
  	dispName = document.forms.namedItem("NormalSortingForm").elements.namedItem("SortDisplayName").value;
  	normalThreadsSortMode = getThreadsSortModeByDisplayName(dispName);
  	normalThreadsSortSubThreads = document.forms.namedItem("NormalSortingForm").elements.namedItem("SortSubThreads").checked;
  	writeThreadSortModes();
  	sortNormalThreads();
  }, normalThreadsSortMode, normalThreadsSortSubThreads);
normalSorting.setAttribute("style", "font-weight:bold");

var badThreadsSorting = createThreadSortGUI("BadThreadsSortingForm", 
  function(){ 
  	dispName = document.forms.namedItem("BadThreadsSortingForm").elements.namedItem("SortDisplayName").value;
  	badThreadsSortMode = getThreadsSortModeByDisplayName(dispName);
  	badThreadsSortSubThreads = document.forms.namedItem("BadThreadsSortingForm").elements.namedItem("SortSubThreads").checked;
  	writeThreadSortModes();
  	sortBadThreads();
  }, badThreadsSortMode, badThreadsSortSubThreads);
  
var badUserThreadsSorting = createThreadSortGUI("BadUserThreadsSortingForm",
  function(){ 
  	dispName = document.forms.namedItem("BadUserThreadsSortingForm").elements.namedItem("SortDisplayName").value;
  	badUserThreadsSortMode = getThreadsSortModeByDisplayName(dispName);
  	badUserThreadsSortSubThreads = document.forms.namedItem("BadUserThreadsSortingForm").elements.namedItem("SortSubThreads").checked;
  	writeThreadSortModes();
  	sortBadUserThreads();
  }, badUserThreadsSortMode, badUserThreadsSortSubThreads);

// create the threshold GUI 
thresholdGUI = document.createElement('div');

thresholdGUI.appendChild(document.createTextNode("Schwellwert ab dem schlecht bewertete Threads ausgefiltert werden sollen: "));

tmp=document.createElement("span");
tmp.appendChild(document.createTextNode("----"));
tmp.style.visibility ="hidden";
thresholdGUI.appendChild(tmp);

thresholdGUI.appendChild(createButton("- -", "Threashold um 10 erniedrigen", factoryAdjustThreshold(-10)));
thresholdGUI.appendChild(createButton("-", "Threashold um 5 erniedrigen", factoryAdjustThreshold(-5)));

thresholdContainer = document.createElement("span");
thresholdContainer.setAttribute("id", "TrollExThreshold");
thresholdContainer.appendChild(document.createTextNode(" " + threshold + "% "));
thresholdGUI.appendChild(thresholdContainer);

thresholdGUI.appendChild(createButton("+", "Threashold um 5 erhöhen", factoryAdjustThreshold(5)));
thresholdGUI.appendChild(createButton("++", "Threashold um 10 erhöhen", factoryAdjustThreshold(10)));


// create the user threshold gui
userThresholdGUI = document.createElement('div');

userThresholdGUI.appendChild(document.createTextNode("Schwellwert ab dem Threads von schlechten Forenteilnehmern ausgefiltert werden sollen: "));

tmp=document.createElement("span");
tmp.appendChild(document.createTextNode("----"));
tmp.style.visibility ="hidden";
userThresholdGUI.appendChild(tmp);

userThresholdGUI.appendChild(createButton("- -", "Threashold um 2 erniedrigen", factoryAdjustUserThreshold(-2)));
userThresholdGUI.appendChild(createButton("-", "Threashold um 1 erniedrigen", factoryAdjustUserThreshold(-1)));

userThresholdContainer = document.createElement("span");
userThresholdContainer.setAttribute("id", "TrollExUserThreshold");
userThresholdContainer.appendChild(document.createTextNode(" " + userRatingThreshold + " "));
userThresholdGUI.appendChild(userThresholdContainer);

userThresholdGUI.appendChild(createButton("+", "Threashold um 1 erhöhen", factoryAdjustUserThreshold(1)));
userThresholdGUI.appendChild(createButton("++", "Threashold um 2 erhöhen", factoryAdjustUserThreshold(2)));

// create the "merge pages" GUI

var mergePagesGUI = document.createElement("div");
var mergePagesDisp = document.createElement("span");
mergePagesDisp.appendChild(document.createTextNode(mergePagesCount));
mergePagesDisp.setAttribute("id", "mergePagesDisp");
mergePagesGUI.appendChild(createButton("-", "Eine Seite weniger", factoryAdjustMergePages(-1)));
mergePagesGUI.appendChild(document.createTextNode(" "));
mergePagesGUI.appendChild(mergePagesDisp)
mergePagesGUI.appendChild(document.createTextNode(" "));
mergePagesGUI.appendChild(createButton("+", "Eine Seite mehr", factoryAdjustMergePages(1)));
mergePagesGUI.appendChild(document.createTextNode(" Seiten zu einer zusammenfügen"));


// create the user rating list title

userRatingListTitle =  document.createElement('span');

userRatingVisibilityButton = createButton("Ein-/Ausblenden", "" , switchUserRatingVisibilty);

var userRatingSortButtonsContainer = document.createElement("span");
tmp=document.createElement("span");
tmp.appendChild(document.createTextNode("----"));
tmp.style.visibility ="hidden";
userRatingSortButtonsContainer.appendChild(tmp);
tmp = null;
userRatingSortButtonsContainer.appendChild(document.createTextNode("Sortieren nach: "));

var sortUserRatingsNameButton = createButton("Nach Namen", "Sortiert die Liste nach Namen", function(){sortUserRatings(sortRatingsByName);} );
var sortUserRatingsRatingButton = createButton("Nach Bewertung", "Sortiert die Liste nach Bewertung", function(){sortUserRatings(sortRatingsByRating);} );
userRatingSortButtonsContainer.appendChild(sortUserRatingsNameButton);
userRatingSortButtonsContainer.appendChild(sortUserRatingsRatingButton);

if(userRatings.length > 0){
	tmp=document.createElement("span");
	tmp.appendChild(document.createTextNode("----"));
	tmp.style.visibility ="hidden";
	userRatingListTitle.appendChild(tmp);
	userRatingListTitle.appendChild(userRatingVisibilityButton);
	if(GM_getValue("TrollExUserRatingVisibility", false)){
		userRatingListTitle.appendChild(userRatingSortButtonsContainer);
	}
}


// create the config elements.

trollExConfigTitle = document.createElement("span");
trollExConfigTitle.setAttribute("style", "text-decoration:underline; font-weight:bold;");
trollExConfigTitle.appendChild(document.createTextNode("TrollEx Konfiguration"));

var trollExUpdateContainer = document.createElement("span");

trollExContainer = document.createElement("div");
trollExContainer.appendChild(trollExConfigTitle);
trollExContainer.appendChild(document.createElement("br"));
var hp = document.createElement("div");
hp.setAttribute("style", "text-align:right");
hp.appendChild(trollExHP);
trollExContainer.appendChild(hp);
trollExContainer.appendChild(document.createElement("br"));

trollExContainer.appendChild(trollExUpdateContainer);

trollExContainer.appendChild(document.createElement("br"));
trollExContainer.appendChild(document.createElement("br"));
trollExContainer.appendChild(thresholdGUI);
trollExContainer.appendChild(document.createElement("br"));
trollExContainer.appendChild(userThresholdGUI);
trollExContainer.appendChild(document.createElement("br"));
trollExContainer.appendChild(mergePagesGUI);
trollExContainer.appendChild(document.createElement("br"));
trollExContainer.appendChild(userRatingListTitle);



userRatingListContainer = document.createElement("div");
trollExContainer.appendChild(userRatingListContainer);

badThreadsContainer = document.createElement("div");
badThreadsContainer.appendChild(badThreadsTitle);

badUsersContainer = document.createElement("div");
badUsersContainer.appendChild(badUsersTitle);

if(threadList){
	threadList.parentNode.insertBefore(normalSorting, threadList.nextSibling);
	threadList.parentNode.insertBefore(normalThreadsList, normalSorting.nextSibling);
	threadList.parentNode.insertBefore(badThreadsContainer, normalThreadsList.nextSibling);
	threadList.parentNode.insertBefore(badUsersContainer, badThreadsContainer.nextSibling);
}

var untereZeileRes  = document.evaluate( "//ul[@class='forum_aktion']", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
var untereZeile = untereZeileRes.snapshotItem(0);
untereZeile.parentNode.insertBefore(trollExContainer, untereZeile.nextSilbing);

createUserRatingList();
if(threadList){
	moveThreads(threadList, getCurrentPage());
}

pageCount = getPageCount();

if(mergePagesCount > 1){
	var cp = getCurrentPage();
	
	var i = 1;
	while(cp + i <= pageCount && i < mergePagesCount){
		getPage(cp+i);
		i++;
	}
	if(window.location.href.search(/\/list/) >= 0){
		updateForumNavis();
	}
}
checkForUpdates();