const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  conversation: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  clientId: { type: String, required: true },
}, { timestamps: true });

chatMessageSchema.index({ conversation: 1, _id: -1 });
chatMessageSchema.index({ conversation: 1, senderId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
