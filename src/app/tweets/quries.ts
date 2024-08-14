export const queries = `#graphql
    getAllTweets : [Tweet]
    getSignedUrlForTweet(imageType:String,imageName:String):String
    getAllTweetsByID(id:String!) : [Tweet]
`;
