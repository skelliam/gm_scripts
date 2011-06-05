// ==UserScript==
// @name           Powers Recipe Calculator Mods
// @namespace      http://www.google.com/
// @description    Enhance Ken Powers' excellent brewer's recipe calculator.
// @include        http://powersbrewery.home.comcast.net/~powersbrewery/mastercalculator.html
// ==/UserScript==

// Unit conversions
var ms_day = 1000 * 60 * 60 * 24;
var oz_qt = 32;
var qt_gal = 4;
var cuin_gal = 0.004329;

// constants
var hlt_diam_in = (20 + (5/16));
var boil_diam_in = 19.8125;

// user options
var SHOW_HLT_INCHES = 1;
var SHOW_BOIL_INCHES = 1;
var USE_SUMMARY_PANEL = 1;

// brewery 1 settings
var EVAP_RATE1 = '9.73';
var THERMAL_CAP1 = '0.26';
var BOIL_LOSS1 = '1.0';
var LAUTER_DEAD_GAL1 = '0.1';
var MASH_DEAD_GAL1 = '0.1875';
var MASH_WEIGHT1 = '24';
var ABSORB_FACT1 = '0.12'; 

// form capture
var frmMash = document.forms.namedItem("Mash");
var frmGoog = document.createElement('form');

// global variables
var SUMMARY_PANEL_STATE = 1;
var HLT_INCHES;
var BOIL_INCHES;
var BOIL_GALS;
var STRIKE_QTS;
var STRIKE_GALS;
var STRIKE_TEMP_F;
var GRAIN_LBS;
var SPARGE_GALS;
var SPARGE_INCHES;
var MASH_TEMP_F;


// Colormap discovered @ http://www.franklinbrew.org/brewinfo/colorchart.html
// (Allegedly pulled from ProMash)
var cmap = [ "FFFFFF", 
             "F3F993", "F5F75C", "F6F513", "EAE615", "E0D01B", 
             "D5BC26", "CDAA37", "C1963C", "BE8C3A", "BE823A", 
             "C17A37", "BF7138", "BC6733", "B26033", "A85839", 
             "985336", "8D4C32", "7C452D", "6B3A1E", "5D341A", 
             "4E2A0C", "4A2727", "361F1B", "261716", "231716", 
             "19100F", "16100F", "120D0C", "100B0A", "050B0A", 
             "000000" ];

const ACTIONS = {
   //d: update with my brewery defaults
   68: function() {
      updateDefaultParams();   
   },
   //l: load recipe
   76: function() {
      unsafeWindow.DistributeData();
   },
   //p: show/hide summary panel
   80: function() {
      SUMMARY_PANEL_STATE ^= 1;
      updateSummaryPanel();
   },
   //s: save recipe
   83: function() {
      unsafeWindow.OpenNewWindowthree();
   },
};

const SHIFT_ACTIONS = {
   //shift-d: update with secondary brewery defaults (Igloo cooler)
   68: function() {
      updateSecondaryDefaultParams();
   }
};

// Values for the recipe card 
// "_" at beginning of name is a select field and needs a lookup
var recipevalues = new Object();
var recipekeys = {
   "brewers": "BREWER", 
   "brew_date": "DATE", 
   "_brew_style": "STYLE",
   "brew_name": "RECIPE", 
   "og": "ACTGRAV", 
   "fg": "ACTFG",
   "xfer_to_keg": "SECONDARYDATE", 
   "xfer_to_sec": "PRIMARYDATE",
   "eff": "EFF", 
   "abv": "ACTAV", 
   "calories": "ACTCAL",
   "IBU": "HBU", 
   "color_srm": "SRMTOTAL2", 
   "_hop1": "FirstHops",
   "_hop2": "SecondHops", 
   "_hop3": "ThirdHops", 
   "_hop4": "FourthHops",
   "_hop5": "FifthHops", 
   "_hop6": "SixthHops", 
   "ozhop1": "OZ1",
   "ozhop2": "OZ2", 
   "ozhop3": "OZ3", 
   "ozhop4": "OZ4", 
   "ozhop5": "OZ5",
   "ozhop6": "OZ6", 
   "timehop1": "TIME1", 
   "timehop2": "TIME2",
   "timehop3": "TIME3", 
   "timehop4": "TIME4", 
   "timehop5": "TIME5",
   "timehop6": "TIME6", 
   "_ing1": "FirstIngredient",
   "_ing2": "SecondIngredient", 
   "_ing3": "ThirdIngredient",
   "_ing4": "FourthIngredient", 
   "_ing5": "FifthIngredient",
   "_ing6": "SixthIngredient", 
   "_ing7": "SeventhIngredient",
   "_ing8": "EighthIngredient", 
   "lbing1": "LB1", 
   "lbing2": "LB2",
   "lbing3": "LB3", 
   "lbing4": "LB4", 
   "lbing5": "LB5", 
   "lbing6": "LB6",
   "lbing7": "LB7", 
   "lbing8": "LB8", 
   "_yeast": "STRAIN",
};

/* Datepicker is (c)Julian Robichaux
 * see: http://www.nsftools.com/tips/DatePickerTest.htm */


