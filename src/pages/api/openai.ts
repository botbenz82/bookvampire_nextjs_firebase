import { DEFAULT_OPENAI_MODEL } from "@/shared/Constants";
import { OpenAIModel } from "@/types/Model";

import { NextApiRequest, NextApiResponse } from "next";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

// OpenAI configuration creation
const configuration = new Configuration({
  //@ts-ignore
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI instance creation
const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body;
  const prompt= (body?.prompt ||  "You are a helpful assistant that would help me to chat") as string | undefined;
  const messages = (body?.messages || []) as ChatCompletionRequestMessage[];
  const model = (body?.model) as OpenAIModel;

  try {
    const promptMessage: ChatCompletionRequestMessage = {
      role: "system",
      content: prompt,
    };
    
    const initialMessages: ChatCompletionRequestMessage[] = messages.slice(0, 3);
    const latestMessages: ChatCompletionRequestMessage[] = messages.slice(-5).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const completion = await openai.createChatCompletion({
      model: model.id,
      temperature: 0.5,
      messages: [promptMessage, ...initialMessages, ...latestMessages],
    });

    const responseMessage = completion.data.choices[0]?.message?.content?.trim();

    if (!responseMessage) {
      res.status(400).json({ error: "Unable to get response from OpenAI. Please try again." });
      return;
    }

    res.status(200).json({ message: responseMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred during ping to OpenAI. Please try again.",
    });
    return;
  }
}
