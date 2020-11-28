const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

taskSchema.virtual("date_created_formatted").get(function() {
    return DateTime.fromJSDate(this.date_created).toLocaleString(DateTime.DATE_MED);
})


module.exports = mongoose.model("Task", taskSchema);