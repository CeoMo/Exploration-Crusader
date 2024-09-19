var myGamePiece;
var myObstacles = [];
var myCollectibles = [];
var myScore;
var scoreCount = 0;
var mySound;
var myMusic;
var gamePaused = false;
var isMuted = false;
var gameOver = false;  // Add game over state
var backgroundImage = new Image();
backgroundImage.src = "space.jpeg";
var backgroundX = 0;

function startGame() {
    
    document.getElementById('loadingScreen').style.display = 'none';  // Hide the loading screen when the game starts
    
    myGamePiece = new component(50, 50, "spaceship.gif", 10, 200, "image");
    myScore = new component("20px", "Consolas", "Red", 680, 40, "text");
    mySound = new sound("Collison.mp3");
    myMusic = new sound("gamemusic.mp3");
    myMusic.play();
    myGameArea.start();

    // Reset game state
    gameOver = false;
    scoreCount = 0;
    myObstacles = [];
    myCollectibles = [];
    document.getElementById("gameOverText").style.display = "none"; // Hide Game Over message

    window.addEventListener('keydown', function(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        switch (e.key) {
            case 'ArrowUp': moveup(); break;
            case 'ArrowDown': movedown(); break;
            case 'ArrowLeft': moveleft(); break;
            case 'ArrowRight': moveright(); break;
        }
    });

    window.addEventListener('keyup', function(e) {
        clearmove();
    });
}

var myGameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = 800;
        this.canvas.height = 450;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        requestAnimationFrame(updateGameArea);
    },
    stop: function() {
        cancelAnimationFrame(this.interval);
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

// Background scrolling
function updateBackground() {
    backgroundX -= 0.5;
    if (backgroundX <= -myGameArea.canvas.width) {
        backgroundX = 0;
    }
    var ctx = myGameArea.context;
    ctx.drawImage(backgroundImage, backgroundX, 0, myGameArea.canvas.width, myGameArea.canvas.height);
    ctx.drawImage(backgroundImage, backgroundX + myGameArea.canvas.width, 0, myGameArea.canvas.width, myGameArea.canvas.height);
}

function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    var imgLoaded = false;  // Flag to track if the image is loaded

    if (this.type === "image") {
        this.image = new Image();
        this.image.src = color; // 'color' is the image source (e.g., "blackHole.png")

        // Ensure the image is fully loaded before drawing
        this.image.onload = () => {
            imgLoaded = true;
        };
    }

    this.update = function() {
        var ctx = myGameArea.context;
    
        if (this.type === "text") {
            // Draw the score text
            ctx.font = this.width + " " + this.height;  // Font size and font family
            ctx.fillStyle = color;  // Set the text color
            ctx.fillText(this.text, this.x, this.y);  // Draw the text at (x, y) coordinates
        } else if (this.type === "image" && imgLoaded) {
            // Draw the image only if it's fully loaded
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Default to drawing a rectangle for other types
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };
    

    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
    };

    this.crashWith = function(otherobj) {
        // Calculate the distance between the centers of the two objects
        var dx = (this.x + this.width / 2) - (otherobj.x + otherobj.width / 2); // Horizontal distance
        var dy = (this.y + this.height / 2) - (otherobj.y + otherobj.height / 2); // Vertical distance
    
        // Calculate the distance between the two centers (Euclidean distance)
        var distance = Math.sqrt(dx * dx + dy * dy);
    
        // Calculate the sum of the radii (half of width since we're assuming circular objects)
        var radiusSum = (this.width / 2) + (otherobj.width / 2);
    
        // Collision occurs if the distance between centers is less than the sum of the radii
        return distance < radiusSum;
    };
    
}

// Update the game area logic
function updateGameArea() {
    if (gamePaused || gameOver) {
        requestAnimationFrame(updateGameArea);
        return;
    }

    myGameArea.clear();
    myGameArea.frameNo += 1;
    updateBackground();

    // Add new obstacles and collectibles periodically
    if (myGameArea.frameNo === 1 || everyinterval(200)) {
        var x = myGameArea.canvas.width;
        var minHeight = 90;
        var maxHeight = 150;
        var height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        var minGap = 250;
        var maxGap = 350;
        var gap = 200;

        // Ensure obstacles are fully loaded and drawn
        myObstacles.push(new component(150, 150, "pole.png", x, Math.random() * myGameArea.canvas.height, "image"));
        
        // Collectibles appear as orange circles
        myCollectibles.push(new component(20, 20, "orange", x, Math.random() * myGameArea.canvas.height, "circle"));
    }

    // Check for collisions with obstacles
    for (var i = 0; i < myObstacles.length; i++) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            mySound.play();
            myMusic.stop();
            showGameOver();
            gameOver = true;
            myGameArea.stop();
            return;
        }
    }

    // Check for collectible pickups
    for (var i = 0; i < myCollectibles.length; i++) {
        if (myGamePiece.crashWith(myCollectibles[i])) {
            scoreCount++;
            myCollectibles.splice(i, 1);  // Remove collected item
        }
    }

    // Move and update obstacles
    for (var i = 0; i < myObstacles.length; i++) {
        myObstacles[i].x -= 1;
        myObstacles[i].update();
    }

    // Move and update collectibles
    for (var i = 0; i < myCollectibles.length; i++) {
        myCollectibles[i].x -= 1;
        myCollectibles[i].update();
    }

    // Update the score and game piece position
    myScore.text = "SCORE: " + scoreCount;
    myScore.update();
    myGamePiece.newPos();
    myGamePiece.update();

    requestAnimationFrame(updateGameArea);
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function() {
        this.sound.play();
    };
    this.stop = function() {
        this.sound.pause();
    };
    this.setVolume = function(value) {
        this.sound.volume = value;
    };
    this.mute = function() {
        this.sound.muted = true;
    };
    this.unmute = function() {
        this.sound.muted = false;
    };
}

function everyinterval(n) {
    return (myGameArea.frameNo / n) % 1 === 0;
}

function moveup() {
    myGamePiece.speedY = -1;
}

function movedown() {
    myGamePiece.speedY = 1;
}

function moveleft() {
    myGamePiece.speedX = -1;
}

function moveright() {
    myGamePiece.speedX = 1;
}

function clearmove() {
    myGamePiece.speedX = 0;
    myGamePiece.speedY = 0;
}

function pauseOrContinueGame() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        myMusic.stop();
        document.getElementById("pauseImage").style.display = "block";
    } else {
        myMusic.play();
        document.getElementById("pauseImage").style.display = "none";
    }
}

function adjustVolume(value) {
    myMusic.setVolume(value);
}

function toggleMute() {
    if (isMuted) {
        myMusic.unmute();
        isMuted = false;
        document.getElementById("muteButton").innerText = "Mute";
    } else {
        myMusic.mute();
        isMuted = true;
        document.getElementById("muteButton").innerText = "Unmute";
    }
}

// Show Game Over screen
function showGameOver() {
    document.getElementById("gameOverText").style.display = "block";
}

// Reset the game
function resetGame() {
    myGameArea.stop();  // Stop the current game loop
    startGame();  // Restart the game
}