/* ---- BEGIN DATEPICKER CODE (c)Julian Robichaux ---- */
/* A string representing all of the variables */
var datepickerVAR = 'var datePickerDivID = "datepicker"; var iFrameDivID = "datepickeriframe"; var dayArrayShort = new Array("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"); var dayArrayMed = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"); var dayArrayLong = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"); var monthArrayShort = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"); var monthArrayMed = new Array("Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"); var monthArrayLong = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"); var defaultDateSeparator = "/"; var defaultDateFormat = "mdy"; var dateSeparator = defaultDateSeparator; var dateFormat = defaultDateFormat; ';

function displayDatePicker(dateFieldName, displayBelowThisObject, dtFormat, dtSep) { var targetDateField = document.getElementsByName (dateFieldName).item(0); if (!displayBelowThisObject) displayBelowThisObject = targetDateField; if (dtSep) dateSeparator = dtSep; else dateSeparator = defaultDateSeparator; if (dtFormat) dateFormat = dtFormat; else dateFormat = defaultDateFormat; var x = displayBelowThisObject.offsetLeft; var y = displayBelowThisObject.offsetTop + displayBelowThisObject.offsetHeight ; var parent = displayBelowThisObject; while (parent.offsetParent) { parent = parent.offsetParent; x += parent.offsetLeft; y += parent.offsetTop ; } drawDatePicker(targetDateField, x, y); }

function drawDatePicker(targetDateField, x, y) { var dt = getFieldDate(targetDateField.value ); if (!document.getElementById(datePickerDivID)) { var newNode = document.createElement("div"); newNode.setAttribute("id", datePickerDivID); newNode.setAttribute("class", "dpDiv"); newNode.setAttribute("style", "visibility: hidden;"); document.body.appendChild(newNode); } var pickerDiv = document.getElementById(datePickerDivID); pickerDiv.style.position = "absolute"; pickerDiv.style.left = x + "px"; pickerDiv.style.top = y + "px"; pickerDiv.style.visibility = (pickerDiv.style.visibility == "visible" ? "hidden" : "visible"); pickerDiv.style.display = (pickerDiv.style.display == "block" ? "none" : "block"); pickerDiv.style.zIndex = 10000; refreshDatePicker(targetDateField.name, dt.getFullYear(), dt.getMonth(), dt.getDate()); }

function refreshDatePicker(dateFieldName, year, month, day) { var thisDay = new Date(); if ((month >= 0) && (year > 0)) { thisDay = new Date(year, month, 1); } else { day = thisDay.getDate(); thisDay.setDate(1); } var crlf = "\r\n"; var TABLE = "<table cols=7 class='dpTable'>" + crlf; var xTABLE = "</table>" + crlf; var TR = "<tr class='dpTR'>"; var TR_title = "<tr class='dpTitleTR'>"; var TR_days = "<tr class='dpDayTR'>"; var TR_todaybutton = "<tr class='dpTodayButtonTR'>"; var xTR = "</tr>" + crlf; var TD = "<td class='dpTD' onMouseOut='this.className=\"dpTD\";' onMouseOver=' this.className=\"dpTDHover\";' "; var TD_title = "<td colspan=5 class='dpTitleTD'>"; var TD_buttons = "<td class='dpButtonTD'>"; var TD_todaybutton = "<td colspan=7 class='dpTodayButtonTD'>"; var TD_days = "<td class='dpDayTD'>"; var TD_selected = "<td class='dpDayHighlightTD' onMouseOut='this.className=\"dpDayHighlightTD\";' onMouseOver='this.className=\"dpTDHover\";' "; var xTD = "</td>" + crlf; var DIV_title = "<div class='dpTitleText'>"; var DIV_selected = "<div class='dpDayHighlight'>"; var xDIV = "</div>"; var html = TABLE; html += TR_title; html += TD_buttons + getButtonCode(dateFieldName, thisDay, -1, "&lt;") + xTD; html += TD_title + DIV_title + monthArrayLong[ thisDay.getMonth()] + " " + thisDay.getFullYear() + xDIV + xTD; html += TD_buttons + getButtonCode(dateFieldName, thisDay, 1, "&gt;") + xTD; html += xTR; html += TR_days; for(i = 0; i < dayArrayShort.length; i++) html += TD_days + dayArrayShort[i] + xTD; html += xTR; html += TR; for (i = 0; i < thisDay.getDay(); i++) html += TD + "&nbsp;" + xTD; do { dayNum = thisDay.getDate(); TD_onclick = " onclick=\"updateDateField('" + dateFieldName + "', '" + getDateString(thisDay) + "');\">"; if (dayNum == day) html += TD_selected + TD_onclick + DIV_selected + dayNum + xDIV + xTD; else html += TD + TD_onclick + dayNum + xTD; if (thisDay.getDay() == 6) html += xTR + TR; thisDay.setDate(thisDay.getDate() + 1); } while (thisDay.getDate() > 1) if (thisDay.getDay() > 0) { for (i = 6; i > thisDay.getDay(); i--) html += TD + "&nbsp;" + xTD; } html += xTR; var today = new Date(); var todayString = "Today is " + dayArrayMed[today.getDay()] + ", " + monthArrayMed[ today.getMonth()] + " " + today.getDate(); html += TR_todaybutton + TD_todaybutton; html += "<button class='dpTodayButton' onClick='refreshDatePicker(\"" + dateFieldName + "\");'>this month</button> "; html += "<button class='dpTodayButton' onClick='updateDateField(\"" + dateFieldName + "\");'>close</button>"; html += xTD + xTR; html += xTABLE; document.getElementById(datePickerDivID).innerHTML = html; adjustiFrame(); }

