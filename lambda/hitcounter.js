const {DynamoDB, Lambda} = require('aws-sdk');

exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // create AWS SDK clients
    const dynamo = new DynamoDB();
    const lambda = new Lambda();

    //update dynamo entry for "path" with hits++
    await dynamo.updateItem({
        TableName: process.env.HITS_TABLE_NAME,
        Key: { path: { S: event.path } },
        UpdateExpression: 'ADD hits :incr',
        ExpressionAttributeValues: { ':incr': { N: '1'} }
    }).promise();

    //call downstream function and capture response
    const resp = await lambda.invoke({
        FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
        Payload: JSON.stringify(event)
    }).promise();

    console.log('downstream response:', JSON.stringify(resp, undefined, 2));

    //return response back to upstream caller
    return JSON.parse(resp.Payload);
};

/**
 * what is lambda handler
 * what is sdk clients
 * dynamo is database. so we are creating a database resource (bucket?) with line 7. then we add entries with the function on line 11.
 * what does calling downstream function mean (upstream too)
 * 
 */