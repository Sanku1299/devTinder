const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/user");
const ConnectionRequest = require("./models/connectionRequest");
const ChatMessage = require("./models/chatMessage");

const pageSize = 50;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicMessage({ _id, senderId, senderName, text, createdAt }) {
  return { _id, senderId, senderName, text, createdAt };
}

function attachChat(server) {
  const origin = process.env.NODE_ENV === "production"
    ? process.env.RENDER_EXTERNAL_URL
    : "http://localhost:5173";
  const io = new Server(server, {
    path: "/api/socket.io",
    cors: { origin, credentials: true },
    allowRequest: (req, done) => done(null, !req.headers.origin || req.headers.origin === origin),
  });
  io.engine.use(cookieParser());
  io.use(async (socket, next) => {
    let session;
    try {
      session = jwt.verify(socket.request.cookies.token, process.env.JWT_SECRET);
    } catch {
      return next(new Error("Please log in to chat."));
    }
    const { targetUserId } = socket.handshake.auth;
    if (!mongoose.isObjectIdOrHexString(targetUserId) || targetUserId === session._id) {
      return next(new Error("Choose someone from your connections."));
    }
    try {
      const user = await User.findById(session._id).select("firstName lastName").lean();
      const accepted = await ConnectionRequest.exists({
        status: "Accepted",
        $or: [
          { fromUserId: session._id, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: session._id },
        ],
      });
      if (!user || !accepted) return next(new Error("Chat is available to accepted connections."));
      socket.data.user = user;
      socket.data.expiresAt = session.exp * 1000;
      socket.data.room = [session._id, targetUserId.toLowerCase()].sort().join(":");
      next();
    } catch {
      next(new Error("Could not open this conversation."));
    }
  });

  io.on("connection", (socket) => {
    const { room, user, expiresAt } = socket.data;
    socket.join(room);
    const expiry = setTimeout(() => socket.disconnect(true), expiresAt - Date.now());
    socket.on("disconnect", () => clearTimeout(expiry));

    socket.on("history", async (before, reply) => {
      if (typeof reply !== "function") return;
      if (before != null && !mongoose.isObjectIdOrHexString(before)) {
        return reply({ error: "Invalid history cursor." });
      }
      try {
        const query = { conversation: room };
        if (before) query._id = { $lt: before };
        const rows = await ChatMessage.find(query).sort({ _id: -1 }).limit(pageSize + 1).lean();
        reply({ messages: rows.slice(0, pageSize).reverse().map(publicMessage), more: rows.length > pageSize });
      } catch {
        reply({ error: "Could not load chat history." });
      }
    });

    socket.on("sendMessage", async (payload, reply) => {
      if (typeof reply !== "function") return;
      const text = typeof payload?.text === "string" ? payload.text.trim() : "";
      if (!text || text.length > 2000 || !uuid.test(payload?.clientId)) {
        return reply({ error: "Enter a message between 1 and 2,000 characters." });
      }
      const key = { conversation: room, senderId: user._id, clientId: payload.clientId };
      try {
        let message;
        try {
          message = await ChatMessage.create({
            ...key, text, senderName: [user.firstName, user.lastName].filter(Boolean).join(" "),
          });
        } catch (err) {
          if (err.code !== 11000) throw err;
          message = await ChatMessage.findOne(key);
        }
        const saved = publicMessage(message);
        io.to(room).emit("messageReceived", saved);
        reply({ message: saved });
      } catch {
        reply({ error: "Could not save your message. Try again." });
      }
    });
  });
  return io;
}

module.exports = attachChat;
