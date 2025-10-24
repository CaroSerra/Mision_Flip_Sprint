import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
    try {
        console.log("DynamoDB Stream Event:", JSON.stringify(event, null, 2));

        for (const record of event.Records) {
            // Solo eventos de INSERT, MODIFY 
            if (record.eventName !== "INSERT" && record.eventName !== "MODIFY") continue;

            const newImage = record.dynamodb.NewImage;
            if (!newImage) continue;

            const clientID = newImage.clientID?.S;
            const speed = newImage.speed?.S;

            if (!clientID || !speed) continue;

            const numericSpeed = parseFloat(speed);
            if (numericSpeed > 100) {
                console.log(`Speed limit exceeded: ${numericSpeed} (clientID: ${clientID})`);

                // Buscamos el webhook del cliente
                const clientResult = await ddbDocClient.send(new GetCommand({
                    TableName: "client",
                    Key: { clientID },
                }));

                if (!clientResult.Item || !clientResult.Item.discordWebhook) {
                    console.warn(`No webhook found for clientID ${clientID}`);
                    continue;
                }

                const webhookURL = clientResult.Item.discordWebhook;

                // Mandar alerta a Discord
                const message = {
                    content: `**Alerta:** Tu furgoneta ha superado los 100 km/h (velocidad actual: ${numericSpeed}).`
                };

                try {
                    const response = await fetch(webhookURL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(message)
                    });

                    if (!response.ok) {
                        console.error(`Error sending message to Discord: ${response.statusText}`);
                    } else {
                        console.log(`Notification sent to Discord for clientID ${clientID}`);
                    }
                } catch (err) {
                    console.error("Failed to send Discord notification:", err);
                }
            }
        }

        return { statusCode: 200, body: JSON.stringify({ message: "Stream processed successfully" }) };

    } catch (error) {
        console.error("Error processing stream:", error);
        return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
    }
};