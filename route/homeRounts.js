const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const _ = require("lodash");
const {User, validateUser} = require("../database/schema/userSchema");
const {Community, validateCommunity} = require("../database/schema/communitySchema");
const {Post, validatePost} = require("../database/schema/postSchema");
const debug = require("debug")("app:debug");
const auth = require("../middleware/authMiddle");

router.get("/", auth, async (req, res) => {

    let posts = await Post.aggregate([
        {
            $lookup: {
                from: "communities",
                localField: "community",
                foreignField: "_id",
                as: "postcom"
            }
        },
        {$unwind: "$postcom"},
        {
            $lookup: {
                from: "users",
                localField: "postcom._id",
                foreignField: "memberOfIds",
                as: "comuser"
            }
        },
        {$unwind: "$comuser"},
        {$match: {$expr: {$in: ["$postcom._id", "$comuser.memberOfIds"]}}},
        {$sort: {"createdAt": -1}},
        {
            $addFields: {
                "postedBy.username": "$comuser.username",
                "community.name": "$postcom.name",
                "likeNum": {$cond: {if: {$isArray: "$likedBies"}, then: {$size: "$likedBies"}, else: "NA"}},
                "dislikeNum": {$cond: {if: {$isArray: "$dislikedBies"}, then: {$size: "$dislikedBies"}, else: "NA"}},
            }
        }
    ])

    let hotCommunities = await Community.aggregate([
        {
            $project: {
                name: 1,
                postNums: {$cond: {if: {$isArray: "$postIds"}, then: {$size: "$postIds"}, else: "NA"}}
            }
        },
        {$sort: {"postNums": -1}},
        {$limit: 5}
    ])

    return res.render("home", {hotCommunities: hotCommunities, posts: posts});
});


router.get("/likes", auth, async (req, res) => {

    let posts = await Post.aggregate([
        {
            $lookup: {
                from: "communities",
                localField: "community",
                foreignField: "_id",
                as: "postcom"
            }
        },
        {$unwind: "$postcom"},
        {
            $lookup: {
                from: "users",
                localField: "postcom._id",
                foreignField: "memberOfIds",
                as: "comuser"
            }
        },
        {$unwind: "$comuser"},
        {$match: {$expr: {$in: ["$postcom._id", "$comuser.memberOfIds"]}}},
        {
            $addFields: {
                "postedBy.username": "$comuser.username",
                "community.name": "$postcom.name",
                "likeNum": {$cond: {if: {$isArray: "$likedBies"}, then: {$size: "$likedBies"}, else: "NA"}},
                "dislikeNum": {$cond: {if: {$isArray: "$dislikedBies"}, then: {$size: "$dislikedBies"}, else: "NA"}},
            }
        },
        {
            $addFields: {
                "diffNum": {$subtract: ["$likeNum", "$dislikeNum"]}
            }
        },
        {$sort: {"diffNum": -1}},
    ])

    let hotCommunities = await Community.aggregate([
        {
            $project: {
                name: 1,
                postNums: {$cond: {if: {$isArray: "$postIds"}, then: {$size: "$postIds"}, else: "NA"}}
            }
        },
        {$sort: {"postNums": -1}},
        {$limit: 5}
    ])

    // console.log(posts)

    return res.render("home", {hotCommunities: hotCommunities, posts: posts});
});


router.get("/comments", auth, async (req, res) => {

});

module.exports = router;