function getButtonCode(dateFieldName, dateVal, adjust, label) { var newMonth = (dateVal.getMonth () + adjust) % 12; var newYear = dateVal.getFullYear() + parseInt((dateVal.getMonth() + adjust) / 12); if (newMonth < 0) { newMonth += 12; newYear += -1; } return "<button class='dpButton' onClick='refreshDatePicker(\"" + dateFieldName + "\", " + newYear + ", " + newMonth + ");'>" + label + "</button>"; }

function getDateString(dateVal) { var dayString = "00" + dateVal.getDate(); var monthString = "00" + (dateVal.getMonth()+1); dayString = dayString.substring(dayString.length - 2); monthString = monthString.substring(monthString.length - 2); switch (dateFormat) { case "dmy" : return dayString + dateSeparator + monthString + dateSeparator + dateVal.getFullYear(); case "ymd" : return dateVal.getFullYear() + dateSeparator + monthString + dateSeparator + dayString; case "mdy" : default : return monthString + dateSeparator + dayString + dateSeparator + dateVal.getFullYear(); } }

function getFieldDate(dateString) { var dateVal; var dArray; var d, m, y; try { dArray = splitDateString(dateString); if (dArray) { switch (dateFormat) { case "dmy" : d = parseInt(dArray[0], 10); m = parseInt(dArray[1], 10) - 1; y = parseInt(dArray[2], 10); break; case "ymd" : d = parseInt(dArray[2], 10); m = parseInt(dArray[1], 10) - 1; y = parseInt(dArray[0], 10); break; case "mdy" : default : d = parseInt(dArray[1], 10); m = parseInt(dArray[0], 10) - 1; y = parseInt(dArray[2], 10); break; } dateVal = new Date(y, m, d); } else if (dateString) { dateVal = new Date(dateString); } else { dateVal = new Date(); } } catch(e) { dateVal = new Date(); } return dateVal; } 

function splitDateString(dateString) { var dArray; if (dateString.indexOf("/") >= 0) dArray = dateString.split("/"); else if (dateString.indexOf(".") >= 0) dArray = dateString.split("."); else if (dateString.indexOf("-") >= 0) dArray = dateString.split("-"); else if (dateString.indexOf("\\") >= 0) dArray = dateString.split("\\"); else dArray = false; return dArray; }

function updateDateField(dateFieldName, dateString) { var targetDateField = document.getElementsByName (dateFieldName).item(0); if (dateString) targetDateField.value = dateString; var pickerDiv = document.getElementById(datePickerDivID); pickerDiv.style.visibility = "hidden"; pickerDiv.style.display = "none"; adjustiFrame(); targetDateField.focus(); if ((dateString) && (typeof(datePickerClosed) == "function")) datePickerClosed(targetDateField); } 

function adjustiFrame(pickerDiv, iFrameDiv) { var is_opera = (navigator.userAgent.toLowerCase().indexOf("opera") != -1); if (is_opera) return; try { if (!document.getElementById(iFrameDivID)) { var newNode = document.createElement("iFrame"); newNode.setAttribute("id", iFrameDivID); newNode.setAttribute("src", "javascript:false;"); newNode.setAttribute("scrolling", "no"); newNode.setAttribute ("frameborder", "0"); document.body.appendChild(newNode); } if (!pickerDiv) pickerDiv = document.getElementById(datePickerDivID); if (!iFrameDiv) iFrameDiv = document.getElementById(iFrameDivID); try { iFrameDiv.style.position = "absolute"; iFrameDiv.style.width = pickerDiv.offsetWidth; iFrameDiv.style.height = pickerDiv.offsetHeight ; iFrameDiv.style.top = pickerDiv.style.top; iFrameDiv.style.left = pickerDiv.style.left; iFrameDiv.style.zIndex = pickerDiv.style.zIndex - 1; iFrameDiv.style.visibility = pickerDiv.style.visibility ; iFrameDiv.style.display = pickerDiv.style.display; } catch(e) { } } catch (ee) { } }

/* ---- END DATEPICKER CODE (c)Julian Robichaux ---- */

/* This function will be also embedded into the page */
function displayProperDatePicker(event) {
   var mytargetname = event.target.name;
   displayDatePicker(mytargetname);
}

function insertAfter(newNode, node) {
   return node.parentNode.insertBefore(newNode, node.nextSibling);
}

function remove(element) {
   element.parentNode.removeChild(element);
}

/* keyHandler function from Gmail Macros script,
 * written by Mihai Parparita (mihai@persistent.info) */
