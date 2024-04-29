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
    // validate: {
    //     validator: function (v) {
    //       if (!v) {
    //         return true;
    //       }
    //       return /([01]?[0-9]|2[0-3]):[0-5][0-9]/.test(v);
    //     },
    //     message: (props) => `${props.value} is not valid time!`,
    //   },
    required: true
  },
  pace: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  }, 
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

});

runSchema.index({ distance: 1 });
runSchema.index({ pace: 1 });
runSchema.index({ date: 1 });

const Run = mongoose.model('Run', runSchema);
module.exports = Run;