window.onload = function(){
    $("#home-panel").show();
    $(".nav-tab").on("click", function(){
        var tab = $(this);
        var panel = $(tab).attr("href");
        $(".nav-tab").removeClass("active-tab");
        $(tab).addClass("active-tab");
        $(".panel").hide();
        $(panel).show();
    })
    
    // listing cookies
    $(".cookie_header").on("click", function(){
        $(this).children("img").toggleClass("rotate-header-icon");
    })
}