function keyHandler(event) {
  // Apparently we still see Firefox shortcuts like control-T for a new tab - 
  // checking for modifiers lets us ignore those
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  
  // We also don't want to interfere with regular user typing
  if (event.target && event.target.nodeName) {
    var targetNodeName = event.target.nodeName.toLowerCase();
    if (targetNodeName == "textarea" ||
        (targetNodeName == "input" && event.target.type &&
         (event.target.type.toLowerCase() == "text" ||
          event.target.type.toLowerCase() == "file"))) {
      return;
    }
  }
  
  var k = event.keyCode;

  if (event.shiftKey && (k in SHIFT_ACTIONS)) {
     SHIFT_ACTIONS[k]();
     return;
  }
  else if (k in ACTIONS) {
    ACTIONS[k]();
    return;
  }

  return;
}

function getCircleAreaFromRadius(radius) {
   var r2 = Math.pow(radius, 2);
   var area = Math.PI * r2;
   return area;
}

function getKettleInchesFromGals(gals, kettle_diam_in) {
   var kettle_area = getCircleAreaFromRadius(kettle_diam_in/2);
   var kettle_inches = (gals/cuin_gal) / kettle_area;
   kettle_inches = Math.round(kettle_inches * 100)/100;  // two decimal places
   return kettle_inches;
}

function getKettleGalsFromInches() {
   /* TODO */
   return;
}

function initGlobalVariables() {
   var inpMASHWAT = frmMash.elements.namedItem("MASHWAT");
   var inpBOILWAT = frmMash.elements.namedItem("PREBOIL");
   var inpSTRIKE = frmMash.elements.namedItem("STRIKE");
   var inpGRAIN = frmMash.elements.namedItem("GRAIN");
   var inpSPARGE = frmMash.elements.namedItem("SPARGETOTAL");
   var inpBOIL_TIME = frmMash.elements.namedItem("TIME");
   var inpMASH_TEMP = frmMash.elements.namedItem("FINAL");

   BOIL_GALS = inpBOILWAT.value;
   STRIKE_QTS = inpMASHWAT.value;
   STRIKE_GALS = STRIKE_QTS / qt_gal;

   HLT_INCHES = getKettleInchesFromGals(STRIKE_GALS, hlt_diam_in);

   BOIL_INCHES = getKettleInchesFromGals(BOIL_GALS, boil_diam_in);

   STRIKE_TEMP_F = inpSTRIKE.value;

   GRAIN_LBS = inpGRAIN.value;

   SPARGE_GALS = inpSPARGE.value;
   SPARGE_INCHES = getKettleInchesFromGals(SPARGE_GALS, hlt_diam_in);

   BOIL_TIME_MINS = inpBOIL_TIME.value;

   MASH_TEMP_F = inpMASH_TEMP.value;
}

function writeStrikeInGals() {
   //MASHWAT is the name of the strike water quantity
   var inpMASHWAT = frmMash.elements.namedItem("MASHWAT");
   //console.log(inpMASHWAT.parentNode.nextSibling.textContent);
   if (SHOW_HLT_INCHES) {
      inpMASHWAT.parentNode.nextSibling.textContent = "qts  (" + STRIKE_GALS + " gals)" +
                                                      "= (" + HLT_INCHES + " HLT inches)";
   }
   else {
      inpMASHWAT.parentNode.nextSibling.textContent = "qts  (" + STRIKE_GALS + " gals)";
   }
}

function writeBoilInches() {
   var inpBOILWAT = frmMash.elements.namedItem("PREBOIL");
   inpBOILWAT.nextSibling.textContent = "gal  (" + BOIL_INCHES + " BOIL inches)";
}

function insertTotalMashVolume() {
   var inpSPARGETOTAL = frmMash.elements.namedItem("SPARGETOTAL");
   //final row in mash params:  element     .    td    .   tr
   var trMashParamsFinalRow = inpSPARGETOTAL.parentNode.parentNode;

   var trNewRow = document.createElement('tr');
   var tdCell1 = document.createElement('td');
   tdCell1.setAttribute('width', '15%');  //maybe need to use style?
   tdCell1.innerHTML = '<p align="left">Required Mash Tun Vol</p>';
   var tdCell2 = document.createElement('td');
   tdCell2.setAttribute('width', '14%');
   tdCell2.innerHTML = '<input readonly="readonly" style="background-color: rgb(243,249,147); color: rgb(204, 51, 0); font-size: 12px;" size="6" value="0.0" name="wjsMASHTUNVOL"/>gal';
   var tdCell3 = document.createElement('td');
   tdCell3.setAttribute('width', '25%');
   var tdCell4 = document.createElement('td');
   tdCell4.setAttribute('width', '18%');

   trNewRow.appendChild(tdCell1);
   trNewRow.appendChild(tdCell2);
   trNewRow.appendChild(tdCell3);
   trNewRow.appendChild(tdCell4);

   insertAfter(trNewRow, trMashParamsFinalRow);

   // update frmMash
   frmMash = document.forms.namedItem("Mash");
}

