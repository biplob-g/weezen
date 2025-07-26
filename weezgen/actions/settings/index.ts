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
  clerkId: string,
  type: string
) => {
  try {
    const registered = await client.user.create({
      data: {
        fullname,
        clerkId,
        type,
        subscription: {
          create: {},
        },
      },
      select: {
        fullname: true,
        id: true,
        type: true,
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
          type: true,
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


export const onUpdatePassword = async (password: string) =>{
  try {
    const user = await currentUser();
    if (!user) return null;
    const update = await clerkClient.users.updateduser(user.id, {password})
    if(update){
      return {status : 200, message: "Password updated"}
    }
  } catch (error) {
    console.log(error);
    
  }
}

export const onGetCurrentDomainInfo = async (domain: string) => {
  const user = await currentUser()
  if(!user) return
  try {
    const userDomain = await client.user.findUnique({
      where:{
        clerkId: user.id,
      },
      select:{
        subscription:{
          select:{
            plan:true,
          },
        },
        domains:{
          where:{
            name:{
              contains: domain,
            }
          },
          select:{
          id: true,
          name: true,
          icon: true,
          userId: true,
          chatBot:{
            select:{
              id: true,
              welcomeMessage: true,
              icon: true,
            },
          },
        },
        },
        
      }
    })
    if(userDomain) {
      return userDomain
    }
  } catch (error) {
    console.log(error);
    
  }
}

export const onUpdateDomain = async (id: string, name: string) =>{
  try {
    const domainExist = await client.domain.findFirst({
      where:{
        name:{
          contains: name,
        },
      },
    })
    if(!domainExist) {
      const domain = await client.domain.update({
        where:{
          id,
        },
        data:{
          name,
        },
      })
      if(domain){
        return{
          status: 200,
          message: 'Domain Updated',
        }
      }
      return{
        status: 400,
        message: 'Oops something went wrong',
      }
    }
  } catch (error) {
    console.log(error);
    
  }
}

export const onChatBotImageUpdate = async (id: string, icon: string) =>{
  const user = await currentUser()
  if(!user) return

  try {
    const domain = await client.domain.update({
      where:{
        id,
      },
      data:{
        chatBot:{
          update:{
            data:{
              icon,
            },
          },
        },
      },
    })

    if(domain){
   return{
       status: 400,
      message: 'Domain updated',
   }
    }
    return{
      status: 400,
      message: 'Oops something, went wrong'
    }
  } catch (error) {
    console.log(error);
    
  }
}

export const onUpdateWelcomeMessage = async(
  message: string,
  domainId: string, )=>{
try {
  const update = await client.domain.update({
    where:{
      id: domainId,
    },
    data:{
      chatBot:{
        update:{
          data:{
            welcomeMessage: message,
          },
        },
      },
    },
  })
  if(update){
    return { status: 200, message: 'Welcome message updated'}

  }
} catch (error) {
  console.log(error);
  
}
}