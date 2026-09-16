const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({  //schema create
    title:{
        type:String,
        required:true,
    },
    description:String,
    // image: {
    //     filename: {
    //         type: String,
    //         default: "listingimage",
    //     },
    //     url: {
    //         type: String,
    //         default: "https://unsplash.com/photos/a-single-flower-in-a-glass-vase-on-a-table-AObYtLK1COc",
    //         set: (v) => (v === "" ? "https://unsplash.com/photos/a-single-flower-in-a-glass-vase-on-a-table-AObYtLK1COc" : v),
    //     },
    // },
    image:{
        type:String,
        default:"listingimage",
        
        set:(v) => v === "" ?"https://unsplash.com/photos/a-single-flower-in-a-glass-vase-on-a-table-AObYtLK1COc" :v,
    },
    price:Number,
    location:String,
    country:String,
    reviews:[
     {
        type:Schema.Types.ObjectId,
        ref:"Review"
     },
    ],
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
});

const Listing = mongoose.model("Listing",listingSchema);  //model create
module.exports = Listing;