function calcTotalMashVolume() {
   var strike_qts = frmMash.elements.namedItem("MASHWAT").value;
   var mashratio = frmMash.elements.namedItem("THICK").value;  //qt/lb
   var displ_factor = 47.3;  // 42 oz displaced @ 1 qt/lb ratio

   mashwater_qts = mashratio * GRAIN_LBS;  //qts
   displwater_qts = (displ_factor * GRAIN_LBS) / oz_qt;  //qts displaced @ 1:1 ratio
   your_displ_qts = (mashratio - 1.0) * GRAIN_LBS;  //qts
   total_displ = (displwater_qts + your_displ_qts) / qt_gal; //total displaced volume in gals

   //console.log('Mash vol required: ', total_displ, 'gals');
   return total_displ;
}

function writeTotalMashVolume() {
   frmMash.elements.namedItem("wjsMASHTUNVOL").value = calcTotalMashVolume().toFixed(2);
}

function insertColorSwatch() {

   var myelements = document.getElementsByName("pic1");
   var colorimage = myelements[0]

   // DO NOT REMOVE IMAGE because original script needs it...
   // Hide it instead!  
   colorimage.setAttribute("style", "visibility: hidden;");
   colorimage.setAttribute("height", "0");
   colorimage.setAttribute("width", "0");

   // Create new input element for the color swatch
   divBeerColor = document.createElement('div');
   divBeerColor.innerHTML = '<input readonly="readonly" value="" onchange="CalculateAll()" style="background-color: rgb(153, 204, 204); color: rgb(0, 0, 0); font-size: 12px;" size="6" name="wjsBEERCOLOR"/>';

   // append the new input element
   colorimage.parentNode.appendChild(divBeerColor);

   // update frmMash
   frmMash = document.forms.namedItem("Mash");
}

function insertGoogleForm() {
   // Create a new form to submit content to Google Spreadsheets
   // Need to get recipe string?
   frmGoog = document.createElement('form');
   frmGoog.setAttribute('action', 'http://spreadsheets.google.com/formResponse?key=pTXQEcb217El3OeFv-4X8Qg');
   frmGoog.setAttribute('method', 'POST');
   frmGoog.innerHTML = '<br><div class="errorbox-good"><div class="ss-form-entry"><label for="entry_1" class="ss-q-title">RecipeText</label><label for="entry_1" class="ss-q-help"></label> <input type="text" name="entry.1.single" value="" id="entry_1" class="ss-q-short"></div></div><input type="submit" value="Submit">';

   insertAfter(frmGoog, frmMash);
}

function updateGoogInput() {
   frmGoog.elements.namedItem('entry.1.single').value = getRecipeString();
}


function getLimitedRecipeColor() {
   // Get current color value from the recipe
   var color_srm = frmMash.elements.namedItem("SRMTOTAL2").value;

   // Limit current color value to 1-30
   color_srm < 1  ? color_srm = 1  : color_srm = color_srm;
   color_srm > 30 ? color_srm = 30 : color_srm = color_srm;

   return color_srm;
}

function updateColorSwatch() {
   // limit the color SRM to between 1 and 30
   var color_srm = getLimitedRecipeColor();
   // Get current color rgb
   var color_rgb = "#" + cmap[color_srm];
   color_swatch = frmMash.elements.namedItem("wjsBEERCOLOR");
   color_swatch.setAttribute("style", "background-color: " + color_rgb + ";");
}

function updateTitle() {
   var recipe_title = frmMash.elements.namedItem("RECIPE").value;
   if (recipe_title != "")
      document.title = recipe_title;
   else
      document.title = "The Brewer's Recipe Calculator";
}

/* This function will update the parameters with this brewery's default values */
function updateDefaultParams() {
   alert("About to overwrite settings with brewery defaults...");
   var f = frmMash;
   f.elements.namedItem('EVAPORATE').value = EVAP_RATE1;        /* evaporation rate while boiling */
   f.elements.namedItem('THERMAL').value = THERMAL_CAP1;           /* thermal capacity of mash tun */
   f.elements.namedItem('BOILLOSS').value = BOIL_LOSS1;        /* lost space in the boil kettle */
   f.elements.namedItem('LOSS3').value = LAUTER_DEAD_GAL1;           /* lauter tun dead space */
   f.elements.namedItem('LOSS2').value = MASH_DEAD_GAL1;           /* mash tun dead space */
   f.elements.namedItem('WEIGHT').value = MASH_WEIGHT1;            /* mash tun weight */
   f.elements.namedItem('ABSORBFACT').value = ABSORB_FACT1;     /* grain absorption factor */
   unsafeWindow.CalculateAll();
}

function updateSecondaryDefaultParams() {
   alert("About to overwrite settings with secondary\nbrewery defaults (big cooler mash tun)...");
   var f = frmMash;
   f.elements.namedItem('EVAPORATE').value = '13';        /* Evaporation rate while boiling */
   f.elements.namedItem('THERMAL').value = '2.8';         /* thermal capacity of mash tun */
   f.elements.namedItem('BOILLOSS').value = '1.0';        /* lost space in boil kettle */
   f.elements.namedItem('LOSS3').value = '0.1';           /* lauter tun dead space */
   f.elements.namedItem('LOSS2').value = '0.1';           /* mash tun dead space */
   f.elements.namedItem('WEIGHT').value = '5';            /* mash tun weight */
   f.elements.namedItem('ABSORBFACT').value = '0.12';     /* grain absorption factor */
   unsafeWindow.CalculateAll();
}


