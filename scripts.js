var myGamePiece;  // Variable for the player's game piece (e.g., spaceship)
var myObstacles = [];  // Array to store obstacles in the game
var myCollectibles = [];  // Array to store collectibles in the game
var mySamples;  // Variable to store the Samples component
var SamplesCount = 0;  // Initial Samples value
var mySound;  // Variable for sound effects
var myMusic;  // Variable for background music
var gamePaused = false;  // Flag to check if the game is paused
var isMuted = false;  // Flag to check if the game is muted
var gameOver = false;  // Flag to check if the game is over
var backgroundImage = new Image();  // Variable to hold the background image
backgroundImage.src = "space.jpeg";  // Source of the background image
var backgroundX = 0;  // Variable to control background scrolling

function startGame() {
    document.getElementById('loadingScreen').style.display = 'none';  // Hide the loading screen when the game starts
    
    myGamePiece = new component(50, 50, "spaceship.gif", 10, 200, "image");  // Create the game piece (spaceship)
    mySamples = new component("20px", "Consolas", "Red", 680, 40, "text");  // Create the Samples display
    mySound = new sound("Collison.mp3");  // Load the collision sound effect
    myMusic = new sound("gamemusic.mp3");  // Load the background music
    myMusic.play();  // Start playing the background music
    myGameArea.start();  // Start the game area

    // Reset the game state
    gameOver = false;  // Reset the gameOver flag
    SamplesCount = 0;  // Reset the Samples count
    myObstacles = [];  // Clear existing obstacles
    myCollectibles = [];  // Clear existing collectibles
    document.getElementById("gameOverText").style.display = "none";  // Hide Game Over message

    // Add event listeners for player controls (arrow keys)
    window.addEventListener('keydown', function(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();  // Prevent default scrolling behavior
        }
        switch (e.key) {
            case 'ArrowUp': moveup(); break;
            case 'ArrowDown': movedown(); break;
            case 'ArrowLeft': moveleft(); break;
            case 'ArrowRight': moveright(); break;
        }
    });

    window.addEventListener('keyup', function(e) {
        clearmove();  // Stop movement when the key is released
    });
}

var myGameArea = {
    canvas: document.createElement("canvas"),  // Create a canvas element for the game
    start: function() {
        this.canvas.width = 800;  // Set canvas width
        this.canvas.height = 450;  // Set canvas height
        this.context = this.canvas.getContext("2d");  // Get 2D drawing context
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);  // Insert canvas into the DOM
        this.frameNo = 0;  // Initialize frame number
        requestAnimationFrame(updateGameArea);  // Start the game loop
    },
    stop: function() {
        cancelAnimationFrame(this.interval);  // Stop the game loop
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);  // Clear the canvas for the next frame
    }
};

// Function to scroll the background
function updateBackground() {
    backgroundX -= 0.5;  // Move the background to the left
    if (backgroundX <= -myGameArea.canvas.width) {
        backgroundX = 0;  // Reset the background position when it's fully scrolled
    }
    var ctx = myGameArea.context;
    // Draw the background image twice to create a scrolling effect
    ctx.drawImage(backgroundImage, backgroundX, 0, myGameArea.canvas.width, myGameArea.canvas.height);
    ctx.drawImage(backgroundImage, backgroundX + myGameArea.canvas.width, 0, myGameArea.canvas.width, myGameArea.canvas.height);
}

// Component class to create game objects (e.g., obstacles, game piece, Samples)
function component(width, height, color, x, y, type) {
    this.type = type;  // Type of component (e.g., image, text)
    this.width = width;  // Width of the component
    this.height = height;  // Height of the component
    this.speedX = 0;  // Horizontal speed of the component
    this.speedY = 0;  // Vertical speed of the component
    this.x = x;  // X position of the component
    this.y = y;  // Y position of the component
    var imgLoaded = false;  // Flag to track if the image is loaded

    if (this.type === "image") {
        this.image = new Image();
        this.image.src = color;  // 'color' is used as the image source

        // Load the image before drawing it
        this.image.onload = () => {
            imgLoaded = true;
        };
    }

    this.update = function() {
        var ctx = myGameArea.context;
        if (this.type === "text") {
            ctx.font = this.width + " " + this.height;  // Set the font style
            ctx.fillStyle = color;  // Set the color of the text
            ctx.fillText(this.text, this.x, this.y);  // Draw the text
        } else if (this.type === "image" && imgLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);  // Draw the image if loaded
        } else {
            ctx.fillStyle = color;  // Set the color for non-image objects
            ctx.fillRect(this.x, this.y, this.width, this.height);  // Draw the object as a rectangle
        }
    };

    this.newPos = function() {
        this.x += this.speedX;  // Update the x position based on speedX
        this.y += this.speedY;  // Update the y position based on speedY
    };

    // Check if this object has collided with another object
    this.crashWith = function(otherobj) {
        var dx = (this.x + this.width / 2) - (otherobj.x + otherobj.width / 2);  // Calculate horizontal distance
        var dy = (this.y + this.height / 2) - (otherobj.y + otherobj.height / 2);  // Calculate vertical distance
        var distance = Math.sqrt(dx * dx + dy * dy);  // Calculate Euclidean distance
        var radiusSum = (this.width / 2) + (otherobj.width / 2);  // Sum of radii for circular collision
        return distance < radiusSum;  // Return true if the objects collide
    };
}

