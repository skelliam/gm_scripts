// ==UserScript==
// @name        Mint Date Range
// @namespace   http://leftbraintinkering.blogspot.com/
// @description Query by date range in Mint
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @include     https://wwws.mint.com/transaction.event*
// @version     1
// ==/UserScript==


//Put date pickers on the screen for start date/end date
//User selects dates
//User presses "go"
//URL is altered to add start end date
//if URL already contains start end date, it should be updated


var cssText = 
  "input.di {\n" +
  "  font-family: sans-serif;\n" +
  "  font-size: 0.9em;\n" +
  "  height: 0.9em;" +
  "  width: 6em;" +
  "}\n\n" +

  "div#account-summary {\n" +
  "   clear: right !important;" +
  "   padding: 2px;" +
  "}\n\n";


function insertDatePickers() {
   //create a cpl of date pickers with jQuery
   var txtStartDate = $("<input class='di' value='1/1/2012' name='startdate' title='Enter start date format: mm/dd/yyyy'>");   
   var txtEndDate = $("<input class='di' value='12/31/2012' name='enddate' title='Enter end date format: mm/dd/yyyy'>");   
   //find class="search-container" and insert date picker 
   $(".search-container").append("<b>Start Date: </b>", txtStartDate, "<b>End Date: </b>", txtEndDate);
}

function main() {
   GM_addStyle( cssText );
   insertDatePickers();
}

main();
