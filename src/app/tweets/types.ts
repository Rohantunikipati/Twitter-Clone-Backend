export const types = `#graphql

    input tweetPayload{
        content:String!
        imageUrl:String
    }

    type Tweet{
        id:String!
        content:String!
        imageUrl:String
        author : User
    }
`;