function updateDayCounts() {
   // Automatically calculate days in primary and secondary
   var brewdate = unsafeWindow.getFieldDate(frmMash.elements.namedItem("DATE").value);
   var secondarydate = unsafeWindow.getFieldDate(frmMash.elements.namedItem("PRIMARYDATE").value);
   var kegdate = unsafeWindow.getFieldDate(frmMash.elements.namedItem("SECONDARYDATE").value);

   var primary_days = Math.ceil((secondarydate.getTime() - brewdate.getTime())/(ms_day)); 
   var secondary_days = Math.ceil((kegdate.getTime() - secondarydate.getTime())/(ms_day));

   console.log(primary_days, secondary_days);

   frmMash.elements.namedItem("PRIMARYDAYS").value = primary_days;
   frmMash.elements.namedItem("SECONDARYDAYS").value = secondary_days;
}

/* This is not used for anything (yet) */
function getRecipeString() {
   var f = frmMash;
   var arrRecipe = [
      f.elements.namedItem('BREWER').value,
      f.elements.namedItem('RECIPE').value,
      f.elements.namedItem('DATE').value,
      f.elements.namedItem('STYLE').selectedIndex,
      f.elements.namedItem('STYLE').value,
      f.elements.namedItem('BATCH').value,
      f.elements.namedItem('TIME').value,
      f.elements.namedItem('EVAPORATE').value,
      f.elements.namedItem('SHRINKAGE').value,
      f.elements.namedItem('EFF').value,
      f.elements.namedItem('RESIZE').value,
      f.elements.namedItem('WEIGHT').value,
      f.elements.namedItem('THERMAL').value,
      f.elements.namedItem('BOILLOSS').value,
      f.elements.namedItem('LOSS3').value, /* lauter tun dead space */
      f.elements.namedItem('LOSS2').value, /* mash tun dead space */
      f.elements.namedItem('FERMLOSS').value,
      f.elements.namedItem('FirstIngredient').selectedIndex,
      f.elements.namedItem('FirstIngredient').value,
      f.elements.namedItem('LB1').value,
      f.elements.namedItem('SecondIngredient').selectedIndex,
      f.elements.namedItem('SecondIngredient').value,
      f.elements.namedItem('LB2').value,
      f.elements.namedItem('ThirdIngredient').selectedIndex,
      f.elements.namedItem('ThirdIngredient').value,
      f.elements.namedItem('LB3').value,
      f.elements.namedItem('FourthIngredient').selectedIndex,
      f.elements.namedItem('FourthIngredient').value,
      f.elements.namedItem('LB4').value,
      f.elements.namedItem('FifthIngredient').selectedIndex,
      f.elements.namedItem('FifthIngredient').value,
      f.elements.namedItem('LB5').value,
      f.elements.namedItem('SixthIngredient').selectedIndex,
      f.elements.namedItem('SixthIngredient').value,
      f.elements.namedItem('LB6').value,
      f.elements.namedItem('SeventhIngredient').selectedIndex,
      f.elements.namedItem('SeventhIngredient').value,
      f.elements.namedItem('LB7').value,
      f.elements.namedItem('EighthIngredient').selectedIndex,
      f.elements.namedItem('EighthIngredient').value,
      f.elements.namedItem('LB8').value,
      f.elements.namedItem('STRAIN').selectedIndex,
      f.elements.namedItem('STRAIN').value,
      f.elements.namedItem('FirstHops').selectedIndex,
      f.elements.namedItem('OZ1').value,
      f.elements.namedItem('TIME1').value,
      f.elements.namedItem('First').selectedIndex,
      f.elements.namedItem('First').value,
      f.elements.namedItem('SecondHops').selectedIndex,
      f.elements.namedItem('OZ2').value,
      f.elements.namedItem('TIME2').value,
      f.elements.namedItem('Second').selectedIndex,
      f.elements.namedItem('Second').value,
      f.elements.namedItem('ThirdHops').selectedIndex,
      f.elements.namedItem('OZ3').value,
      f.elements.namedItem('TIME3').value,
      f.elements.namedItem('Third').selectedIndex,
      f.elements.namedItem('Third').value,
      f.elements.namedItem('FourthHops').selectedIndex,
      f.elements.namedItem('OZ4').value,
      f.elements.namedItem('TIME4').value,
      f.elements.namedItem('Fourth').selectedIndex,
      f.elements.namedItem('Fourth').value,
      f.elements.namedItem('FifthHops').selectedIndex,
      f.elements.namedItem('OZ5').value,
      f.elements.namedItem('TIME5').value,
      f.elements.namedItem('Fifth').selectedIndex,
      f.elements.namedItem('Fifth').value,
      f.elements.namedItem('SixthHops').selectedIndex,
      f.elements.namedItem('OZ6').value,
      f.elements.namedItem('TIME6').value,
      f.elements.namedItem('Sixth').selectedIndex,
      f.elements.namedItem('Sixth').value,
      f.elements.namedItem('IBUMETHOD').selectedIndex,
      f.elements.namedItem('GTEMP').value,
      f.elements.namedItem('FINAL').value,
      f.elements.namedItem('THICK').value,
      f.elements.namedItem('ACTGRAV').value,
      f.elements.namedItem('ACTFG').value,
      f.elements.namedItem('ACTFINAL').value,
      f.elements.namedItem('BREWNOTES').value,
      f.elements.namedItem('PRIMARYDATE').value,
      f.elements.namedItem('PRIMARYDAYS').value,
      f.elements.namedItem('PRIMARYTEMP').value,
      f.elements.namedItem('SECONDARYDATE').value,
      f.elements.namedItem('SECONDARYDAYS').value,
      f.elements.namedItem('SECONDARYTEMP').value,
      f.elements.namedItem('KEG').value,
      f.elements.namedItem('CARBONATION').value,
      f.elements.namedItem('CONDITIONING').value,
      f.elements.namedItem('AROMA').value,
      f.elements.namedItem('AROMACOMMENT').value,
      f.elements.namedItem('APPEAR').value,
      f.elements.namedItem('APPEARCOMMENT').value,
      f.elements.namedItem('FLAVOR').value,
      f.elements.namedItem('FLAVORCOMMENT').value,
      f.elements.namedItem('MOUTH').value,
      f.elements.namedItem('MOUTHCOMMENT').value,
      f.elements.namedItem('OVERALL').value,
      f.elements.namedItem('OVERALLCOMMENT').value,
      f.elements.namedItem('AA1').value,
      f.elements.namedItem('AA2').value,
      f.elements.namedItem('AA3').value,
      f.elements.namedItem('AA4').value,
      f.elements.namedItem('AA5').value,
      f.elements.namedItem('AA6').value,
      f.elements.namedItem('ABSORBFACT').value]; 

   var strRecipe = arrRecipe.join('^') + '^';  //carat at end
   //console.log(strRecipe);
   return strRecipe;
}

