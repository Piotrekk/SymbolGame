'use strict';

var canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d');


/******************************************************** game defaults ********************************************************/

var canvasDefaults = {
  width: 960,
  height: 530
};

var setCanvasDimensions = function() {
  var windowWidth = window.innerWidth,
    windowHeight = window.innerHeight;

  if (windowWidth >= 1000){
    canvas.width = 960;
    canvas.height = 530;
  } else {
    canvasDefaults.width = canvas.width = windowWidth * 0.9;
    canvasDefaults.height = canvas.height = windowWidth * 0.9 * 0.55;
  }
};

var selectButton = document.getElementById('select-symbol'),
  placeSelectButton = function() {
    selectButton.style.top = ((window.innerHeight / 2) - (canvas.height / 2) + (0.0943 * canvas.height)) + 'px';
  };

setCanvasDimensions();
placeSelectButton();

var GAME_SETTINGS = {
  FPS: 60,
  FPSymbol: 10,
  second: 1000
};

var GAME_DATA = {
  images: [],
  symbols: [],
  colors: {
    yellow: '#fef81e',
    red: '#ef758c',
    green: '#b5e281',
    orange: '#fba089',
    bgBlue: '#5585a5',
    bgGreen: '#3a7457'
  },
  font: 'Helvetica'
};


/******************************************************** helper functions ********************************************************/

var getImageByName = function(array, name) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].name === name)
      return array[i];
  }
};

var isMouseCollision = function(element, mouseX, mouseY) {
  if ((mouseX >= element.x && mouseX <= element.x + element.width)
    && (mouseY >= element.y && mouseY <= element.y + element.height))
    return true;
};

var calculateDimension = function(ratio, elem) {
  return Math.floor(elem * ratio);
};

var calculateRatio = function(counter, denominator) {
  return counter / denominator;
};


/******************************************************** main game classes ********************************************************/

function Game() {
  var self = this;

  this.load = function() {
    self.loader = new gameLoader(self.flow);
    self.loader.init();
  };

  this.flow = function() {
    self.gameFlow = new gameFlow();
    self.gameFlow.init();
  };

}

function gameLoader(afterLoadingCallback) {
  var self = this;

  this.loading = true;
  this.animationDone = false;
  this.isDataLoded = false;
  this.afterLoadingCallback = afterLoadingCallback;
  this.isMobile = window.innerWidth <= 1000;

  var loaderCanvasDefaults = !self.isMobile ? canvasDefaults : { width: 960, height: 530 };

  this.tableDefaults = {
    xArr:  _generateAxisTable(loaderCanvasDefaults.width),
    yArr: _generateAxisTable(loaderCanvasDefaults.height)
  };

  this.$table = {
    tableArr: _createTable(self.tableDefaults.xArr, self.tableDefaults.yArr),
    squaresToRender: [],
    update: function() {
      if (this.tableArr.length)
        for (var i = 0; i < 20; i++) {
          var randomIndex = [ Math.floor(Math.random() * (this.tableArr.length)) ];
          this.squaresToRender.push(this.tableArr[randomIndex]);

          this.tableArr.splice(randomIndex, 1);
        }
      else
        self.animationDone = true;
    },
    draw: function() {
      for (var i = 0; i < this.squaresToRender.length; i++) {
        if (!this.squaresToRender[i]) return false;

        ctx.fillStyle = GAME_DATA.colors.bgGreen;
        ctx.fillRect(this.squaresToRender[i].x, this.squaresToRender[i].y, 10, 10);
        ctx.save();
      }
    }
  }

  this.init = function() {
    self.run();
    _fetchGameData();
  };

  this.run = function() {
    setInterval(function() {
      if (!self.animationDone)
        self.update(),
        self.render();
      else
        return false;
    }, GAME_SETTINGS.second / GAME_SETTINGS.FPS);
  };

  this.update = function() {
    self.$table.update();

    if (self.animationDone && self.isDataLoded)
      _finishLoading();
  };

  this.render = function() {
    ctx.fillStyle = GAME_DATA.colors.bgBlue;
    ctx.fillRect(0, 0, loaderCanvasDefaults.width, loaderCanvasDefaults.height);
    ctx.save();

    ctx.fillStyle = GAME_DATA.colors.orange;
    ctx.font = '80px ' + GAME_DATA.font;
    ctx.fillText('Loading', calculateDimension(0.3520, loaderCanvasDefaults.width), calculateDimension(0.5450, loaderCanvasDefaults.height));
    ctx.save();

    self.$table.draw();
  };

  var _finishLoading = function() {
    self.loading = false;

    GAME_DATA.symbols = GAME_DATA.images.slice(0, 6);

    selectButton.className = '';

    if (self.afterLoadingCallback && typeof self.afterLoadingCallback === 'function')
      afterLoadingCallback();
  };

  var _fetchGameData = function(finishLoading) {
    var http = new XMLHttpRequest();

    http.open('GET', 'gameData.json', true);

    http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == "200")
        _processGameData(http.responseText);
    };

    http.send(null);
  };

  var _processGameData = function(fetchedData) {
    var data = JSON.parse(fetchedData);

    var __processImages = function(dataArr, callback) {
      var image,
        imagesRemaining = dataArr.length;

      for (var i = 0; i < dataArr.length; i++) {
        image = new Image();
        image.src = dataArr[i].path;

        image.onload = function() {
          --imagesRemaining;

          if (imagesRemaining <= 0)
            callback();
        };

        GAME_DATA.images.push({
          name: dataArr[i].name,
          image: image
        });
      }
    };

    __processImages(data.images, _setDataAsLoaded);
  };

  var _setDataAsLoaded = function() {
    self.isDataLoded = true;
  };

  function _generateAxisTable(num) {
    var arr = [];

    while (num) {
      arr.push(num);
      num -= 10;
    }

    return arr;
  };

  function _createTable(xArr, yArr) {
    var table = [];

    for (var x = 0; x < xArr.length; x++) {
      for (var y = 0; y < yArr.length; y++) {
        table.push({
          x: x * 10,
          y: y * 10
        })
      }
    }

    return table;
  };
}

