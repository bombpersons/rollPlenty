$(function () {
  // Pixi (Map Rendering)
  var renderer = PIXI.autoDetectRenderer(256, 256);
  renderer.autoResize = true;
  renderer.view.style.position = "absolute";
  renderer.view.style.display = "block";
  renderer.zIndex = 1;
  renderer.resize(window.innerWidth, window.innerHeight);

  // Automatically resize the renderer to the size of the window.
  window.addEventListener("resize", function(event) {
    renderer.resize(window.innerWidth, window.innerHeight);
  });

  // Add the renderer view to the map div.
  $('#map').append(renderer.view);
  var stage = new PIXI.Container();

  // Load some test textures.
  PIXI.loader.add("test.png").load(function() {
    var sprite = new PIXI.Sprite(
      PIXI.loader.resources["test.png"].texture
    );
    sprite.x = 200;
    sprite.y = 400;

    stage.addChild(sprite);
    renderer.render(stage);
  });

  // Loop to update the map.
  function render() {
    requestAnimationFrame(render);
    renderer.render(stage);
  }
  render();
});
