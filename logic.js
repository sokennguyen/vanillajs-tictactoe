"use strict";
/*
	There are multiple exercises in this set of files!
	Search for "EXERCISE" to locate the following from logic.js (this file) and from ServerConnection.js :

	EXERCISE 1: Create the function updateTable() (this is a "HTML-dance-routine" with JS generating HTML)
	EXERCISE 2: Create a usefull logic for the function click() (this is pure programming logic for "getting the game 
		    into a working state")
	ATTENTION!IMPORTANT!: At this stage take a _BACKUP OF YOUR WORK_ if you got the game up and running. The next two
			      EXERCISES can really mess up the whole program!
	EXERCISE 3: Make the ServerConnection class more fault tolerant (this is partially about programming logic, but
		    will also force you to read through and consider the various HTTP protocol errors)
	EXERCISE 4: Modify/implement the ServerConnection-class in a different manner (you probably also need to touch this
		   file ... depends on how "high tech" you want to take this :-). Implement callback-methods, which enable
		   the screen to refresh ever so slightly (i.e. less than an eyeblink ;-) quicker. The main advantage is that
		   the logic and architecture of the program will improve significantly!
		   This is a challenging exercise in which you will come across both the asynchronous nature of a program,
		   what "this" means and also the deeper aspects of the XMLHttpRequest class which was explained during the
		   lecture.
		   In the current version, when an answer is received from the server, it is stored and the stored answer
		   then waits until a timer reads the variable and presents the contents on screen.
		   That works OK in this program (especially since the timer has to be quite tight), but it's not the most
		   elegant way to do it!
		   It would be better if the response from the server would immediately start a chain of events (function 
		   calls) which end up updating the screen. Another way to express this: there's no need to read the reason
		   for the update from the variable, but since we still do need to poll the server that will be just about
		   the only change.
		   The timer will now only be a "heartbeat" that makes sure the browser will visit the server regularly to
		   check the situation there. But the timer code will no longer read the variable or update the screen.
		   

	
	You can still do a few extra design and imrovement updates if you have the time (or if exercise 4 starts to annoy you
	too much for a while :-) :
		- Check whether the game is over! At the moment no player is ever declared a "winner" by the program. The
		  game needs to check for the existence of rows/columns/diagonals of 3 X:s and O:s. 
		- Make the gameboard dynamic in size: 5x5, 10x10, whateverXwhatever - let the user decide (but no need for
		  an UI for this, just make it a constant in code at this stage)!
	

	None of these requires any changes into the .php or .html-files! Only submit .js files into Moodle.

	In a real world case a considerable part of the contents of these .js files would definitely live in the server side.
	This would be a neccessity, because in real life the game logic checks like "can the move be made" and "did someone
	win" must _not_ be done in the browser side with JavaScript, because at the end of the day you can pretty much
	override anything you want there via using the console! At the very least you would not want to reward players with
	money with as flimsy a system as we have in these files now :-).
	So, you want to play with the console?
	Try: updateTable("OOOOOOOOO"), once you have completed EXERCISE 1... 
	...and keep in mind that connection.updteState = function() {}; is also trivially doable in a console!
	
	The lesson learned is: BUSINESS logic has no place in browser side! In this example GAME logic represents the same
	category of code as BUSINESS logic normally does!
*/

//This is a small helper file/class to separate communication away from this file. Extending XMLHttpRequest is a bit
//out of style, though :-).
const connection = new ServerConnection();

const state = [[],[],[]]

//We use these to fill the <table>, IMPORTANT: use these or matching the contents will not work at all,
//these will be used automatically if you use the prewritten functions (presented later in this file) for
//populating the table:
const EMPTYT = String.fromCharCode(160)+" "+String.fromCharCode(160)+" "+String.fromCharCode(160);
const X_TEXT = String.fromCharCode(160)+"X"+String.fromCharCode(160);
const O_TEXT = String.fromCharCode(160)+"O"+String.fromCharCode(160);

//False if you just follow the game. The first click on the game board will "capture" you as a player. The third clicker and
//onwards will be just following the game.
let participant = false;

//This is the function which we kick off every 0.5 seconds. It updates the game board from the server. If you look at the
//code you realize it also directly updates the screen, but that is not an optimal case and in EXERCISE 4 you can do something 
//about that.
let timeout;

//You can't click twice in a row, you have to wait for a response from the other player.
let alreadyClicked = false;

/*
	This function starts the whole thing up. Quite often the JavaScript which generates the page is started when the body
	of the document is loaded. The important thing to know is what elements exist when the code starts running.
*/
function start()
{
	let text = "TicTacToeGame";
	let troot = document.getElementById("maintable");
	let newtable = document.createElement("table");
	let newtr = document.createElement("tr");
	newtable.border = 1;
	for (let i = 0 ; i < text.length; i++ )
	{
		let cell = document.createElement("td");
		cell.onclick = () => click(111, i);
		let character = document.createTextNode(String.fromCharCode(160)+
							text.substring(i, i+1)+
							String.fromCharCode(160)
						);
		cell.appendChild(character);
		newtr.appendChild(cell);
		if (i === 5)
		{
			newtable.appendChild(newtr);
			newtr = document.createElement("tr");
		}
	}
	newtable.appendChild(newtr);
	troot.appendChild(newtable);
	
	//console.log("We start checking whether anything new has happened in the server side");
	/* Note that this is not a very pretty way to update the changes after the arrival: in reality we want callbacks
	   which reflect the changes on screen right away. Change 5000 to 500, when you tire of waiting...*/
	//console.log("To make the game title visible longer, the initial timing is 5 seconds, not 0.5 seconds.");
	timeout = setTimeout(timercode, 5000);
}

