"use server";

import { client } from "@/lib/prisma";
import { RedirectToSignIn } from "@clerk/nextjs";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { onGetAllAccountDomains } from "../auth";

export const onIntegrateDomain = async (domain: string, icon: string) => {
  const user = await currentUser();
  if (!user) return;
  try {
    const subscription = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        _count: {
          select: {
            domains: true,
          },
        },
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });
    const domainExist = await client.user.findFirst({
      where: {
        clerkId: user.id,
        domains: {
          some: {
            name: domain,
          },
        },
      },
    });

    if (!domainExist) {
      if (
        (subscription?.subscription?.plan == "STANDARD" &&
          subscription._count.domains < 2) ||
        (subscription?.subscription?.plan == "PRO" &&
          subscription._count.domains < 5) ||
        (subscription?.subscription?.plan == "ULTIMATE" &&
          subscription._count.domains < 10)
      ) {
        const newDomain = await client.user.update({
          where: {
            clerkId: user.id,
          },
          data: {
            domains: {
              create: {
                name: domain,
                icon,
                chatBot: {
                  create: {
                    welcomeMessage: "Hey there, have a question? Text us here",
                  },
                },
              },
            },
          },
        });

        if (newDomain) {
          return { status: 200, message: "Domain successfully added" };
        }
      }
      return {
        status: 400,
        message:
          "You've reached the maximum number of domains. Upgrade your plan to add more... ",
      };
    }
    return {
      status: 400,
      message: "Domain already exist",
    };
  } catch (error) {
    console.log(error);
  }
};
export const onCompleteUserRegistration = async (
  fullname: string,
  clerkId: string
) => {
  try {
    const registered = await client.user.create({
      data: {
        fullname,
        clerkId,
        role: "admin", // All users are admins
        subscription: {
          create: {
            plan: "STARTER", // Start with trial plan
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          },
        },
      },
      select: {
        fullname: true,
        id: true,
        role: true,
      },
    });
    if (registered) {
      return { status: 200, user: registered };
    }
  } catch (error) {
    return { status: 400, error };
  }
};

export const onGetSubscriptionPlan = async () => {
  const user = await currentUser();
  if (!user) return;
  try {
    const plan = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
            credits: true,
            aiCreditsUsed: true,
            aiCreditsLimit: true,
            emailCreditsUsed: true,
            emailCreditsLimit: true,
            subscriptionStatus: true,
            trialStartDate: true,
            trialEndDate: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            domains: true,
          },
        },
      },
    });
    if (plan) {
      return {
        status: 200,
        plan: plan.subscription?.plan,
        credits: plan.subscription?.credits,
        aiCreditsUsed: plan.subscription?.aiCreditsUsed || 0,
        aiCreditsLimit: plan.subscription?.aiCreditsLimit || 50,
        emailCreditsUsed: plan.subscription?.emailCreditsUsed || 0,
        emailCreditsLimit: plan.subscription?.emailCreditsLimit || 50,
        subscriptionStatus: plan.subscription?.subscriptionStatus,
        trialStartDate: plan.subscription?.trialStartDate,
        trialEndDate: plan.subscription?.trialEndDate,
        currentPeriodStart: plan.subscription?.currentPeriodStart,
        currentPeriodEnd: plan.subscription?.currentPeriodEnd,
        domains: plan._count.domains,
      };
    }
  } catch (error) {
    return { status: 400, error };
  }
};

export const onLoginUser = async () => {
  const user = await currentUser();
  if (!user) RedirectToSignIn({});
  else {
    try {
      const authenticated = await client.user.findUnique({
        where: {
          clerkId: user.id,
        },
        select: {
          fullname: true,
          id: true,
          role: true,
        },
      });
      if (authenticated) {
        const domains = await onGetAllAccountDomains();
        return { status: 200, user: authenticated, domain: domains?.domains };
      }
    } catch (error) {
      return { status: 400, error };
    }
  }
};

export const onUpdatePassword = async (password: string) => {
  try {
    const user = await currentUser();
    if (!user) return null;
    const clerk = await clerkClient();
    const update = await clerk.users.updateUser(user.id, { password });
    if (update) {
      return { status: 200, message: "Password updated" };
    }
  } catch (error) {
    console.log(error);
  }
};

