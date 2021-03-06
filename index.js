const express = require('express')
const app = express()
const http = require('http').createServer(app);
const port = process.env.PORT || 3000
const io = require('socket.io')(http)
const seedrandom = require('seedrandom')

app.use(express.static('public'))
app.get('/', (req, res) => res.send('Hello World!'))
let newNumbers = []
// TODO: Maybe object with player hash as the key and seed as value
let seeds = []

app.get('/players', (req, res) => {
  res.send({
      "hashes": Object.keys(io.of('/').connected),
      "total": Object.keys(io.of('/').connected).length
  })
})

app.get('/clearAll', (req, res) => {
  newNumbers = []
  seeds = []
  res.send("cleared!")
})

app.get('/seeSeeds', (req, res) => {
  res.send(seeds)
})

app.get('/seeNumbers', (req, res) => {
  res.send(newNumbers)
})

app.get('/newNumber', (req, res) => {
  if (newNumbers.length === 75) {
    newNumbers = []
  }
  let flag = true
  let newNumber = 0
  while(flag) {
    newNumber = Math.floor(Math.random() * (75 - 1)) + 1
    if (!newNumbers.includes(newNumber)) {
      newNumbers.push(newNumber)
      flag = false
    }
  }
  io.emit('newNumber', newNumber)
  res.send("send new numba")
})

function generateSeed() {
  let chars = "ABCDEFGHJKLMNPRTUVWXYZ2346789"
  let ret = "";

  for (let i = 0; i < 4; i++) {
    let c = chars.charAt(Math.random() * chars.length);
    ret += c;
  }

  return ret;
}

function generateBingoCard(seed) {
  let arrayNumbers = [];

  let numbers = [[], [], [], [], []];

  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 15; i++) {
      numbers[j].push((j * 15 + i) + 1)
    }
  }

  seed = seed ? seed : generateSeed();
  let shuffled_numbers = [];
  let rnd = seedrandom(seed);

  for (let i = 0; i < 5; i++) {
    shuffled_numbers[i] = shuffle(numbers[i], rnd);
  }
  // TODO: Check if seed already exists and what to do if it does
  seeds.push(seed)
  return {
    seed: seed,
    numbers: numbers
  }
}

function shuffle(array, rnd) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(rnd() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

io.on('connection', function(socket) {
  io.emit('players', Object.keys(io.of('/').connected).length)
  socket.on('disconnect', function() {
    // TODO: Some cleaning... Perhaps clear old seed from seedlist
    console.log('user disconnected')
    io.emit('players', Object.keys(io.of('/').connected).length)
  });
  socket.on('bingoCard', function(bingoCard){
    if (bingoCard.seed) {
      socket.emit('bingoCard', generateBingoCard(bingoCard.seed))
    } else {
      socket.emit('bingoCard', generateBingoCard())
    }
  });
});



http.listen(port, () => console.log(`Listening in port ${port}`))
