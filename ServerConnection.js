"use strict";

class Update extends XMLHttpRequest
{
	constructor(con, data, url)
	{
		super();
		this.myCon = con;
		this.onreadystatechange = this.handleResponse;
		let senddata = "";
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
				/*The process of coming up with this SINGLE line was not easy. At first I started to create a new function which gets called
				every time updateState() gets called. The function tried to update all of the properties that fetchState() 
				tries to update, then call updateTable with the props that it updated. This was a failure because
				the updated state and values in updateState was not in sync, therefore break updateTable() completely.
				
				Then I tried to create another function that lives in here, handleResponse(). The function tries to do the same as the previous one
				but by passing the newly-updated statestring back to the business layer. That statestring then can be used to refresh
				the table, but players got stuck after making their first move, due to the alreadyClicked value haven't got
				updated yet.
				
				After long time messing with that function - because it was too close to expected behaviour - I realised that
				alreadyClicked gets updated in timercode(). I then tried to call it here where statestring finish updating. 
				Soooo if I'm not mistaken, the UI got updated right when statestring finishes updating instead of waiting for timeout
				SOLVE!??!? */
				timercode()
			}

		}
		else
		{
			//is logging enough?
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

class Retrieve extends Update
{
	constructor(con)
	{
		super(con, null, "retrieve.php");
	}
}


class ServerConnection
{
	statestring = "";
	prevstate = "";
	sentstate = "";
	id = "";

	updateState(data)
	{
		this.sentstate = data;
		//Note: URL optional!
		new Update(this, data);
	}
	//initially, statestring and prevstate are both empty => retrieve.php got called => set statestring to O_________
	fetchState()
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
	previousMoveBy()
	{
		return this.statestring.substring(0,1);
	}

}