// Credit Management Functions
export const onCheckAiCredits = async (userId: string) => {
  try {
    const subscription = await client.billings.findUnique({
      where: { userId },
      select: {
        plan: true,
        aiCreditsUsed: true,
        aiCreditsLimit: true,
        subscriptionStatus: true,
      },
    });

    if (!subscription) return { hasCredits: false, shouldUsePro: false };

    const { plan, aiCreditsUsed, aiCreditsLimit } = subscription;

    // For STARTER plan (trial), use credits
    if (plan === "STARTER") {
      return {
        hasCredits: aiCreditsUsed < aiCreditsLimit,
        shouldUsePro: aiCreditsUsed < aiCreditsLimit,
        remainingCredits: Math.max(0, aiCreditsLimit - aiCreditsUsed),
      };
    }

    // For GROWTH and PRO plans, check monthly limits
    if (plan === "GROWTH" || plan === "PRO") {
      const hasProCredits = aiCreditsUsed < aiCreditsLimit;
      return {
        hasCredits: true, // Always has unlimited Flash-Lite after Pro credits
        shouldUsePro: hasProCredits,
        remainingCredits: hasProCredits ? aiCreditsLimit - aiCreditsUsed : 0,
        unlimitedFlash: !hasProCredits,
      };
    }

    return { hasCredits: true, shouldUsePro: false };
  } catch (error) {
    console.error("Error checking AI credits:", error);
    return { hasCredits: false, shouldUsePro: false };
  }
};

export const onConsumeAiCredit = async (
  userId: string,
  tokensUsed: number,
  domainId: string,
  chatMessageId: string
) => {
  try {
    const creditsToConsume = Math.ceil(tokensUsed / 1000); // 1 credit = 1000 tokens

    const result = await client.$transaction(async (tx) => {
      // Update billing credits
      const updatedBilling = await tx.billings.update({
        where: { userId },
        data: {
          aiCreditsUsed: {
            increment: creditsToConsume,
          },
        },
        select: {
          plan: true,
          aiCreditsUsed: true,
          aiCreditsLimit: true,
        },
      });

      // Record AI usage
      await tx.aiUsage.create({
        data: {
          chatMessageId,
          modelUsed: "gemini-pro",
          tokensUsed,
          creditsUsed: creditsToConsume,
          domainId,
          userId,
        },
      });

      return updatedBilling;
    });

    return {
      success: true,
      creditsConsumed: creditsToConsume,
      remainingCredits: Math.max(
        0,
        result.aiCreditsLimit - result.aiCreditsUsed
      ),
    };
  } catch (error) {
    console.error("Error consuming AI credit:", error);
    return { success: false, error: "Failed to consume credits" };
  }
};