function collectInfo() {
   for (item in recipekeys) {
      recipevalues[item] = frmMash.elements.namedItem(recipekeys[item]).value;
      //console.log(item, ": ", recipevalues[item]);
      console.dir(recipevalues);
   }
   //var color_srm = frmMash.elements.namedItem("SRMTOTAL2").value;
}

/* from wiki.greasespot.net */
function embedFunction(s) {
   strfunc = s.toString().replace(/([\s\S]*?return;){2}([\s\S]*)}/,'$2');
   document.body.appendChild(document.createElement('script')).innerHTML=strfunc;
   //console.log(strfunc);
}

/* from wiki.greasespot.net */
function remove(element) {
    element.parentNode.removeChild(element);
}

function embedManyFunctions() {
   var myglobals = [datepickerVAR];
   var myfunctions = [ displayDatePicker, drawDatePicker, refreshDatePicker, getButtonCode, getDateString, getFieldDate, splitDateString, updateDateField, adjustiFrame, displayProperDatePicker, ];
   var strfunc = "";

   for (item in myglobals) {
      strfunc += myglobals[item].toString();
      strfunc += "\n";
   }

   for (item in myfunctions) {
      strfunc += myfunctions[item].toString().replace(/([\s\S]*?return;){2}([\s\S]*)}/,'$2');
   }

   document.body.appendChild(document.createElement('script')).innerHTML=strfunc;
}

function updateCSS() {

   /* Style sheet for the datepicker */
   var datepickerCSS = 'body { font-family: Verdana, Tahoma, Arial, Helvetica, sans-serif; font-size: .8em; } .dpDiv { } .dpTable { font-family: Tahoma, Arial, Helvetica, sans-serif; font-size: 12px; text-align: center; color: #505050; background-color: #ece9d8; border: 1px solid #AAAAAA; } .dpTR { } .dpTitleTR { } .dpDayTR { } .dpTodayButtonTR { } .dpTD { border: 1px solid #ece9d8; } .dpDayHighlightTD { background-color: #CCCCCC; border: 1px solid #AAAAAA; } .dpTDHover { background-color: #aca998; border: 1px solid #888888; cursor: pointer; color: red; } .dpTitleTD { } .dpButtonTD { } .dpTodayButtonTD { } .dpDayTD { background-color: #CCCCCC; border: 1px solid #AAAAAA; color: white; } .dpTitleText { font-size: 12px; color: gray; font-weight: bold; } .dpDayHighlight { color: 4060ff; font-weight: bold; } .dpButton { font-family: Verdana, Tahoma, Arial, Helvetica, sans-serif; font-size: 10px; color: gray; background: #d8e8ff; font-weight: bold; padding: 0px; } .dpTodayButton { font-family: Verdana, Tahoma, Arial, Helvetica, sans-serif; font-size: 10px; color: gray; background: #d8e8ff; font-weight: bold; }'; 

   /* I need all of these styles to get opaque text on a translucent background */
   var summarypanelCSS = '#summarypanel {' +
                       'position: fixed; border:1px solid #6374AB; ' +
                       'left:5px; top:5px; padding:1em; z-index:0; '+
                       '}';

   var summarypanelbgCSS = '#summarypanelbg {' +
                         'position: fixed; border: 1px; ' +
                         'left:5px; top:5px; z-index: -1; ' +
                         'background-color: yellow; ' +
                         'opacity:0.5; ' +
                         '}';

   var summarypaneltextCSS = '#summarypaneltext {' +
                           'background-color: transparent; ' +
                           'z-index: 5;' +
                           '}';

   GM_addStyle(datepickerCSS);
   GM_addStyle(summarypanelCSS);
   GM_addStyle(summarypanelbgCSS);
   GM_addStyle(summarypaneltextCSS);
}

