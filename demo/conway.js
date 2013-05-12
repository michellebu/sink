// Create an m x n matrix.
Array.matrix = function (m, n, initial) {
  var a, i, j, mat = [];
  for (i = 0; i < m; i += 1) {
    a = [];
    for (j = 0; j < n; j += 1) {
      a[j] = 0;
    }
    mat[i] = a;
  }
  return mat;
};

// Grid utils
function Cell(row, column) {
  this.row = row;
  this.column = column;
};


$(document).ready(

  function() {
    var gridCanvas = document.getElementById("grid");
    var counterSpan = document.getElementById("counter");

    sink('game_of_life_demo', { debug: true }, function(Life){

      // If variables are not initialized, do so.
      var originator;
      if (Life.CELL_SIZE === undefined) {
        Life.CELL_SIZE = 20;
        Life.X = 400;
        Life.Y = 400;

        Life.WIDTH = Life.X / Life.CELL_SIZE;
        Life.HEIGHT = Life.Y / Life.CELL_SIZE;

        Life.DEAD = 0;
        Life.ALIVE = 1;

        // TODO: will it ever be stopped?
        Life.STOPPED = 0;
        Life.RUNNING = 1;
        Life.DELAY = 3000;

        Life.minimum = 2;
        Life.maximum = 3;
        Life.spawn = 3;

        Life.state = Life.RUNNING;
        Life.grid = Array.matrix(Life.HEIGHT, Life.WIDTH, 0);
        Life.counter = 0;
      }

      // Game of life logic
      function updateState() {
        var neighbors;
        var nextGenerationGrid = Array.matrix(Life.HEIGHT, Life.WIDTH, 0);

        for (var h = 0; h < Life.HEIGHT; h++) {
          for (var w = 0; w < Life.WIDTH; w++) {
            neighbors = calculateNeighbors(h, w);
            if (Life.grid[h][w] !== Life.DEAD) {
              if ((neighbors >= Life.minimum) &&
                (neighbors <= Life.maximum)) {
                  nextGenerationGrid[h][w] = Life.ALIVE;
              }
            } else {
              if (neighbors === Life.spawn) {
                nextGenerationGrid[h][w] = Life.ALIVE;
              }
            }
          }
        }
        copyGrid(nextGenerationGrid, Life.grid);
        Life.counter++;
      };

      function calculateNeighbors(y, x) {
        var total = (Life.grid[y][x] !== Life.DEAD) ? -1 : 0;
        for (var h = -1; h <= 1; h++) {
          for (var w = -1; w <= 1; w++) {
            if (Life.grid
              [(Life.HEIGHT + (y + h)) % Life.HEIGHT]
              [(Life.WIDTH + (x + w)) % Life.WIDTH] !== Life.DEAD) {
                  total++;
            }
          }
        }

        return total;
      };

      function copyGrid(source, destination) {
        for (var h = 0; h < Life.HEIGHT; h++) {
          for (var w = 0; w < Life.WIDTH; w++) {
            destination[h][w] = source[h][w];
          }
        }
      };


      // render function
      function render() {
        for (var h = 0; h < Life.HEIGHT; h++) {
          for (var w = 0; w < Life.WIDTH; w++) {
            if (Life.grid[h][w] === Life.ALIVE) {
              context.fillStyle = "#000";
            } else {
              context.fillStyle = "#eee";
            }
            context.fillRect(
              w * Life.CELL_SIZE +1,
              h * Life.CELL_SIZE +1,
              Life.CELL_SIZE -1,
              Life.CELL_SIZE -1);
          }
        }
        counterSpan.innerHTML = Life.counter;

        if (!Life.originator) {
          originator = true;
          Life.originator = true;

          setInterval(updateState, Life.DELAY);

          window.onbeforeunload = function() {
            Life.originator = false;
          }
        }

        // Recurse render loop.
        window.webkitRequestAnimationFrame(render);
      };

      // initialize canvas
      if (gridCanvas.getContext) {
        var context = gridCanvas.getContext('2d');
        var offset = Life.CELL_SIZE;

        for (var x = 0; x <= Life.X; x += Life.CELL_SIZE) {
          context.moveTo(0.5 + x, 0);
          context.lineTo(0.5 + x, Life.Y);
        }
        for (var y = 0; y <= Life.Y; y += Life.CELL_SIZE) {
          context.moveTo(0, 0.5 + y);
          context.lineTo(Life.X, 0.5 + y);
        }
        context.strokeStyle = "#fff";
        context.stroke();

        function canvasOnClickHandler(event) {
          var cell = getCursorPosition(event);
          var state = Life.grid[cell.row][cell.column] ^ 1;
          Life.grid[cell.row][cell.column] = state;
        };

        function getCursorPosition(event) {
          var x;
          var y;
          if (event.pageX || event.pageY) {
            x = event.pageX;
            y = event.pageY;
          } else {
            x = event.clientX
              + document.body.scrollLeft
              + document.documentElement.scrollLeft;
            y = event.clientY
              + document.body.scrollTop
              + document.documentElement.scrollTop;
          }

          x -= gridCanvas.offsetLeft;
          y -= gridCanvas.offsetTop;

          var cell = new Cell(Math.floor((y - 4) / Life.CELL_SIZE),
            Math.floor((x - 2) / Life.CELL_SIZE));
          return cell;
        };

        gridCanvas.addEventListener("click", canvasOnClickHandler, false);
      } else {
        // Canvas check
        console.log("Canvas failed to load");
      }

      // Start render loop.
      window.webkitRequestAnimationFrame(render);
    });
  }
);