export const onRecordFlashUsage = async (
  userId: string,
  tokensUsed: number,
  domainId: string,
  chatMessageId: string
) => {
  try {
    await client.aiUsage.create({
      data: {
        chatMessageId,
        modelUsed: "gemini-flash-lite",
        tokensUsed,
        creditsUsed: 0, // No credits used for Flash model
        domainId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error recording Flash usage:", error);
    return { success: false, error: "Failed to record usage" };
  }
};

export const onResetMonthlyCredits = async (userId: string) => {
  try {
    const subscription = await client.billings.findUnique({
      where: { userId },
      select: { plan: true },
    });

    if (!subscription)
      return { success: false, error: "No subscription found" };

    let aiCreditsLimit = 50; // Default for STARTER
    let emailCreditsLimit = 50; // Default for STARTER

    if (subscription.plan === "GROWTH") {
      aiCreditsLimit = 100;
      emailCreditsLimit = 200;
    } else if (subscription.plan === "PRO") {
      aiCreditsLimit = 500;
      emailCreditsLimit = 1000;
    }

    await client.billings.update({
      where: { userId },
      data: {
        aiCreditsUsed: 0,
        emailCreditsUsed: 0,
        aiCreditsLimit,
        emailCreditsLimit,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting monthly credits:", error);
    return { success: false, error: "Failed to reset credits" };
  }
};

export const onGetCurrentDomainInfo = async (domain: string) => {
  const user = await currentUser();
  if (!user) return;
  try {
    const userDomain = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
        domains: {
          where: {
            name: {
              contains: domain,
            },
          },
          select: {
            id: true,
            name: true,
            icon: true,
            userId: true,
            chatBot: {
              select: {
                id: true,
                welcomeMessage: true,
                icon: true,
              },
            },
          },
        },
      },
    });
    if (userDomain) {
      return userDomain;
    }
    return null;
  } catch (error) {
    console.log(error);
  }
};

export const onUpdateDomain = async (id: string, name: string) => {
  try {
    const domainExist = await client.domain.findFirst({
      where: {
        name: {
          contains: name,
        },
      },
    });
    if (!domainExist) {
      const domain = await client.domain.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });
      if (domain) {
        return {
          status: 200,
          message: "Domain Updated",
        };
      }
      return {
        status: 400,
        message: "Oops something went wrong",
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onChatBotImageUpdate = async (id: string, icon: string) => {
  const user = await currentUser();
  if (!user) return;

  try {
    const domain = await client.domain.update({
      where: {
        id,
      },
      data: {
        chatBot: {
          update: {
            data: {
              icon,
            },
          },
        },
      },
    });

    if (domain) {
      return {
        status: 400,
        message: "Domain updated",
      };
    }
    return {
      status: 400,
      message: "Oops something, went wrong",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onUpdateWelcomeMessage = async (
  message: string,
  domainId: string
) => {
  try {
    const update = await client.domain.update({
      where: {
        id: domainId,
      },
      data: {
        chatBot: {
          update: {
            data: {
              welcomeMessage: message,
            },
          },
        },
      },
    });
    if (update) {
      return { status: 200, message: "Welcome message updated" };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onDeleteUserDomain = async (id: string) => {
  const user = await currentUser();
  if (!user) return;
  try {
    const validUser = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        id: true,
      },
    });
    if (validUser) {
      const deletedDomain = await client.domain.delete({
        where: {
          userId: validUser.id,
          id,
        },
        select: {
          name: true,
        },
      });
      if (deletedDomain) {
        return {
          status: 200,
          message: `${deletedDomain.name} was deleted successfully`,
        };
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const onCreateHelpDeskQuestion = async (
  id: string,
  question: string,
  answer: string
) => {
  try {
    const helpDeskQuestion = await client.domain.update({
      where: {
        id,
      },
      data: {
        helpdesk: {
          create: {
            question,
            answered: answer,
          },
        },
      },
      include: {
        helpdesk: {
          select: {
            id: true,
            question: true,
            answered: true,
          },
        },
      },
    });
    if (helpDeskQuestion) {
      return {
        status: 200,
        message: "New help desk question added",
        question: helpDeskQuestion.helpdesk,
      };
    }
    return {
      status: 400,
      message: "Oops! Something went wrong",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllHelpDeskQuestions = async (id: string) => {
  try {
    const questions = await client.helpDesk.findMany({
      where: {
        domainId: id,
      },
      select: {
        question: true,
        answered: true,
        id: true,
      },
    });
    return {
      status: 200,
      message: "New help desk question added",
      questions: questions,
    };
  } catch (error) {
    console.log(error);
  }
};

export const onCreatedFilterQuestions = async (
  id: string,
  question: string,
  answered: string
) => {
  try {
    const filterQuestion = await client.domain.update({
      where: {
        id,
      },
      data: {
        filterQuestions: {
          create: {
            question,
            answered,
          },
        },
      },
      include: {
        filterQuestions: {
          select: {
            id: true,
            question: true,
            answered: true,
          },
        },
      },
    });
    if (filterQuestion) {
      return {
        status: 200,
        message: "Filter question added",
        question: filterQuestion.filterQuestions,
      };
    }
    return {
      status: 400,
      message: "Oops something went wrong",
    };
  } catch (error) {
    console.log(error);
  }
};

export const onGetAllFilterQuestions = async (id: string) => {
  console.log(id);
  try {
    const questions = await client.filterQuestions.findMany({
      where: {
        domainId: id,
      },
      select: {
        question: true,
        answered: true,
        id: true,
      },
      orderBy: {
        question: "asc",
      },
    });

    return {
      status: 200,
      message: "",
      questions: questions,
    };
  } catch (error) {
    console.log(error);
  }
};

// New function for static generation - fetches all domains
export const getAllDomainsForStaticGeneration = async () => {
  try {
    // Fetch all domains from the database for static generation
    const allDomains = await client.domain.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        User: {
          select: {
            clerkId: true,
          },
        },
      },
    });

    return allDomains;
  } catch (error) {
    console.error("Error fetching domains for static generation:", error);
    return [];
  }
};
