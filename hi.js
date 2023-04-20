const { JsonDatabase } = require('wio.db');
const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

const db = new JsonDatabase({
  databasePath: 'database.json',
});

const app = express();
const port = 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/message', async (req, res) => {
  const query = req.body.query;
  let answer = getAnswer(query);
  if (!answer) {
    answer = await searchGoogle(query);
  }
  res.json({ answer });
});

function getAnswer(query) {
  const cachedAnswer = db.get(`${query}`);
  if (cachedAnswer) {
    console.log(`Cached answer used: ${cachedAnswer}`);
    return cachedAnswer;
  } else {
    console.log(`No cached answer found for: ${query}`);
    return null;
  }
}

async function searchGoogle(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    },
  });
  const html = response.data;
  regex = /<span class="hgKElc">(.*?)<\/span>/;
  match = html.match(regex);
  if (!match) {
    regex = /<div class="Z0LcW t2b5Cf">(.*?)<\/div>/;
    match = html.match(regex);
  }
  
  if (match) {
    const answer = match[1].replace(/<.*?>/g, '');
    db.set(`${query}`, answer);
    console.log(`Answer: ${answer}`);
    return answer;
  } else {
    return "Anlayamadım, başka şekilde sorabilir misin?";
  }
}

app.listen(port, () => console.log(`Server started on port ${port}`));
