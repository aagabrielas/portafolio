$(function () {
  $("a").click(function (event) {
    if (this.hash !== "") {
      event.preventDefault();

      var gato = this.hash;

      $("html, body").animate(
        {
          scrollTop: $(gato).offset().top,
        },
        800,
        function () {
          window.location.hash = gato;
        }
      );
    }
  });
});

$(".carousel").on("touchstart", function (event) {
  var xClick = event.originalEvent.touches[0].pageX;
  $(this).one("touchmove", function (event) {
    var xMove = event.originalEvent.touches[0].pageX;
    if (Math.floor(xClick - xMove) > 5) {
      $(this).carousel("next");
    } else if (Math.floor(xClick - xMove) < -5) {
      $(this).carousel("prev");
    }
  });
  $(".carousel").on("touchend", function () {
    $(this).off("touchmove");
  });
});

$(".carousel").carousel({
  interval: false,
});

$(window).scroll(function () {
  if ($("#menu").offset().top > 520) {
    $("#menu").addClass("bg-rosa");
  } else {
    $("#menu").removeClass("bg-none");
  }
});

$('.navbar-nav>li>a').on('click', function(){
  $('.navbar-collapse').collapse('hide');
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

