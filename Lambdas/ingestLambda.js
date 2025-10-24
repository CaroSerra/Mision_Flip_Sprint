import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        const method = event.httpMethod;
        const tableName = "vanTelemetry";

        // POST → Insertar nueva telemetría
        if (method === "POST") {
            const data = JSON.parse(event.body);

            if (!data.vanID) {
                return { statusCode: 400, body: JSON.stringify({ message: "Missing vanID" }) };
            }

            await ddbDocClient.send(new PutCommand({
                TableName: tableName,
                Item: data,
            }));

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Data inserted successfully", item: data }),
            };
        }

        // PATCH → Actualizar por vanID
        if (method === "PATCH") {
            const data = JSON.parse(event.body);
            const { vanID, clientID, speed, lat, lon, vanTimestamp } = data;
        
            if (!vanID || !clientID) {
                return { statusCode: 400, body: JSON.stringify({ message: "Missing vanID or clientID in request" }) };
            }
        
            const updateExpressionParts = [];
            const expressionAttributeValues = {};
            const expressionAttributeNames = {};
        
            if (speed !== undefined) {
                updateExpressionParts.push("#speed = :speed");
                expressionAttributeValues[":speed"] = speed;
                expressionAttributeNames["#speed"] = "speed";
            }
            if (lat !== undefined) {
                updateExpressionParts.push("#lat = :lat");
                expressionAttributeValues[":lat"] = lat;
                expressionAttributeNames["#lat"] = "lat";
            }
            if (lon !== undefined) {
                updateExpressionParts.push("#lon = :lon");
                expressionAttributeValues[":lon"] = lon;
                expressionAttributeNames["#lon"] = "lon";
            }
            if (vanTimestamp !== undefined) {
                updateExpressionParts.push("#vanTimestamp = :vanTimestamp");
                expressionAttributeValues[":vanTimestamp"] = vanTimestamp;
                expressionAttributeNames["#vanTimestamp"] = "vanTimestamp";
            }
        
            if (updateExpressionParts.length === 0) {
                return { statusCode: 400, body: JSON.stringify({ message: "No fields to update" }) };
            }
        
            const result = await ddbDocClient.send(new UpdateCommand({
                TableName: tableName,
                Key: { vanID, clientID },
                UpdateExpression: "SET " + updateExpressionParts.join(", "),
                ExpressionAttributeValues: expressionAttributeValues,
                ExpressionAttributeNames: expressionAttributeNames,
                ReturnValues: "ALL_NEW",
            }));
        
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Data updated successfully", updatedItem: result.Attributes }),
            };
        }        

        // GET → Obtener datos
        if (method === "GET") {
            const params = event.queryStringParameters;

            if (params && params.vanID) {
                const result = await ddbDocClient.send(new GetCommand({
                    TableName: tableName,
                    Key: { vanID: params.vanID },
                }));

                if (!result.Item) {
                    return { statusCode: 404, body: JSON.stringify({ message: "Van not found" }) };
                }

                return { statusCode: 200, body: JSON.stringify(result.Item) };
            }

            const result = await ddbDocClient.send(new ScanCommand({ TableName: tableName }));
            return { statusCode: 200, body: JSON.stringify(result.Items) };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ message: `Method ${method} not allowed` }),
        };
    }
    catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};