function gameFlow() {
  var self = this;

  this.init = function() {
    self.changer = new Changer();

    self.playButton = new playButton(self.changer);

    self.run();
  };

  this.run = function() {
    setInterval(function() {
      self.update(),
      self.render();
    }, GAME_SETTINGS.second / GAME_SETTINGS.FPS);
  };

  this.update = function() {
    self.changer.update();
  };

  this.render = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.drawImage(GAME_DATA.images[8].image, 0, 0, canvas.width, canvas.height);
    ctx.save();

    self.playButton.render();
    self.changer.render();
  };

}

function playButton(changer) {
  var self = this;

  this.$changer = changer;

  this.$button = {
    x: calculateDimension(0.8479, canvasDefaults.width),
    y: calculateDimension(0.3924, canvasDefaults.height),
    width: calculateDimension(0.125, canvasDefaults.width),
    height: calculateDimension(0.2264, canvasDefaults.height)
  };

  this.render = function() {
    ctx.drawImage((
      self.$changer.randomizing || !self.$changer.selectedData.isSymbolSelected
        ? getImageByName(GAME_DATA.images, 'playButtonDisabled').image
        : getImageByName(GAME_DATA.images, 'playButtonEnabled').image
    ), self.$button.x, self.$button.y, self.$button.width, self.$button.height);
    ctx.save();
  }

  canvas.addEventListener('click', function(e) {
    if (isMouseCollision(self.$button, e.offsetX, e.offsetY)
      && !self.$changer.randomizing
      && self.$changer.selectedData.isSymbolSelected)
      self.$changer.startRandomizing();
  });

}

