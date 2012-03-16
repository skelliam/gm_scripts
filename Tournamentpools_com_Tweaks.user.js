// ==UserScript==
// @name           Tournamentpools.com Tweaks
// @namespace      http://userscripts.org/users/31721
// @description    Make some tweaks to Tournamentpools.com site
// @include        http://www.tournamentpools.com/*
// ==/UserScript==


function main() 
{
   var lossCSS = '.loss {' +
                 'color: #000000 !important; ' +
                 'background-color: #FF0000 !important; ' +
                 '}';

   var winCSS =  '.win {' +
                 'color: #000000 !important; ' +
                 'background-color: #00FF00 !important; ' +
                 '}';

   GM_addStyle(lossCSS);
   GM_addStyle(winCSS);
}

main();
