"use server";

import { client } from "@/lib/prisma";
import { extractEmailsFromString, extractURLfromString } from "@/lib/utils";
// import { onRealTimeChat } from "../conversation";
import { clerkClient } from "@clerk/nextjs/server";
import { onMailer } from "../mailer";
// OpenAI Import (commented out for Gemini AI migration)
// import OpenAi from "openai";
// const openai = new OpenAi({
//   apiKey: process.env.OPEN_AI_KEY,
// });

// Gemini AI Import
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  onCheckAiCredits,
  onConsumeAiCredit,
  onRecordFlashUsage,
} from "../settings";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const onStoreConversations = async (
  id: string,
  message: string,
  role: "assistant" | "user"
) => {
  console.log(id, ":", message);

  const result = await client.chatRoom.update({
    where: {
      id,
    },
    data: {
      message: {
        create: {
          message,
          role: role === "user" ? "CUSTOMER" : "OWNER",
        },
      },
    },
    include: {
      message: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Return the ID of the newly created message
  return result.message[0]?.id || null;
};

export const onGetCurrentChatBot = async (id: string) => {
  try {
    console.log("🔍 Searching for domain with ID:", id);

    const chatbot = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        helpdesk: {
          select: {
            id: true,
            question: true,
            answered: true,
            domainId: true,
          },
        },
        name: true,
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
            icon: true,
            textColor: true,
            background: true,
            helpdesk: true,
          },
        },
      },
    });

    // If domain exists but has no chatBot, create a default one
    if (chatbot && !chatbot.chatBot) {
      console.log(
        "🔄 Domain found but no chatBot exists, creating default chatBot..."
      );

      const updatedDomain = await client.domain.update({
        where: { id },
        data: {
          chatBot: {
            create: {
              welcomeMessage: "Hello! How can I help you today?",
              helpdesk: true,
            },
          },
        },
        select: {
          helpdesk: {
            select: {
              id: true,
              question: true,
              answered: true,
              domainId: true,
            },
          },
          name: true,
          chatBot: {
            select: {
              id: true,
              welcomeMessage: true,
              icon: true,
              textColor: true,
              background: true,
              helpdesk: true,
            },
          },
        },
      });

      console.log("✅ Default chatBot created:", updatedDomain);
      return updatedDomain;
    }

    console.log("📋 Domain query result:", chatbot);

    if (chatbot) {
      console.log("✅ Domain found:", chatbot.name);
      return chatbot;
    } else {
      console.log("❌ No domain found with ID:", id);
      return null;
    }
  } catch (error) {
    console.error("💥 Database error in onGetCurrentChatBot:", error);
    return null;
  }
};

let customerEmail: string | undefined;

