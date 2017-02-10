$(".reveal-map").on("click", function(){
    $("#googlemap").slideToggle("slow");
    $(this).text($(this).text() == "Show map" ? "Hide map" : "Show map");
  });