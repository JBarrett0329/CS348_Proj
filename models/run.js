const mongoose = require('mongoose');
const internal = require('stream');
const Schema = mongoose.Schema;

const runSchema = new Schema({
  name: {
    type: String,
  },
  distance: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    validate: {
        validator: function (v) {
          if (!v) {
            return true;
          }
          return /([01]?[0-9]|2[0-3]):[0-5][0-9]/.test(v);
        },
        message: (props) => `${props.value} is not valid time!`,
      },
    required: true
  },
  date: {
    type: Date,
    required: true
  }

});

const Run = mongoose.model('Run', runSchema);
module.exports = Run;