// Function to update the game area (game loop)
function updateGameArea() {
    if (gamePaused || gameOver) {  // Pause the game if gamePaused or gameOver is true
        requestAnimationFrame(updateGameArea);
        return;
    }

    myGameArea.clear();  // Clear the game area for the next frame
    myGameArea.frameNo += 1;  // Increment the frame number
    updateBackground();  // Scroll the background

    // Add obstacles and collectibles periodically
    if (myGameArea.frameNo === 1 || everyinterval(200)) {
        var x = myGameArea.canvas.width;  // Set x position for new obstacles
        var minHeight = 90;
        var maxHeight = 150;
        var height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
        var minGap = 250;
        var maxGap = 350;
        var gap = 200;

        myObstacles.push(new component(150, 150, "pole.png", x, Math.random() * myGameArea.canvas.height, "image"));  // Add new obstacle
        myCollectibles.push(new component(20, 20, "orange", x, Math.random() * myGameArea.canvas.height, "circle"));  // Add new collectible
    }

    // Check for collisions with obstacles
    for (var i = 0; i < myObstacles.length; i++) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            mySound.play();  // Play collision sound
            myMusic.stop();  // Stop background music
            showGameOver();  // Show Game Over screen
            gameOver = true;  // Set gameOver to true
            myGameArea.stop();  // Stop the game
            return;
        }
    }

    // Check for collectible pickups
    for (var i = 0; i < myCollectibles.length; i++) {
        if (myGamePiece.crashWith(myCollectibles[i])) {
            SamplesCount++;  // Increase the Samples when a collectible is picked up
            myCollectibles.splice(i, 1);  // Remove the collected item
        }
    }

    // Update obstacles and move them left
    for (var i = 0; i < myObstacles.length; i++) {
        myObstacles[i].x -= 1;  // Move the obstacle
        myObstacles[i].update();  // Update the obstacle's position
    }

    // Update collectibles and move them left
    for (var i = 0; i < myCollectibles.length; i++) {
        myCollectibles[i].x -= 1;  // Move the collectible
        myCollectibles[i].update();  // Update the collectible's position
    }

    mySamples.text = "Samples: " + SamplesCount;  // Update the Samples display
    mySamples.update();  // Redraw the Samples
    myGamePiece.newPos();  // Update the game piece's position
    myGamePiece.update();  // Redraw the game piece

    requestAnimationFrame(updateGameArea);  // Continue the game loop
}

// Sound class to manage sound effects and music
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;  // Set the sound source
    this.sound.setAttribute("preload", "auto");
    this.sound.style.display = "none";  // Hide the audio element
    document.body.appendChild(this.sound);  // Append the sound element to the body
    this.play = function() {
        this.sound.play();  // Play the sound
    };
    this.stop = function() {
        this.sound.pause();  // Pause the sound
    };
    this.setVolume = function(value) {
        this.sound.volume = value;  // Adjust the sound volume
    };
    this.mute = function() {
        this.sound.muted = true;  // Mute the sound
    };
    this.unmute = function() {
        this.sound.muted = false;  // Unmute the sound
    };
}

// Check if the current frame number is a multiple of n
function everyinterval(n) {
    return (myGameArea.frameNo / n) % 1 === 0;
}

// Movement functions for controlling the game piece
function moveup() {
    myGamePiece.speedY = -1;  // Move the game piece up
}

function movedown() {
    myGamePiece.speedY = 1;  // Move the game piece down
}

function moveleft() {
    myGamePiece.speedX = -1;  // Move the game piece left
}

function moveright() {
    myGamePiece.speedX = 1;  // Move the game piece right
}

function clearmove() {
    myGamePiece.speedX = 0;  // Stop horizontal movement
    myGamePiece.speedY = 0;  // Stop vertical movement
}

// Pause or continue the game
function pauseOrContinueGame() {
    gamePaused = !gamePaused;  // Toggle gamePaused state
    if (gamePaused) {
        myMusic.stop();  // Stop the music when paused
        document.getElementById("pauseImage").style.display = "block";  // Show pause image
    } else {
        myMusic.play();  // Resume the music when continued
        document.getElementById("pauseImage").style.display = "none";  // Hide pause image
    }
}

// Adjust the game music volume
function adjustVolume(value) {
    myMusic.setVolume(value);  // Set the music volume to the input value
}

// Mute or unmute the game music
function toggleMute() {
    if (isMuted) {
        myMusic.unmute();  // Unmute the music
        isMuted = false;  // Set isMuted to false
        document.getElementById("muteButton").innerText = "Mute";  // Update the mute button text
    } else {
        myMusic.mute();  // Mute the music
        isMuted = true;  // Set isMuted to true
        document.getElementById("muteButton").innerText = "Unmute";  // Update the mute button text
    }
}

// Display the Game Over message
function showGameOver() {
    document.getElementById("gameOverText").style.display = "block";  // Show the Game Over text
}

// Reset the game
function resetGame() {
    myGameArea.stop();  // Stop the game
    startGame();  // Restart the game
}
