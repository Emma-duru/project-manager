const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter the name of your project"],
    },
    description: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    due_date: {
        type: Date
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    date_created: {
        type: Date,
        default: Date.now
    }
})


projectSchema.virtual("date_created_formatted").get(function() {
    return DateTime.fromJSDate(this.date_created).toLocaleString(DateTime.DATE_MED);
})

module.exports = mongoose.model("Project", projectSchema);