export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: "assistant" | "user"; content: string }[],
  author: "user",
  message: string,
  providedCustomerEmail?: string
) => {
  try {
    console.log("🤖 AI ChatBot Assistant called with:", {
      id,
      chatLength: chat.length,
      author,
      messageLength: message.length,
      providedCustomerEmail,
    });

    const chatBotDomain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        User: {
          select: {
            id: true,
            clerkId: true,
          },
        },
        filterQuestions: {
          where: {
            answered: "",
          },
          select: {
            question: true,
          },
        },
      },
    });

    if (chatBotDomain) {
      console.log("✅ ChatBot domain found:", chatBotDomain.name);

      const extractEmail = extractEmailsFromString(message);
      console.log("📧 Extracted email:", extractEmail);

      // Use provided customer email if available, otherwise extract from message
      if (providedCustomerEmail) {
        customerEmail = providedCustomerEmail;
        console.log("📧 Customer email provided from form:", customerEmail);
      } else if (extractEmail) {
        customerEmail = extractEmail[0];
        console.log("📧 Customer email extracted from message:", customerEmail);
      }

      console.log("🔍 Current customer email:", customerEmail);

      if (customerEmail) {
        console.log(
          "✅ Customer email exists, proceeding with customer logic..."
        );
        const checkCustomer = await client.domain.findUnique({
          where: {
            id,
          },
          select: {
            User: {
              select: {
                clerkId: true,
              },
            },
            name: true,
            customer: {
              where: {
                email: customerEmail,
              },
              select: {
                id: true,
                email: true,
                questions: true,
                chatRoom: {
                  select: {
                    id: true,
                    live: true,
                    mailed: true,
                  },
                },
              },
            },
          },
        });

        console.log("🔍 Customer query result:", checkCustomer);
        console.log(
          "🔍 Customer array length:",
          checkCustomer?.customer?.length
        );

        if (checkCustomer && !checkCustomer.customer.length) {
          const newCustomer = await client.domain.update({
            where: {
              id,
            },
            data: {
              customer: {
                create: {
                  email: customerEmail,
                  questions: {
                    create: chatBotDomain.filterQuestions.map((question) => ({
                      question: question.question,
                      answered: "",
                    })),
                  },
                  chatRoom: {
                    create: {},
                  },
                },
              },
            },
            include: {
              customer: {
                include: {
                  chatRoom: true,
                },
              },
            },
          });
          if (newCustomer) {
            console.log("new customer made");
            const response = {
              role: "assistant",
              content: `Welcome aboard ${customerEmail.split("@")[0]}!
                    I'm glad to connect with you. Is there anything you need help with?`,
            };
            const newlyCreatedCustomer =
              newCustomer.customer[newCustomer.customer.length - 1];
            if (newlyCreatedCustomer?.chatRoom?.[0]?.id) {
              await onStoreConversations(
                newlyCreatedCustomer.chatRoom?.[0]?.id,
                response.content,
                "assistant"
              );
            }
            return { response };
          }
        }
        if (checkCustomer && checkCustomer.customer[0]?.chatRoom?.[0]?.live) {
          await onStoreConversations(
            checkCustomer?.customer[0].chatRoom[0].id,
            message,
            author
          );
          //WIP : Setup realtime mode
          // onRealTimeChat(
          //   checkCustomer.customer[0].chatRoom[0].id,
          //   message,
          //   "user",
          //   author
          // );
          if (!checkCustomer.customer[0]?.chatRoom?.[0]?.mailed) {
            if (checkCustomer && checkCustomer.User?.clerkId) {
              const clerk = await clerkClient();
              const user = await clerk.users.getUser(
                checkCustomer.User.clerkId
              );
              onMailer(user.emailAddresses[0].emailAddress);
            }

            // update mail status to prevent spamming
            const mailed = await client.chatRoom.update({
              where: {
                id: checkCustomer.customer[0]?.chatRoom?.[0]?.id,
              },
              data: {
                mailed: true,
              },
            });

            if (mailed) {
              return {
                live: true,
                chatRoom: checkCustomer.customer[0]?.chatRoom?.[0]?.id,
              };
            }
          }
          return {
            live: true,
            chatRoom: checkCustomer.customer[0]?.chatRoom?.[0]?.id,
          };
        }
        if (checkCustomer?.customer[0]?.chatRoom?.[0]?.id) {
          await onStoreConversations(
            checkCustomer.customer[0]?.chatRoom?.[0]?.id,
            message,
            author
          );
        }
        // OpenAI API call (commented out for Gemini AI migration)
        // const chatCompletion = await openai.chat.completions.create({
        //   model: "gpt-3.5-turbo",
        //   messages: [
        //     {
        //       role: "assistant",
        //       content: `
        // You will get an array of questions that you must ask the customer.
        //
        // Progress the conversation using those questions.
        //
        // Whenever you ask a question from the array, I need you to add a keyword at the end of the question (**complete**) — this keyword is extremely important.
        //
        // Do not forget it.
        //
        // Only add this keyword when you're asking a question from the array of questions. No other question satisfies this condition.
        //
        // Always maintain character and stay respectful.
        //
        // The array of questions: [${chatBotDomain.filterQuestions
        //         .map((questions) => questions.question)
        //         .join(", ")}]
        //
        // If the customer says something out of context or inappropriate, Simply say this is beyond you and you will get a real user to continue the conversation. And add a keyword (realtime) at the end.
        //
        // if the customer agrees to book an appointment send them this link http://localhost:3000/portal/${id}/appointment/${
        //         checkCustomer?.customer[0].id
        //       }
        //
        // if the customer wants to buy a product redirect them to the payment page http://localhost:3000/portal/${id}/payment/${
        //         checkCustomer?.customer[0].id
        //       }
        //       `,
        //     },
        //     ...chat,
        //     {
        //       role: "user",
        //       content: message,
        //     },
        //   ],
        // });

        // Gemini AI API call
        const systemPrompt = `
You will get an array of questions that you must ask the customer.

Progress the conversation using those questions.

Whenever you ask a question from the array, I need you to add a keyword at the end of the question (**complete**) — this keyword is extremely important.

Do not forget it.

Only add this keyword when you're asking a question from the array of questions. No other question satisfies this condition.

Always maintain character and stay respectful.

The array of questions: [${chatBotDomain.filterQuestions
          .map((questions) => questions.question)
          .join(", ")}]

If the customer says something out of context or inappropriate, Simply say this is beyond you and you will get a real user to continue the conversation. And add a keyword (realtime) at the end.

if the customer agrees to book an appointment send them this link http://localhost:3000/portal/${id}/appointment/${
          checkCustomer?.customer[0].id
        }

if the customer wants to buy a product redirect them to the payment page http://localhost:3000/portal/${id}/payment/${
          checkCustomer?.customer[0].id
        }
        `;

        const conversationHistory = chat
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        const fullPrompt = `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nUser: ${message}\n\nAssistant:`;

        console.log("🤖 Generating AI response with Gemini...");
        console.log("🔑 GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);

        if (!process.env.GEMINI_API_KEY) {
          console.error("❌ GEMINI_API_KEY is missing!");
          throw new Error("GEMINI_API_KEY environment variable is required");
        }

        // Check AI credits for the domain owner
        const domainOwnerClerkId = checkCustomer?.User?.clerkId;
        if (!domainOwnerClerkId) {
          throw new Error("Domain owner not found");
        }

        // Get the domain owner's user ID from clerk ID
        const domainOwnerUser = await client.user.findUnique({
          where: { clerkId: domainOwnerClerkId },
          select: { id: true },
        });

        if (!domainOwnerUser) {
          throw new Error("Domain owner user record not found");
        }

        const creditCheck = await onCheckAiCredits(domainOwnerUser.id);
        console.log("💳 Credit check result:", creditCheck);

        // Choose model based on credit availability
        const modelToUse = creditCheck.shouldUsePro ? proModel : flashModel;
        const modelName = creditCheck.shouldUsePro
          ? "gemini-pro"
          : "gemini-flash-lite";

        console.log(
          `🤖 Using ${modelName} model (has pro credits: ${creditCheck.shouldUsePro})`
        );

        const result = await modelToUse.generateContent(fullPrompt);
        console.log("✅ Gemini response received:", result.response.text());

        // ✅ Add null checks for Gemini response
        if (!result || !result.response) {
          console.error("❌ Invalid Gemini response:", result);
          throw new Error("Invalid response from Gemini API");
        }

        const responseText = result.response.text();
        if (!responseText) {
          console.error("❌ Empty response text from Gemini");
          throw new Error("Empty response from Gemini API");
        }

        console.log("✅ Gemini response text:", responseText);

        // Estimate token usage (rough estimation: 4 characters per token)
        const estimatedTokens = Math.ceil(
          (fullPrompt.length + responseText.length) / 4
        );
        console.log(`📊 Estimated tokens used: ${estimatedTokens}`);

        // Store the AI response message first to get the message ID
        let chatMessageId: string | null = null;
        if (checkCustomer?.customer[0]?.chatRoom?.[0]?.id) {
          chatMessageId = await onStoreConversations(
            checkCustomer.customer[0].chatRoom[0].id,
            responseText,
            "assistant"
          );
        }

        // Track AI usage and consume credits if using Pro model
        if (chatMessageId) {
          if (creditCheck.shouldUsePro) {
            console.log("💳 Consuming AI credits for Pro model usage");
            await onConsumeAiCredit(
              domainOwnerUser.id,
              estimatedTokens,
              id, // domainId
              chatMessageId
            );
          } else {
            console.log("📊 Recording Flash model usage (no credits consumed)");
            await onRecordFlashUsage(
              domainOwnerUser.id,
              estimatedTokens,
              id, // domainId
              chatMessageId
            );
          }
        }

        const chatCompletion = {
          choices: [
            {
              message: {
                content: responseText,
              },
            },
          ],
        };

        // ✅ Add null checks for chatCompletion structure
        if (
          !chatCompletion ||
          !chatCompletion.choices ||
          !chatCompletion.choices[0] ||
          !chatCompletion.choices[0].message
        ) {
          console.error("❌ Invalid chatCompletion structure:", chatCompletion);
          throw new Error("Invalid chat completion structure");
        }

        const messageContent = chatCompletion.choices[0].message.content;
        if (!messageContent) {
          console.error("❌ Empty message content in chatCompletion");
          throw new Error("Empty message content from AI");
        }

        console.log("✅ Message content:", messageContent);

        if (messageContent.includes("(realtime)")) {
          const realtime = await client.chatRoom.update({
            where: {
              id: checkCustomer?.customer[0].chatRoom[0].id,
            },
            data: {
              live: true,
            },
          });

          if (realtime) {
            const response = {
              role: "assistant",
              content: messageContent.replace("(realtime)", ""),
            };

            if (checkCustomer?.customer[0]?.chatRoom?.[0]?.id) {
              await onStoreConversations(
                checkCustomer.customer[0]?.chatRoom?.[0]?.id,
                response.content,
                "assistant"
              );
            }

            return { response };
          }
        }
        if (
          chat &&
          chat.length > 0 &&
          chat[chat.length - 1] &&
          chat[chat.length - 1].content &&
          chat[chat.length - 1].content.includes("(complete)")
        ) {
          const firstUnansweredQuestion =
            await client.customerResponses.findFirst({
              where: {
                customerId: checkCustomer?.customer[0].id,
                answered: "",
              },
              select: {
                id: true,
              },
              orderBy: {
                question: "asc",
              },
            });
          if (firstUnansweredQuestion) {
            await client.customerResponses.update({
              where: {
                id: firstUnansweredQuestion.id,
              },
              data: {
                answered: message,
              },
            });
          }
          if (chatCompletion) {
            const generatedLink = extractURLfromString(
              messageContent as string
            );

            if (generatedLink) {
              const link = generatedLink[0];
              const response = {
                role: "assistant",
                content: "Great! you can follow the link to proceed",
                link: link.slice(0, -1),
              };

              if (checkCustomer?.customer[0].chatRoom[0].id) {
                await onStoreConversations(
                  checkCustomer.customer[0].chatRoom[0].id,
                  `${response.content} ${response.link}`,
                  "assistant"
                );
              }

              return { response };
            }

            const response = {
              role: "assistant",
              content: messageContent,
            };

            if (checkCustomer?.customer[0]?.chatRoom?.[0]?.id) {
              await onStoreConversations(
                checkCustomer.customer[0]?.chatRoom?.[0]?.id,
                `${response.content}`,
                "assistant"
              );
            }
            return { response };
          }

          // const response = {
          //   role: "assistant",
          //   content: chatCompletion?.choices?.[0]?.message.content,
          // };

          // if (checkCustomer?.customer[0].chatRoom[0].id) {
          //   await onStoreConversations(
          //     checkCustomer.customer[0].chatRoom[0].id,
          //     `${response.content}`,
          //     "assistant"
          //   );
          // }

          // return { response };
        }
      }

      console.log(
        "🚶 No customer email found, proceeding with general chatbot response..."
      );

      // OpenAI API call (commented out for Gemini AI migration)
      // const chatCompletion = await openai.chat.completions.create({
      //   messages: [
      //     {
      //       role: "assistant",
      //       content: `
      // You are a highly knowledgeable and experienced sales representative for a ${chatBotDomain.name} that offers a valuable product or service. Your goal is to have a natural, human-like conversation with the customer in order to understand their needs, provide relevant information, and ultimately guide them towards making a purchase or redirect them to a link if they haven't provided all relevant information.
      // Right now you are talking to a customer for the first time. Start by giving them a warm welcome on behalf of ${chatBotDomain.name} and make them feel welcomed.
      //
      // Your next task is lead the conversation naturally to get the customer's email address. Be respectful and never break character.
      //       `,
      //     },
      //     ...chat,
      //     {
      //       role: "user",
      //       content: message,
      //     },
      //   ],
      //   model: "gpt-3.5-turbo",
      // });

      // Gemini AI API call
      const systemPrompt = `
You are a highly knowledgeable and experienced sales representative for a ${
        chatBotDomain.name
      } that offers a valuable product or service. Your goal is to have a natural, human-like conversation with the customer in order to understand their needs, provide relevant information, and ultimately guide them towards making a purchase or redirect them to a link if they haven't provided all relevant information.

${
  customerEmail
    ? `The customer has already provided their email address (${customerEmail}) and completed the initial form. You can proceed directly to helping them with their needs without asking for their email again.`
    : `Right now you are talking to a customer for the first time. Start by giving them a warm welcome on behalf of ${chatBotDomain.name} and make them feel welcomed. Your next task is lead the conversation naturally to get the customer's enquiry or any help they need with the service which ${chatBotDomain.name} provides.`
}

Be respectful and never break character.
      `;

      const conversationHistory = chat
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nUser: ${message}\n\nAssistant:`;

      console.log("🤖 Generating AI response with Gemini (no customer)...");
      console.log("🔑 GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);

      if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing!");
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      // Check AI credits for the domain owner (no customer path)
      if (!chatBotDomain?.User?.id) {
        throw new Error("Domain owner not found in no-customer path");
      }

      const creditCheck = await onCheckAiCredits(chatBotDomain.User.id);
      console.log("💳 Credit check result (no customer):", creditCheck);

      // Choose model based on credit availability
      const modelToUse = creditCheck.shouldUsePro ? proModel : flashModel;
      const modelName = creditCheck.shouldUsePro
        ? "gemini-pro"
        : "gemini-flash-lite";

      console.log(
        `🤖 Using ${modelName} model (no customer - has pro credits: ${creditCheck.shouldUsePro})`
      );

      const result = await modelToUse.generateContent(fullPrompt);
      console.log("✅ Gemini response received:", result.response.text());

      // ✅ Add null checks for Gemini response
      if (!result || !result.response) {
        console.error("❌ Invalid Gemini response:", result);
        throw new Error("Invalid response from Gemini API");
      }

      const responseText = result.response.text();
      if (!responseText) {
        console.error("❌ Empty response text from Gemini");
        throw new Error("Empty response from Gemini API");
      }

      console.log("✅ Gemini response text:", responseText);

      // Estimate token usage (rough estimation: 4 characters per token)
      const estimatedTokens = Math.ceil(
        (fullPrompt.length + responseText.length) / 4
      );
      console.log(`📊 Estimated tokens used (no customer): ${estimatedTokens}`);

      // For no-customer path, we can't store the message in a chat room yet,
      // but we still need to track AI usage for billing purposes
      // We'll create a temporary usage record without a chat message ID
      if (creditCheck.shouldUsePro) {
        console.log(
          "💳 Consuming AI credits for Pro model usage (no customer)"
        );
        await onConsumeAiCredit(
          chatBotDomain.User.id,
          estimatedTokens,
          id, // domainId
          "temp-no-customer" // temporary placeholder for chat message ID
        );
      } else {
        console.log(
          "📊 Recording Flash model usage (no customer - no credits consumed)"
        );
        await onRecordFlashUsage(
          chatBotDomain.User.id,
          estimatedTokens,
          id, // domainId
          "temp-no-customer" // temporary placeholder for chat message ID
        );
      }

      const chatCompletion = {
        choices: [
          {
            message: {
              content: responseText,
            },
          },
        ],
      };

      if (
        chatCompletion &&
        chatCompletion.choices &&
        chatCompletion.choices[0]
      ) {
        const response = {
          role: "assistant",
          content: chatCompletion.choices[0].message.content,
        };
        console.log("✅ Returning AI response:", response);
        return { response };
      } else {
        console.error("❌ Invalid chatCompletion structure:", chatCompletion);
        throw new Error("Invalid chat completion structure");
      }
    }
  } catch (error) {
    console.error("❌ AI ChatBot Assistant Error:", error);

    // ✅ Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("GEMINI_API_KEY")) {
        console.error("❌ Gemini API key is missing or invalid");
        return { error: "AI Error: Gemini API key is missing or invalid" };
      } else if (error.message.includes("Invalid response")) {
        console.error("❌ Invalid response from Gemini API");
        return { error: "AI Error: Invalid response from AI service" };
      } else if (error.message.includes("Empty response")) {
        console.error("❌ Empty response from Gemini API");
        return { error: "AI Error: Empty response from AI service" };
      } else {
        console.error("❌ Unexpected error:", error.message);
        return { error: `AI Error: ${error.message}` };
      }
    } else {
      console.error("❌ Unknown error:", error);
      return { error: "AI Error: An unexpected error occurred" };
    }
  }
};