function insertSummaryPanel() {
   /* I need three divs in order to get opaque text on a translucent background */
   /* https://developer.mozilla.org/en/Useful_CSS_tips/Color_and_Background */

   var summarypaneldiv = document.createElement('div');
   var summarytextdiv = document.createElement('div');
   var summarypanelbgdiv = document.createElement('div');

   summarytextdiv.id = 'summarypaneltext';
   summarypaneldiv.id = 'summarypanel';
   summarypanelbgdiv.id = 'summarypanelbg';

   summarypaneldiv.appendChild(summarypanelbgdiv);
   summarypaneldiv.appendChild(summarytextdiv);

   document.body.appendChild(summarypaneldiv);
}

function updateSummaryPanel(currentscore, whatifscore) {
   var summarypanel = document.getElementById("summarypanel");
   var summarypaneltext = document.getElementById("summarypaneltext");
   var summarypanelbg = document.getElementById("summarypanelbg");

   var myhtml = "<center>Brewday Summary:<br><br>" +
                "Fill HLT with " + STRIKE_GALS + " gals (" + HLT_INCHES + " inches)<br>" +
                "Heat HLT to strike temp (" + STRIKE_TEMP_F+ " deg F)<br>" +
                "Mash " + GRAIN_LBS + " lbs of grain at " + MASH_TEMP_F + " deg F<br>" +
                "Mash for 60 minutes. (start timer)<br>" + 
                "Fill HLT with " + SPARGE_GALS + " gals (" + SPARGE_INCHES + " inches) of sparge water<br>" +
                "Heat HLT to sparge temp (170 deg F)<br>" +
                "Sparge until boil kettle has " + BOIL_GALS + " gals (" + BOIL_INCHES + " inches)<br>" +
                "Boil for " + BOIL_TIME_MINS + " minutes (start timer)<br>" +
                "Don't forget hop additions (start timers)<br>";

   if (SUMMARY_PANEL_STATE == 1) {
      summarypaneltext.innerHTML = myhtml;

      /* the following is a hack in order to get opaque text on a translucent background */
      /* https://developer.mozilla.org/en/Useful_CSS_tips/Color_and_Background */
      var rect = summarypanel.getBoundingClientRect();
      summarypanelbg.style.width = rect.width;
      summarypanelbg.style.height = rect.height;
   }
   else {
      summarypaneltext.innerHTML = "";
      summarypanelbg.style.width = 0;
      summarypanelbg.style.height = 0;
   }
}

function main() {
   /* add the event listener for key presses */
   document.addEventListener('keydown', keyHandler, false);

   /* Which fields require datepickers? */
   var need_datepickers = ["PRIMARYDATE", "SECONDARYDATE", "DATE"];

   /* Update document CSS */ 
   updateCSS();

   /* Embed functions into the page as if they were native.  
    * If the datepicker were written differently, (without creating large
    * and complicated raw HTML), this would not be necessary. */
   embedManyFunctions();

   /* Insert the new total mash volume field */
   insertTotalMashVolume();

   /* Insert new RGB color swatch */
   insertColorSwatch();

   /* Insert brewday summary panel */
   if (USE_SUMMARY_PANEL) { insertSummaryPanel(); }

   /* Insert new form to talk to Google */
   //insertGoogleForm();

   /* Override the original CalculateAll function with my own */
   var oldCalculateAll = unsafeWindow.CalculateAll;
   unsafeWindow.CalculateAll = function() {
      var oldreturn = oldCalculateAll();
      initGlobalVariables();
      writeStrikeInGals();     /* add strike water in gals */
      if (SHOW_BOIL_INCHES) { writeBoilInches(); }   /* add boil inches */
      writeTotalMashVolume();  /* calculate total mash volume required */
      updateColorSwatch();     /* use HTML for beer color */
      updateDayCounts();       /* calculate number of days */
      updateTitle();           /* update the window title */
      //updateGoogInput();       /* update Google box */
      if (USE_SUMMARY_PANEL) { updateSummaryPanel(); }
      return oldreturn;
   };

   /* Make the datepickers appear on doubleclick, and also make these fields
    * call the CalculateAll() function when they are updated. */
   for (var i in need_datepickers) {
      var field = need_datepickers[i];
      var myitem = frmMash.elements.namedItem(field);
      //todo:  true or false?
      myitem.addEventListener("dblclick", unsafeWindow.displayProperDatePicker, true);
      myitem.addEventListener("blur", updateDayCounts, false);
      //'blur' is when the field loses focus.  Because of the way the field is populated,
      //it seems that the 'change' event does not get fired.
   }

   /* todo: add some tooltips */
   /* todo: create recipe card for fridge */

   //collectInfo();
}

main();
