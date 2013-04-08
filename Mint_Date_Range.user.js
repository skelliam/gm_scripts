// ==UserScript==
// @name        Mint Date Range
// @namespace   http://leftbraintinkering.blogspot.com/
// @description Query by date range in Mint
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @require       http://raw.github.com/skelliam/Datejs/next/build/date-en-US.js
// @include     https://wwws.mint.com/transaction.event*
// @grant
// @version     1
// ==/UserScript==


//Put date pickers on the screen for start date/end date
//User selects dates
//User presses "go"
//URL is altered to add start end date
//if URL already contains start end date, it should be updated

var jStartDate = null;
var jEndDate = null;


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

function updateURL() {
   //whenever a date is changed, validate the dates and update the URL
   var searchstring = "";

   startdateval = jStartDate.val();
   enddateval = jEndDate.val();

   startdate = Date.parse(startdateval);
   enddate = Date.parse(enddateval);

   if (    (startdateval == "") 
        || (enddateval == "")
        || (startdateval == null)
        || (enddateval == null) 
      ) 
   {  /* either date blank */
      return;
   }
   else if (enddate < startdate) {
      alert("End date is before start date.");
      return;
   }
   else if (startdate > enddate) {
      alert("Start date is after end date.");
      return;
   }

   //everything good up until now -- let's update the URL
   searchstring += "?startDate=" + startdate.toString('MM/dd/yyyy');
   searchstring += "&endDate=" + enddate.toString('MM/dd/yyyy');
   document.location.search = searchstring;
}

function validateDate(jObj) {
   var date = Date.parse(jObj.val());

   if (date != null) {
      jObj.css("background-color", "#DEEFE9");  //this is the Mint background color :)
      jObj.prop('title', "Date OK: " + date.toString('dddd, MMMM d, yyyy'));
   }
   else {
      if (jObj.val()=="") {
         jObj.css("background-color", "#FFFFFF");  //this color indicates something wrong with the date
         jObj.prop('title', "Enter a date.");
      } 
      else {
         jObj.css("background-color", "#F9DEDE");  //this color indicates something wrong with the date
         jObj.prop('title', "Invalid date, please fix me.");
      }
   }

   updateURL();  /* update the URL with dates */
}

function startDateChanged() {
   validateDate(jStartDate);
}

function endDateChanged() {
   validateDate(jEndDate);
}


function insertDatePickers() {
   //create the date pickers (jQuery syntax)
   //jStartDate = $("<input class='di' value='1/1/2012' type='text' name='startdate' title='Enter start date format: mm/dd/yyyy'/>");   
   //jEndDate = $("<input class='di' value='12/31/2012' type='text' name='enddate' title='Enter end date format: mm/dd/yyyy'/>");   

   jStartDate = $("<input class='di' id='startdate' title='Enter a date.'/>");   
   jEndDate = $("<input class='di' id='enddate' title='Enter a date.'/>");   
   
   //add onchange events with jQuery syntax
   jStartDate.change(startDateChanged);
   jEndDate.change(endDateChanged);

   //find class="search-container" (jQuery syntax) and insert date fields
   $(".search-container").append("<b>Start Date: </b>", jStartDate, "<b>End Date: </b>", jEndDate);
}

function main() {
   //cross-browser support added from: http://userscripts.org/groups/51
   if (typeof GM_addStyle == 'undefined') {
       var GM_addStyle = function(css) {
           var head = document.getElementsByTagName('head')[0], style = document.createElement('style');
           if (!head) return;
           style.type = 'text/css';
           style.textContent = css;
           head.appendChild(style);
       }
   }

   GM_addStyle( cssText );
   insertDatePickers();
}

main();
