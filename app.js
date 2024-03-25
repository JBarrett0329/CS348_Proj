const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Run = require('./models/run');
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


app.get('/all-runs', (req, res) => {
  Run.find()
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      console.log(err);
    });
});


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
  res.redirect('/runs');
});


app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});


// run routes
app.get('/runs/create', (req, res) => {
  res.render('create', { title: 'Log a new run' });
});

app.get('/runs', (req, res) => {
  Run.find().sort({ createdAt: -1 })
    .then(result => {
      res.render('index', { runs: result, title: 'All runs' });
    })
    .catch(err => {
      console.log(err);
    });
});

app.post('/runs', (req, res) => {
  console.log(res.body);
  const run = new Run(req.body);
  
  run.save()
    .then(result => {
        res.redirect('/runs');
    })
    .catch(err => {
      console.log(err);
    });
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
