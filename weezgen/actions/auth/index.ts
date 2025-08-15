"use server";

import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

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

export const onGetAllAccountDomains = async () => {
  const user = await currentUser();
  if (!user) return;
  try {
    const domains = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        domains: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });
    return domains;
  } catch (error) {
    console.log(error);
  }
};

export const onLoginUser = async () => {
  const user = await currentUser();
  console.log("onLoginUser - Clerk user:", user?.id);

  if (!user) {
    console.log("No clerk user found");
    return null;
  }

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

    console.log("Database user found:", authenticated);

    if (authenticated) {
      const domains = await onGetAllAccountDomains();
      console.log("User domains:", domains?.domains);
      return { status: 200, user: authenticated, domain: domains?.domains };
    } else {
      console.log("User not found in database, might need registration");
      return null;
    }
  } catch (error) {
    console.log("Database error:", error);
    return { status: 400, error };
  }
};
