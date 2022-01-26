const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt-nodejs");
const _ = require("lodash");
const debug = require("debug")("app:debug");
const {Community, validateCommunity} = require("../database/schema/communitySchema");
const {User, validateUser} = require("../database/schema/userSchema");
const {Post, validatePost} = require("../database/schema/postSchema");
const auth = require("../middleware/authMiddle");

router.get("/create", auth, async (req, res) => {
    return res.render("createCommunity");
});


router.get("/community/:community_id", auth, async (req, res) => {
    let community = await Community.findById(req.params.community_id)
    let posts = []
    let admins = []

    let isAdmin = false

    for (let i = 0; i < community.postIds.length; i++) {
        let post = await Post.findById(community.postIds[i])
        post.postedBy = await User.findById(post.postedBy)
        post.community = await Community.findById(post.community)
        posts.push(post)
    }

    for (let i = 0; i < community.adminIds.length; i++) {
        let admin = await User.findById(community.adminIds[i])
        admins.push(admin)
        // console.log(req.session.user.username)
        // console.log(admin.username)
        if (req.session.user.username === admin.username) {
            isAdmin = true
        }
    }
    // console.log(isAdmin)
    return res.render("communityPage", {posts: posts, community: community, admins: admins, isAdmin: isAdmin});
});


router.post("/community/:community_id/join", auth, async (req, res) => {
    res.status(200).send("Joined Successfully")
});


router.post("/community/:community_id/unjoin", auth, async (req, res) => {
    res.status(200).send("Joined Successfully")
});



router.post("/create", auth, async (req, res) => {

    let request = {
        name: req.body.communityName,
        description: req.body.description
    };

    const validationResult = validateCommunity(request);
    if (validationResult.error) {
        request.error = validationResult.error.details[0].message;
        return res.render("createCommunity", request);
    }

    let findedUser = await User.findOne({_id: req.session.user._id});

    let communityToCreate = {
        name: request.name,
        description: request.description,
        adminIds: [findedUser._id]
    };

    let createdCommunity = await Community.create(communityToCreate);

    let union = _.union(findedUser.adminOfIds, [createdCommunity._id]);
    findedUser.adminOfIds = union;
    await findedUser.save();
    return res.redirect("/");
});

function validateCreateCommunity(request) {
    const schema = Joi.object({
        communityName: Joi.string().required()
    });

    return schema.validate(request);
}

module.exports = router;