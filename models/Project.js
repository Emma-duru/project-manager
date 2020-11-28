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


projectSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "project"
})

projectSchema.virtual("date_created_formatted").get(function() {
    return DateTime.fromJSDate(this.date_created).toLocaleString(DateTime.DATE_MED);
})

projectSchema.virtual("due_date_formatted").get(function() {
    return DateTime.fromJSDate(this.due_date).toLocaleString(DateTime.DATE_MED);
})

projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Project", projectSchema);