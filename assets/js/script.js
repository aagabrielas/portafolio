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

 /* Swipe carrusel en vista mobile */
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

/*Quitarle lo automático al carrusel*/
$(".carousel").carousel({
  interval: false,
});

/*Que navbar sea transparente y cuando pase 520px cambie de color */
$(window).scroll(function () {
  if ($("#menu").offset().top > 520) {
    $("#menu").addClass("bg-rosa");
  } else {
    $("#menu").removeClass("bg-none");
  }
});

/*Que le navbar en mobile se colapse automatico al hacer click */
$('.navbar-nav>li>a').on('click', function(){
  $('.navbar-collapse').collapse('hide');
});

/*Tooltip */
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

