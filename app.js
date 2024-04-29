const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const Run = require('./models/run');
const User = require('./models/user');
const { request } = require('http');



// express app
const app = express();


// connect to mongodb & listen for requests
const dbURI = "mongodb+srv://lexbert38:Jab032903@cluster0.w9ovyw2.mongodb.net/CS348_Project";


mongoose.connect(dbURI)
  .then(result => app.listen(3000))
  .catch(err => console.log(err));


// register view engine
app.set('view engine', 'ejs');


// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.json()); // Parse JSON request body

app.use(morgan('dev'));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});


// mongoose & mongo tests 
// app.get('/new-run', (req, res) => {
//   const run = new Run({
//         name: "Morning Run",
//         distance: 5, // in kilometers
//         time: "07:30", // in HH:MM format
//         date: new Date("2024-03-24") // Date object representing March 24, 2024
//   })


//   run.save()
//     .then(result => {
//       res.send(result);
//     })
//     .catch(err => {
//       console.log(err);
//     });
// });


// app.get('/all-runs', (req, res) => {
//   Run.find()
//     .then(result => {
//       res.send(result);
//     })
//     .catch(err => {
//       console.log(err);
//     });
// });


app.get('/single-run', (req, res) => {
  Run.findById('60aef6fe9e36081f32d03b15')
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      console.log(err);
    });
});


app.get('/', (req, res) => {
  res.redirect('/sign-in');
});


app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});


//user routes
app.get('/new-user', (req, res) => {
  res.render('new-user', { title: 'Create new user'});
})

app.get('/sign-in', (req, res) => {
  res.render('sign-in', { title: 'Sign in to user'});
})

app.post('/new-user', (req, res) => {
  console.log(req.body);
  const atIndex = req.body.email.indexOf("@");
  const username = req.body.email.slice(0, atIndex);

  const user = new User({
    username: username,
    email: req.body.email,
    password: req.body.password
  });

  res.cookie('userId', user._id);
  user.save()
    .then(result => {
        res.redirect('/runs');
    })
    .catch(err => {
      console.log(err);
    });
});

app.post('/sign-in', async (req, res) => {
  const { username_or_email, password } = req.body;

  try {
      // Find user by username or email
      const user = await User.findOne({
          $or: [{ username: username_or_email }, { email: username_or_email }]
      });

      // If user not found, return error
      if (!user) {
          return res.status(401).json({ message: 'Invalid username or email' });
      }

      // Verify password
      if (password != user.password) {
          return res.status(401).json({ message: 'Incorrect password' });
      }
      res.cookie('userId', user._id);

      res.redirect('/runs');
  } catch (err) {
      console.error(err);
  }
});

//run routes
app.get('/runs/create', (req, res) => {
  res.render('create', { title: 'Log a new run' });
});


app.get('/runs', (req, res) => {
  const userId = req.cookies.userId;
  const filter = {};
  filter.user = userId;

  console.log(req.query.distance);
  if (req.query.distance) {
      filter.distance = { $gte: parseFloat(req.query.distance) };
  } else if (req.query.date) {
    filter.date = req.query.date;
  } else if (req.query.duration) {
    filter.duration = { $gte: req.query.duration };
  } else if (req.query.pace) {
    filter.pace = { $gte: parseFloat(req.query.pace)* 60 };
    console.log(filter.pace);
  }

  Run.find(filter).sort({ createdAt: -1 })
      .then(result => {
        if (req.originalUrl.includes('?')) {
          console.log(req.query.option, req.query.value);
          res.render('index', { runs: result, title: 'Filtered runs'});
        } else {
          console.log(req.query.option, req.query.value);
          res.render('index', { runs: result, title: 'All runs'});
        }
      })
      .catch(err => {
          console.log(err);
          res.status(500).send('Error fetching runs');
      });
});

function parseDurationToSeconds(duration) {
  const parts = duration.split(':'); // Split the duration string into parts
  
  let seconds = 0;
  
  // Convert hours, minutes, and seconds to seconds and sum them up
  if (parts.length === 3) {
    seconds += parseInt(parts[0]) * 3600; // Hours to seconds
    seconds += parseInt(parts[1]) * 60; // Minutes to seconds
    seconds += parseInt(parts[2]); // Seconds
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0]) * 60; // Minutes to seconds
    seconds += parseInt(parts[1]); // Seconds
  } else if (parts.length === 1) {
    seconds += parseInt(parts[0]); // Seconds
  }

  return seconds;
}

function formatDuration(durationInput) {
  const durationValue = durationInput;

  // Split the duration string by ':'
  const parts = durationValue.split(':');

  if (parts.length === 2) {
      // Duration does not include hours, add '0:' to the beginning
      return `0:${durationValue}`;
  } else if (parts.length === 3) {
      // Duration already includes hours
      return durationValue;
  } else {
      // Invalid duration format
      console.error('Invalid duration format');
  }
}

app.post('/runs', (req, res) => {
  const userId = req.cookies.userId;
  console.log(userId);

  const { distance, duration } = req.body;
  const dist = parseFloat(distance);
  const durationInSeconds = parseDurationToSeconds(duration);
  const pace = durationInSeconds / dist;
  const newDuration = formatDuration(duration)

  const run = new Run({
      ...req.body,
      duration: newDuration,
      pace: pace,
      user: userId
  });
  
  run.save()
    .then(result => {
        res.redirect('/runs');
    })
    .catch(err => {
      console.log(err);
    });
});



app.post('/apply-filter', (req, res) => {
  const { option, value } = req.body;
  console.log(option, value);
  // Redirect to /runs with the filter option and value as query parameters
  res.redirect(`/runs?${option}=${encodeURIComponent(value)}`);
});


app.post("/runs/:id", async (req, res) => {
  const { id } = req.params;
  const { name, date, duration, distance, notes } = req.body;
  console.log(id);
  try {
    // Find the document by ID and update it
    const updatedDoc = await Run.findByIdAndUpdate(id, { name, date, duration, distance, notes } , { new: true });

    if (!updatedDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    Run.findById(id)
    .then(result => {
      res.render('details', { run: result, title: 'Run Details' })
    })
  } catch (err) {
    console.log(err);
  }
});

app.get('/runs/:id', (req, res) => {
  const id = req.params.id;
  Run.findById(id)
  .then(result => {
    res.render('details', { run: result, title: 'Run Details' })
  })
  .catch(err => {
    console.log(err);
  })
})

app.delete('/runs/:id', (req, res) => {
  const id = req.params.id;

  Run.findByIdAndDelete(id)
    .then(result => {
      res.json({ redirect: '/runs' });
    })
    .catch(err => {
      console.log(err);
    })
})



// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});
