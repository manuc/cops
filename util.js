// util.js
// copyright Sébastien Lucas
// https://github.com/seblucas/cops

var templatePage, templateBookDetail, templateMain, currentData, before, filterList;

var cache = new LRUCache(30);

var DEBUG = true;
var isPushStateEnabled = window.history && window.history.pushState && window.history.replaceState &&
  // pushState isn't reliable on iOS until 5.
  !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]|WebApps\/.+CFNetwork)/);

function debug_log(text) {
    if ( DEBUG ) {
        console.log(text);
    }
}

function updateCookie (id) {
    if($(id).prop('pattern') && !$(id).val().match(new RegExp ($(id).prop('pattern')))) {
        return;
    }
    var name = $(id).attr('id');
    var value = $(id).val ();
    $.cookie(name, value, { expires: 365 });
}

function updateCookieFromCheckbox (id) {
    var name = $(id).attr('id');
    if ((/^style/).test (name)) {
        name = "style";
    }
    if ($(id).is(":checked"))
    {
        if ($(id).is(':radio')) {
            $.cookie(name, $(id).val (), { expires: 365 });
        } else {
            $.cookie(name, '1', { expires: 365 });
        }
    }
    else
    {
        $.cookie(name, '0', { expires: 365 });
    }
}

function elapsed () {
    var elapsedTime = new Date () - before; 
    return "Elapsed : " + elapsedTime;
}

function retourMail(data, textStatus, jqXHR ) {
    alert (data);
}

function sendToMailAddress (component, dataid) {
    var email = $.cookie ('email');
    if (!$.cookie ('email')) {
        email = window.prompt ("Please enter your email : ", "");
        $.cookie ('email', email, { expires: 365 });
    }
    var url = 'sendtomail.php';
    if (currentData.databaseId) {
        url = url + '?db=' + currentData.databaseId;
    }
    $.ajax ({'url': url, 'type': 'post', 'data': { 'data':  dataid, 'email': email }, 'success': retourMail});
}

function strformat () {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }
    return s;
}

function isDefined(x) {
    var undefinedVar;
    return x !== undefinedVar;
}

function getCurrentOption (option) {
    if (!$.cookie (option)) {
        if (currentData && currentData.const && currentData.const.config && currentData.const.config [option]) {
            return currentData.const.config [option];
        }
    }
    return $.cookie (option);
}

function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

/************************************************
 * All functions needed to filter the book list by tags
 ************************************************
 */

function getTagList () {
    var tagList = {};
    $(".se").each (function(){
        if ($(this).parents (".filtered").length > 0) { return; }
        var taglist = $(this).text();

        var tagarray = taglist.split (",");
        for (var i in tagarray) {
            var tag = tagarray [i].replace(/^\s+/g,'').replace(/\s+$/g,'');
            tagList [tag] = 1;
        }
    });
    return tagList;
}

function doFilter () {
    $(".books").removeClass("filtered");
    if (jQuery.isEmptyObject(filterList)) {
        updateFilters ();
        return;
    }
    
    $(".se").each (function(){
        var taglist = ", " + $(this).text() + ", ";
        var toBeFiltered = false;
        for (var filter in filterList) {
            var onlyThisTag = filterList [filter];
            filter = ', ' + filter + ', ';
            var myreg = new RegExp (filter);
            if (myreg.test (taglist)) {
                if (onlyThisTag === false) {
                    toBeFiltered = true;
                }
            } else {
                if (onlyThisTag === true) {
                    toBeFiltered = true;
                }
            }
        }
        if (toBeFiltered) { $(this).parents (".books").addClass ("filtered"); }
    });
    updateFilters ();
}

function updateFilters () {
    var tagList = getTagList ();
    
    // If there is already some filters then let's prepare to update the list
    $("#filter ul li").each (function () {
        var text = $(this).text ();
        if (isDefined (tagList [text]) || $(this).attr ('class')) {
            tagList [text] = 0;
        } else {
            tagList [text] = -1;
        }
    });
    
    // Update the filter -1 to remove, 1 to add, 0 already there
    for (var tag in tagList) {
        var tagValue = tagList [tag];
        if (tagValue === -1) {
            $("#filter ul li:contains('" + tag + "')").remove();
        }
        if (tagValue === 1) {
            $("#filter ul").append ("<li>" + tag + "</li>");
        }
    }
    
    $("#filter ul").append ("<li>_CLEAR_</li>");
    
    // Sort the list alphabetically
    $('#filter ul li').sortElements(function(a, b){
        return $(a).text() > $(b).text() ? 1 : -1;
    });
}