function Changer() {
  var self = this;

  this.frames = 0;
  this.randomizing = false;

  this.symbols = [];
  this.maxSymbols = 30;
  this.currentSymbol = null;
  this.currentSymbolIndex = 0;

  var defaultCanvasSizes = {
    width: 960,
    height: 530
  };

  this.timerData = {
    second: 5,
    defaults: '00:00',
    draw: function(second) {
      ctx.fillStyle = GAME_DATA.colors.yellow;
      ctx.font = calculateDimension(0.1132, canvasDefaults.height) + 'px ' + GAME_DATA.font;
      ctx.fillText('00:0' + this.second, calculateDimension(0.3687, canvasDefaults.width), calculateDimension(0.1509, canvasDefaults.height));
      ctx.save();
    },
    drawDefault: function() {
      ctx.fillStyle = GAME_DATA.colors.yellow;
      ctx.font = calculateDimension(0.1132, canvasDefaults.height) + 'px ' + GAME_DATA.font;
      ctx.fillText(this.defaults, calculateDimension(0.3687, canvasDefaults.width), calculateDimension(0.1509, canvasDefaults.height));
      ctx.save();
    }
  };

  this.$symbol = {
    x: calculateDimension(0.325, canvasDefaults.width),
    y: calculateDimension(0.3547, canvasDefaults.height),
    width: calculateDimension(0.2447, canvasDefaults.width),
    height: calculateDimension(0.2924, canvasDefaults.height)
  };

  this.$arrow = {
    x: calculateDimension(0.8927, canvasDefaults.width),
    y: calculateDimension(calculateRatio(140, defaultCanvasSizes.height), canvasDefaults.height),
    minX: 140,
    maxX: 160,
    width: calculateDimension(0.0343, canvasDefaults.width),
    height: calculateDimension(0.0792, canvasDefaults.height),
    speed: 1,
    direction: 'down',
    update: function() {
      if (this.y == calculateDimension(calculateRatio(160, defaultCanvasSizes.height), canvasDefaults.height)) this.direction = 'up';
      else if (this.y == calculateDimension(calculateRatio(140, defaultCanvasSizes.height), canvasDefaults.height)) this.direction = 'down';

      if (this.direction == 'down') this.y += this.speed;
      else if (this.direction == 'up') this.y -= this.speed;
    },
    draw: function() {
      ctx.drawImage(
        getImageByName(GAME_DATA.images, 'arrow').image
      , this.x, this.y, this.width, this.height);
      ctx.save();
    }
  };

  this.$winText = {
    x: calculateDimension(0.3312, canvasDefaults.width),
    y: calculateDimension(0.7890, canvasDefaults.height),
    draw: function() {
      var type = self.selectedData.winSymbol.name === self.selectedData.symbol;

      ctx.fillStyle = type ? GAME_DATA.colors.green : GAME_DATA.colors.red;
      ctx.font = calculateDimension(0.1132, canvasDefaults.height) + 'px ' + GAME_DATA.font;
      ctx.fillText(type ? 'You win!' : 'You lose!', this.x, this.y);
      ctx.save();
    }
  };

  this.selectedData = {
    symbol: null,
    isSymbolSelected: false,
    winSymbol: null
  };

  this.update = function() {
    if (self.randomizing)
      self.frames += 1,
      _changeCurrentSymbol(self.frames);

    if (self.selectedData.isSymbolSelected && !self.randomizing)
      self.$arrow.update();
  };

  this.render = function() {
    if (self.randomizing)
      ctx.drawImage(self.currentSymbol.image, self.$symbol.x, self.$symbol.y, self.$symbol.width, self.$symbol.height),
      self.timerData.draw();
    else
      self.timerData.drawDefault();

    if (self.selectedData.winSymbol)
      ctx.drawImage(self.selectedData.winSymbol.image, self.$symbol.x, self.$symbol.y, self.$symbol.width, self.$symbol.height),
      self.$winText.draw();

    if (self.selectedData.isSymbolSelected && !self.randomizing)
      self.$arrow.draw();
  };

  this.startRandomizing = function() {
    self.randomizing = true;

    self.symbols = _createRandomSymbolsArray();

    self.currentSymbol = self.symbols[0];
  };

  var $select = document.getElementById('select-symbol');
  $select.addEventListener('change', function(e) {
    self.selectedData.symbol = $select.value;
    self.selectedData.isSymbolSelected = true;
    self.selectedData.winSymbol = null;
  });

  var _finishRandomizing = function(symbol) {
    self.randomizing = false;
    self.selectedData.winSymbol = symbol;

    _resetDefaults();
  };

  var _createRandomSymbolsArray = function() {
    var symbols = [];

    for (var i = 0; i < self.maxSymbols; i++) {
      var prevSymbol = symbols[i - 1],
        newSymbol = GAME_DATA.symbols[ Math.floor(Math.random() * (GAME_DATA.symbols.length)) ];

      if (prevSymbol)
        while (prevSymbol.name === newSymbol.name) {
          newSymbol = GAME_DATA.symbols[ Math.floor(Math.random() * (GAME_DATA.symbols.length)) ];
        }

      symbols.push(newSymbol);
    }

    return symbols;
  };

  var _changeCurrentSymbol = function(frames) {
    if (frames % 60 === 0) {
      self.timerData.second -= 1;
    }

    if (frames % GAME_SETTINGS.FPSymbol === 0) {
      self.currentSymbolIndex += 1;

      if (self.symbols[self.currentSymbolIndex])
        self.currentSymbol = self.symbols[self.currentSymbolIndex];
      else
        _finishRandomizing(self.currentSymbol);
    }
  };

  var _resetDefaults = function() {
    self.symbols = [];
    self.currentSymbol = null;
    self.currentSymbolIndex = 0;

    self.timerData.second = 5;

    self.selectedData.isSymbolSelected = false;
  };

}


/******************************************************** game initialization ********************************************************/

window.onload = function() {
  var game = new Game();
  game.load();
};
