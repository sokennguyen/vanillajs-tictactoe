"use strict";

/*
	Two assignments are related to this file, look for the word "EXERCISE" to get hints of where they might be!
	This file has been implemented a kazillion times. You can utilize it as a barebone for "old school" connector.
	To make the file shorter, a lot of error handling and browser compatiblity glue has been left out.
	As a result of EXERCISE 3 you're well on your way to adding a robust generic class to your toolkit.
*/

//An example of inheriting XMLHttpRequest. This is quite a typical technical use of inheritance (vs. the "animal kingdom exercises")
//Also make note of how this class and the other one defined in this file do not really have any say in the game logic as such!
class Update extends XMLHttpRequest
{
	//In EXERCISE 4 you want to pass the callback function here.
	//That one will allow you to do the instant screen updates. Careful with the context of "this" now!!!
	constructor(con, data, url)
	{
		super();
		this.myCon = con;
		this.onreadystatechange = this.handleResponse;
		let senddata = "";
		//An interesting aspect of JS: no overloading... but at the same time nothing prevents you from simply leaving
		//some function parameters out, so you can use that feature to have multiple "fingerprints/signatures"!
		if ( data != null )
		{
			senddata = "?data="+encodeURI(data);
		}
		let useurl = "update.php";

		if ( url != null )
		{
			useurl = url;
		}
		this.open("GET", useurl+senddata);
		this.send();
	}

	handleResponse()
	{
		if ( (this.readyState === 4) && (this.status === 200) )
		{
			if (this.myCon.statestring != this.responseText)
			{
				this.myCon.statestring = this.responseText;
				// In EXERCISE 4 you should call the callback here...
				// that callback, in turn, would then handle the screen update?
				// Or perhaps that one has a callback to handle it (to really have the code in the same file with the
				// relevant callback)? Design it yourself now!
				
				// if (this.myCon.prevstate != this.myCon.statestring)
				// {
				// 	console.log("State changed : " + this.myCon.prevstate + " --> " + this.myCon.statestring);
				// 	this.myCon.prevstate = this.myCon.statestring;
				// 	if (this.myCon.statestring === this.myCon.sentstate)
				// 	{
				// 		if (this.myCon.id === "")
				// 		{
				// 			this.myCon.id = this.myCon.sentstate.substring(0,1);
				// 			console.log("The player took part in the game by making a move");
				// 			console.log("The player is " + this.myCon.id);
				// 			console.log("The move was made");
				// 		}
				// 		return "B" + this.myCon.statestring;
				// 	}
				// 	if (this.myCon.statestring === "O_________")
				// 	{
				// 		this.myCon.id = "";
				// 		this.myCon.sentstate = "";
				// 	}
				// 	return this.myCon.statestring;
				// }
				// else
				// {
				// 	new Retrieve(this, null, null);
				// 	return "NONEWS";
				// }
			}

		}
		else
		{
			/*
				EXERCISE 3:
				You need to fill this branch if you want the code to be prepared for network connection
				issues!
				Start logging this, see what kinds of values readyState and status get.
				Unfortunately, in order to even log errors properly you need to lower down the interval
				for making connections to something like 10 seconds?
				And because you're working with localhost, you'll never get the trickiest errors - you
				can easily pretty much only simulate the server going down (by shutting down the server)?
				That means you will need to read the HTTP specification documents for error codes and then
				just fill in based on that.
			*/
			if ((this.readyState === 4) && (this.status === 0))
				console.log('Cannot Connect To Server');	
			if ((this.readyState === 4) && (this.status === 404))
				console.log('Page not found');
			if ((this.readyState === 4) && (this.status === 0))
				console.log('Bad Request');
			if ((this.readyState === 4) && (this.status === 0))
				console.log('Internal Server Error');
			
			
		}
	}
}

//A shortcut for using the previous one.
class Retrieve extends Update
{
	constructor(con)
	{
		super(con, null, "retrieve.php");
	}
}


//This class kind of gets mingled up with the business (game) logic. That is because the class captures the player identity
//and makes sure it does not get changed. That should actually not be the case, but it is now a side-effect: normally what we
//would have here would not be identity (business logic) but a _session_ (technical) and the session would then be bound to
//an identity. To simplify the code we did not use a session in this exercise at all and there are only two identities!
class ServerConnection
{
	statestring = "";
	prevstate = "";
	sentstate = "";
	id = "";


	//In EXERCISE 4 You very likely want a callback to live in here!

	//...but in EXERCISE 4 you also want to relay a callback from the business (game) logic to this point in the program?
	updateState(data)
	{
		this.sentstate = data;
		//Note: URL optional!
		new Update(this, data);
	}

	updateUi(){
		if (this.prevstate != this.statestring)
		{
			console.log("State changed : " + this.prevstate + " --> " + this.statestring);
			this.prevstate = this.statestring;
			if (this.statestring === this.sentstate)
			{
				if (this.id === "")
				{
					this.id = this.sentstate.substring(0,1);
					console.log("The player took part in the game by making a move");
					console.log("The player is " + this.id);
					console.log("The move was made");
				}
				return "B" + this.statestring;
			}
			if (this.statestring === "O_________")
			{
				this.id = "";
				this.sentstate = "";
			}
			return this.statestring;
		}
		else
		{
			new Retrieve(this, null, null);
			return "NONEWS";
		}
	}

	//...and in EXERCISE 4 the callback from business logic activates here? Then parts of the below might become redundant and
	//good riddance!
	fetchState()//initially, statestring and prevstate are both empty => retrieve.php got called => set statestring to O_________
	{
		if (this.prevstate != this.statestring)
		{
			console.log("State changed : " + this.prevstate + " --> " + this.statestring);
			this.prevstate = this.statestring;
			if (this.statestring === this.sentstate)
			{
				if (this.id === "")
				{
					this.id = this.sentstate.substring(0,1);
					console.log("The player took part in the game by making a move");
					console.log("The player is " + this.id);
					console.log("The move was made");
				}
				return "B" + this.statestring;
			}
			if (this.statestring === "O_________")
			{
				this.id = "";
				this.sentstate = "";
			}
			return this.statestring;
		}
		else
		{
			new Retrieve(this, null, null);
			return "NONEWS";
		}
	}

	currentIdentity()
	{
		return this.id;
	}

	restartSession()
	{
		this.id = "";
		this.sentstate = "";
		new Update(this, "O_________");
	}

	//"Move"? Yep, another slip of business logic, but you can get rid of it in exercise 4.
	previousMoveBy()
	{
		return this.statestring.substring(0,1);
	}

}