/*
	Literally a function with timer code :-). The first time we run this 5 seconds from the start of the program in
	start(). After that this function reschedules itself to run every 0.5 seconds. (End of this function.)
	The big issue here is that the code LOOKS like it first fetches statestring and then starts checking it's contents...
	...that's not what actually happens, because fetchState will not wait data from the server!!! (Nothing in JS would
	actually wait for data from the server, JS never stops, it _queues_!)
	This function will need to be shortened in exercise 4 if you do it properly?
*/
function timercode()
{
	let statestring = connection.fetchState();
	// console.log(statestring);
	if (statestring != "NONEWS")
	{
		//The first letter of the state is a B (BACK), if the state is the same as the one sent from this machine.
		if (statestring.substring(0,1) != "B") alreadyClicked = false;
		else statestring = statestring.substring(1);
		updateTable(statestring.substring(1));
	}	
	//recursive function this early in the class? (o_O)
	//maintable get updates every 0.5ms
	timeout = setTimeout(timercode, 100);
}


/*
  !!!!!VERYVERYVERYVERYVERY IMPORTANT!!!!!
  You really have to use these to create the <td>-tag contents in a way which is compatible with other code in here.
  If you don't, then you will end up correcting quite a few other locations in the code... These are to be used "as is"
  as the contents of the state array. Practically: if you look at the code of resolveIdAndUpdate you will see that
  the state array of this code does not contain numerical values, but TextNodes!
  So, if you know that the address in [1,2] should be an O, you should do this:
  state[1][2] = drawo();
  Other than that state is just a regular (2-dimensional) array and you need to properly set it up for use.
  Because state now contains nodes which are directly embeddable to a HTML-document, drawing the array is now fairly
  trivial. As an example:
  myNewTdTag.appendChild(state[i][j]);
*/
function drawx()
{
	return document.createTextNode(X_TEXT);
}
function drawo()
{
	return document.createTextNode(O_TEXT);
}
function drawe()
{
	return document.createTextNode(EMPTYT);
}

/*
EXERCISE 1: Create the drawing function below!
	   You get 9 characters in the statestring. The first three are the first row, next three are second
	   row, last three are the last row.
	   Example:
	   X__XO____
		means:
	   X _ _
	   X O _
	   _ _ _ 
		O can now "block" X by placing an O underneath the lower X. If O doesn't block and X places
		the next move to lower left corner, the game will continue. 
	   _ means the square is empty.

	   In this function you need to create the HTML for presenting the game on screen and also place that
	   game into the HTML document so it's visible in the browser.

	   Rough implementation guide:
	   Capture the location of maintable from the document. Scratch the contents of it. Construct a new
	   table according to state and embed it into maintable.

	   Check the video for how the end result: doesn't need to be "ultra-pretty" ;-).
	   
	   connection.currentIdentity() will tell this function whether the player is X, O or "nothing yet". Use
	   it to write that information above the table.

	   Te table itself is "your bog standard '<table><tr><td>'-thing", so you can create the element nesting
	   just like last week's slides presented.
		
	   Note that the direct contents of the state array are used for tracking the UI state! That's a little bit
	   ugly (we prefer to separate state from appearance, in HTML the nodes are appearance!). Use the readymade
	   draw-functions (above) for filling in the <td> contents so the logic keeps working!
	   If we think of this whole thing via a traditional model-view-controller pattern, this confusion of state
	   and how stuff looks like is actually not all that bad: here in the browser side we kind of should not have
	   the "master state" anyways - this should be all about the view :-). But of course in reality we have MVCs
	   within MVCs ;-).

	   Note that you simply cannot assume you can complete this function without reading _ALL_ the code you
           have in these files! You absolutely will need to track and trace the existing code in order to get this
           done and that is fully intentional.

	   A hint: Start examining the code from the start()-function where the "start up logo" of the game is drawn.

*/
function updateTable(statestring)
{
	let troot = document.getElementById("maintable")
	let newtable = document.createElement("table")
	let newtr = document.createElement("tr")
	let count = 0
	let blankCount = 0
	troot.innerHTML=''
	let curid = connection.currentIdentity()
	let idInfo = document.createElement('p')
	let previousMove = connection.previousMoveBy()
	let currentTurn = previousMove === 'X' ? 'O' : 'X'

	if (alreadyClicked) 
		idInfo.textContent = curid==='X' ? 'wait for O\'s turn' : 'wait for X\'s turn'
	else 
		idInfo.textContent = `Click to place a move as ${currentTurn}`
	troot.appendChild(idInfo)

	newtable.border = 1
	for (let i = 0 ; i < 3; i++ ){
		for (let j = 0; j < 3; j++){
			let cell = document.createElement("td")
			cell.onclick = () => click(i, j)

			let charInBox
			switch (statestring[count]){
				case('_'):{
					charInBox=drawe();
					blankCount++
				} 
				break;
				case('X'): charInBox=drawx();
				break;
				case('O'): charInBox=drawo();
				break;
			}
			
			state[i][j]=charInBox.nodeValue
			cell.appendChild(charInBox)
			newtr.appendChild(cell)
			if (j === 2)
			{
				newtable.appendChild(newtr)
				newtr = document.createElement("tr")
			}
			count++
		}
	}
	if (blankCount===0) connection.restartSession()
	newtable.appendChild(newtr)
	troot.appendChild(newtable)
	// console.log(statestring);
	const resetButton = document.createElement('button')
	resetButton.onclick=()=>{
		connection.restartSession()
		updateTable(statestring)
	}
	resetButton.textContent='Restart'
	troot.appendChild(resetButton)
	count=0
	
}

