const express = require("express");
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const toUserId = req.body.toUserId;
        const fromUserId = req.body._id
        const status = req.body.status

        const allowedStatus = ["Interested", "Ignored"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status type: " + status });
        }

        const toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).json({ message: "User not found!" })
        }

        const existingConnection = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        })
        if (existingConnection) {
            return res.status(400).send({ message: "Connection Request Already Exist!" })
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });

        const data = await connectionRequest.save();

        res.json({
            message: req.user.firstname + "is" + status + "in" + toUser.firstName,
            data
        })

    } catch (err) {
        res.status(400).send("Error:" + err.message)
    }
})

requestRouter.post("/request/review/:status/:requstId", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const { status, requstId } = req.params;

        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ messaage: "Status not allowed!" });
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requstId,
            status: "interested",
            toUserId: loggedInUser._id
        })

        if (!connectionRequest) {
            return res
                .status(404)
                .json({ message: "Connection request not found" });
        }

        connectionRequest.status = status;

        const data = await connectionRequest.save();

        res.json({ message: "Connection request " + status, data });
    } catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }

})

module.exports = requestRouter;