function handleFilterEvents () {
    $("#filter ul").on ("click", "li", function(){
        var filter = $(this).text ();
        if (filter === "_CLEAR_") {
            filterList = {};
            $("#filter ul li").removeClass ("filter-exclude");
            $("#filter ul li").removeClass ("filter-include");
            doFilter ();
            return;
        }
        switch ($(this).attr("class")) {
            case "filter-include" :
                $(this).attr("class", "filter-exclude");
                filterList [filter] = false;
                break;
            case "filter-exclude" :
                $(this).removeClass ("filter-exclude"); 
                delete filterList [filter];
                break;
            default :
                $(this).attr("class", "filter-include");
                filterList [filter] = true;
                break;
        }
        doFilter ();
    });
}

/************************************************
 * Functions to handle Ajax navigation
 ************************************************
 */

function navigateTo (url) {
    before = new Date ();
    var jsonurl = url.replace ("index", "getJSON");
    var cachedData = cache.get (jsonurl);
    if (cachedData) {
        history.pushState(jsonurl, "", url);
        updatePage (cachedData);
    } else {
        $.getJSON(jsonurl, function(data) {
            history.pushState(jsonurl, "", url);
            cache.put (jsonurl, data);
            updatePage (data);
        });
    }
}

function updatePage (data) {
    var result;
    filterList = {};
    data ["const"] = currentData ["const"];
    if (false && $("section").length && currentData.isPaginated === 0 &&  data.isPaginated === 0) {
        // Partial update (for now disabled)
        debug_log ("Partial update");
        result = templateMain (data);
        $("h1").html (data.title);
        $("section").html (result);
    } else {
        // Full update
        result = templatePage (data);
        $("body").html (result);
    }
    document.title = data.title;
    currentData = data;
    
    debug_log (elapsed ());
    
    if ($.cookie('toolbar') === '1') { $("#tool").show (); }
    if (currentData.containsBook === 1) {
        $("#sortForm").show ();
        if (getCurrentOption ("html_tag_filter") === "1") {
            $("#filter ul").empty ();
            updateFilters ();
            handleFilterEvents ();
        }
    } else {
        $("#sortForm").hide ();
    }
    
    if (currentData.page !== 19) { ajaxifyLinks (); }
    
    $("#sort").click(function(){
        $('.books').sortElements(function(a, b){
            var test = 1;
            if ($("#sortorder").val() === "desc")
            {
                test = -1;
            }
            return $(a).find ("." + $("#sortchoice").val()).text() > $(b).find ("." + $("#sortchoice").val()).text() ? test : -test;
        });
    });
    
    $(".headright").click(function(){
        if ($("#tool").is(":hidden")) {
            $("#tool").slideDown("slow");
            $.cookie('toolbar', '1', { expires: 365 });
        } else {
            $("#tool").slideUp();
            $.removeCookie('toolbar');
        }
    });
    
    if (getCurrentOption ("use_fancyapps") === "1") {
        $(".fancydetail").click(function(event){
            event.preventDefault(); 
            before = new Date ();
            var url = $(this).attr("href");
            var jsonurl = url.replace ("index", "getJSON");
            $.getJSON(jsonurl, function(data) {
                data ["const"] = currentData ["const"];
                var detail = templateBookDetail (data);
                $.magnificPopup.open({
                  items: {
                    src: detail,
                    type: 'inline'
                  }
                });
                debug_log (elapsed ());
            });
        });
        

        $('section').magnificPopup({
            delegate: '.fancycover', // child items selector, by clicking on it popup will open
            type: 'image',
            gallery:{enabled:true, preload: [0,2]}
            // other options
        });

            

        $('.fancyabout').magnificPopup({ type: 'ajax' });
    }
}

function ajaxifyLinks () {
    if (isPushStateEnabled) {
        var links = $("a[href^='index']");
        if (getCurrentOption ("use_fancyapps") === "1") { links = links.not (".fancydetail"); }
        links.click (function (event) {
            event.preventDefault(); 

            var url = $(this).attr('href');
            navigateTo (url);
        });
        
        $("#searchForm").submit (function (event) {
            event.preventDefault(); 
            
            var url = strformat ("index.php?page=9&current={0}&query={1}&db={2}", currentData.page, $("input[name=query]").val (), currentData.databaseId);
            navigateTo (url);
        });
    }
}

window.onpopstate = function(event) {
    before = new Date ();
    var data = cache.get (event.state);
    updatePage (data);
};

$(document).keydown(function(e){
    if (e.keyCode === 37 && $("#prevLink").length > 0) {
        navigateTo ($("#prevLink").attr('href'));
    }
    if (e.keyCode === 39  && $("#nextLink").length > 0) {
        navigateTo ($("#nextLink").attr('href'));
    }
});