/*
   This is not a Pretty function. It does two things at the same time. But whatever: for this function it is better to do
   both at the same time: resolve identity AND draw on screen, because if it doesn't draw on screen the user will start to
   furiously click wondering why nothing happens. Of course, in real life, if we aggressively draw stuff like this on
   screen before that stuff has been delegated to the server, we might be in trouble: suppose two people in different
   computers click a square at exactly the same split second?
	(In a game this is not the end of the world, but consider this: In a web shop you manage to put a unique item
	 into your shopping basket and pay for it at about the same time someone else did. What shall we do now? Yep,
	 sometimes it is better to show an hourglass and verify that there are no conflicts, than to just try to make
	 the UI fully "instant".)
*/
function resolveIdAndUpdate(x,y)
{
	if (x === 111) 
	{
		//console.log("So, it seems the logo is still on screen, lets not do anything...");
		timercode()
		return "";
	}

	if (alreadyClicked) {
		alert('You\'re trying make 2 moves in 1 turn, not fair (-_-)')
		return ''
	}
	if (state[x][y]!==EMPTYT) {
		alert('The square is already played :D?!')
		return ""
	}
	
	//console.log("Am I X or O?");
	let curid = connection.currentIdentity();
	//console.log("Identity in game is " + curid);
	if (curid === "")
	{
		curid = connection.previousMoveBy();
		console.log("I was not yet in the game, the previous player was " + curid);
		if (curid === "X") 
		{
			state[x][y] = O_TEXT;
			curid = "O";
		}
		else 
		{
			state[x][y] = X_TEXT;
			curid = "X";
		}
			
	}
	else
	{
		if (curid === connection.previousMoveBy())
		{
			alert("Somehow it seems to me you are trying to use a THIRD browser to get more turns!?");
			return "";
		}
		else
		{
			if (curid === "X") state[x][y] = X_TEXT;
			else state[x][y] = O_TEXT;
		}
	}
		
	console.log("I will be or I already am a " + curid);
	participant = true;
	return curid;
}

/*
   This function sends the clicks to the server and is also responsible for a major portion of the logic. This was
   said earlier already, but worth repeating: In real life having "server side" logic like this here might have some
   very unfortunate end results. How unfortunate is then dependent on the type of program we write :-(.
*/
function click(x,y)
{
	//alert("OK, you clicked on (" + x + "," + y + ") look for this message from the code and read the comments below.");
	/*
	EXERCISE 2: Implement more logic here:
		-Does every square already have an X or an O? If, then do connection.restartSession() and let the player
		 know the game is restarting. This way the page does not need a reload for a new game.
			-Hint: create a variable with value "no empty spots", as you go through the values in state,
			       if even one value is EMPTYT, you have empty spots.
		-Check (x,y) is empty, if not, formally file a complaint ( ;-) ) to the user!
		-Check whether the player has just clicked (function alreadyClicked), if, force to wait for a response and
		 point out "doubleclicking" is not fair.

		All of these are simple in the sense that if these checks fail then the function can be stopped right away.
		In the video you see how stuff works when all of these have been properly implemented.
	*/

	let curid = resolveIdAndUpdate(x,y);
	if (curid === "") return;
	let statestring = curid;
	for (let i = 0 ; i < 3; i++ )
	{
		for (let j = 0; j < 3; j++ )
		{
			switch (state[i][j])
			{
				case (X_TEXT): {statestring += "X";} break;
				case (O_TEXT): {statestring += "O";} break;
				case (EMPTYT): {statestring += "_";} break;
				default: alert("There's stuff in state that should not be there!?"); return;
			}
		}
	}
	connection.updateState(statestring);
	alreadyClicked = true;
}
const checkForWin = () => {
	for (let i = 0; i<3; i++){

		//horizontal
		if ((state[i][0] !== EMPTYT) &&
			(state[i][0] === state[i][1]) &&
			(state[i][0] === state[i][2]))
			return (state[i][0] == X_TEXT ? 1 : -1) 

	}
}